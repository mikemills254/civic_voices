import { Request, Response } from 'express';
import { IUser, User } from '../models/user';
import { sign } from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { validateEmail } from '../Utils/utils';

dotenv.config();

interface AuthResponse {
    message: string;
    token?: string;
    refreshToken?: string;
    error?: string;
    user?: Partial<IUser>;
}

class Authentication {
    private static readonly JWT_EXPIRY = '10h';
    private static readonly REFRESH_TOKEN_EXPIRY = '1d';
    private static readonly PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,16}$/;
    private static readonly MAX_LOGIN_ATTEMPTS = 5;
    private static readonly LOCK_TIME = 15 * 60 * 1000;

    private static generateTokens(user: IUser) {
        const payload = {
            userId: user._id,
            email: user.email,
        };

        const token = sign(
            payload,
            process.env.JWT_SECRET!,
            {
                expiresIn: this.JWT_EXPIRY,
                algorithm: 'HS256'
            }
        );

        const refreshToken = sign(
            payload,
            process.env.JWT_SECRET!,
            {
                expiresIn: this.REFRESH_TOKEN_EXPIRY,
                algorithm: 'HS256'
            }
        );

        return { token, refreshToken };
    }

    private static generateVerificationToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    private static validateRegistrationInput(
        email: string,
        username: string,
        password: string
    ): string | null {
        if (!email || !username || !password) {
            return 'Please provide valid details for registration';
        }
        
        if (!validateEmail(email)) {
            return 'Invalid email address';
        }
        
        if (!this.PASSWORD_REGEX.test(password)) {
            return 'Password must be 8-16 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character';
        }
        
        if (username.length < 3 || username.length > 30) {
            return 'Username must be between 3 and 30 characters';
        }
        
        return null;
    }


    static async handleRegisterUser(req: Request, res: Response): Promise<Response<AuthResponse>> {
        try {
            const { email, username, password } = req.body;
            
            const validationError = this.validateRegistrationInput(email, username, password);
            if (validationError) {
                return res.status(400).json({
                    message: validationError
                });
            }

            
            
            const userExists = await User.findOne({ email });
            
            if (userExists) {
                return res.status(400).json({
                    message: 'Email already registered'
                });
            }
            
            const user = new User({
                email,
                username,
                password,
                loginAttempts: 0
            });
            
            await user.save();
            
            const { token, refreshToken } = this.generateTokens(user);
            
            return res.status(201).json({
                message: 'Registration successful',
                token,
                refreshToken,
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username
                }
            });
        } catch (error: any) {
            console.error('Registration error:', error);
            return res.status(500).json({
                message: 'Error registering new user',
                error: error.message
            });
        }
    }

    static async handleLogin(req: Request, res: Response): Promise<Response<AuthResponse>> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    message: 'Email and password are required'
                });
            }

            const user = await User.findOne({ email }).select("+password")
            if (!user) {
                return res.status(400).json({
                    message: 'Invalid credentials'
                });
            }

            if (user.isLocked) {
                const lockTimeRemaining = user.lockUntil ? 
                    new Date(user.lockUntil).getTime() - Date.now() : 0;
                    
                return res.status(423).json({
                    message: `Account is locked. Please try again in ${Math.ceil(lockTimeRemaining / 60000)} minutes`
                });
            }

            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                user.loginAttempts = (user.loginAttempts || 0) + 1;

                if (user.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
                    user.lockUntil = new Date(Date.now() + this.LOCK_TIME);
                    await user.save();
                    
                    return res.status(423).json({
                        message: 'Account locked due to too many failed attempts. Please try again later.'
                    });
                }

                await user.save();
                return res.status(400).json({
                    message: 'Invalid credentials'
                });
            }

            user.loginAttempts = 0;
            user.lockUntil = undefined;
            user.lastLogin = new Date();
            await user.save();

            const { token, refreshToken } = this.generateTokens(user);

            return res.status(200).json({
                message: 'Login successful',
                token,
                refreshToken,
                user: {
                    _id: user._id,
                    email: user.email,
                    username: user.username,
                    lastLogin: user.lastLogin
                }
            });
        } catch (error: any) {
            console.error('Login error:', error);
            return res.status(500).json({
                message: 'Error logging in user',
                error: error.message
            });
        }
    }

    static async handleRequestResetPassword(req: Request, res: Response): Promise<Response<AuthResponse>> {
        try {
            const { email } = req.body;

            if (!email || !validateEmail(email)) {
                return res.status(400).json({
                    message: 'Please provide a valid email address'
                });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(200).json({
                    message: 'If an account exists with this email, you will receive a reset code shortly'
                });
            }

            const resetCode = crypto.randomInt(100000, 999999).toString();
            const resetCodeExpiry = new Date(Date.now() + 30 * 60 * 1000);

            user.resetCode = resetCode;
            user.resetCodeExpiry = resetCodeExpiry;
            await user.save();

            console.log("resetCode", resetCode)

            return res.status(200).json({
                message: 'If an account exists with this email, you will receive a reset code shortly'
            });
        } catch (error: any) {
            console.error('Password reset request error:', error);
            return res.status(500).json({
                message: 'Error processing password reset request',
                error: error.message
            });
        }
    }

    static async handleResetPassword(req: Request, res: Response): Promise<Response<AuthResponse>> {
        try {
            const { email, resetCode, newPassword } = req.body;

            if (!email || !resetCode || !newPassword) {
                return res.status(400).json({
                    message: 'All fields are required'
                });
            }

            if (!this.PASSWORD_REGEX.test(newPassword)) {
                return res.status(400).json({
                    message: 'Password must be 8-16 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character'
                });
            }

            const user = await User.findOne({
                email,
                resetCode,
                resetCodeExpiry: { $gt: new Date() }
            }).select('+password');

            if (!user) {
                return res.status(400).json({
                    message: 'Invalid or expired reset code'
                });
            }

            const isSamePassword = await user.comparePassword(newPassword);
            if (isSamePassword) {
                return res.status(400).json({
                    message: 'New password must be different from the current password'
                });
            }

            user.password = newPassword;
            user.resetCode = undefined;
            user.resetCodeExpiry = undefined;
            await user.save();

            return res.status(200).json({
                message: 'Password reset successful'
            });
        } catch (error: any) {
            console.error('Password reset error:', error);
            return res.status(500).json({
                message: 'Error resetting password',
                error: error.message
            });
        }
    }
}

export default Authentication;