"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../models/user");
const jsonwebtoken_1 = require("jsonwebtoken");
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
const utils_1 = require("../Utils/utils");
dotenv_1.default.config();
class Authentication {
    static generateTokens(user) {
        const payload = {
            userId: user._id,
            email: user.email,
        };
        const token = (0, jsonwebtoken_1.sign)(payload, process.env.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRY,
            algorithm: 'HS256'
        });
        const refreshToken = (0, jsonwebtoken_1.sign)(payload, process.env.JWT_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRY,
            algorithm: 'HS256'
        });
        return { token, refreshToken };
    }
    static generateVerificationToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    static validateRegistrationInput(email, username, password) {
        if (!email || !username || !password) {
            return 'Please provide valid details for registration';
        }
        if (!(0, utils_1.validateEmail)(email)) {
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
    static handleRegisterUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, username, password } = req.body;
                const validationError = this.validateRegistrationInput(email, username, password);
                if (validationError) {
                    return res.status(400).json({
                        message: validationError
                    });
                }
                const userExists = yield user_1.User.findOne({ email });
                if (userExists) {
                    return res.status(400).json({
                        message: 'Email already registered'
                    });
                }
                const user = new user_1.User({
                    email,
                    username,
                    password,
                    loginAttempts: 0
                });
                yield user.save();
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
            }
            catch (error) {
                console.error('Registration error:', error);
                return res.status(500).json({
                    message: 'Error registering new user',
                    error: error.message
                });
            }
        });
    }
    static handleLogin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(400).json({
                        message: 'Email and password are required'
                    });
                }
                const user = yield user_1.User.findOne({ email }).select("+password");
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
                const isValidPassword = yield user.comparePassword(password);
                if (!isValidPassword) {
                    user.loginAttempts = (user.loginAttempts || 0) + 1;
                    if (user.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
                        user.lockUntil = new Date(Date.now() + this.LOCK_TIME);
                        yield user.save();
                        return res.status(423).json({
                            message: 'Account locked due to too many failed attempts. Please try again later.'
                        });
                    }
                    yield user.save();
                    return res.status(400).json({
                        message: 'Invalid credentials'
                    });
                }
                user.loginAttempts = 0;
                user.lockUntil = undefined;
                user.lastLogin = new Date();
                yield user.save();
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
            }
            catch (error) {
                console.error('Login error:', error);
                return res.status(500).json({
                    message: 'Error logging in user',
                    error: error.message
                });
            }
        });
    }
    static handleRequestResetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                if (!email || !(0, utils_1.validateEmail)(email)) {
                    return res.status(400).json({
                        message: 'Please provide a valid email address'
                    });
                }
                const user = yield user_1.User.findOne({ email });
                if (!user) {
                    return res.status(200).json({
                        message: 'If an account exists with this email, you will receive a reset code shortly'
                    });
                }
                const resetCode = crypto_1.default.randomInt(100000, 999999).toString();
                const resetCodeExpiry = new Date(Date.now() + 30 * 60 * 1000);
                user.resetCode = resetCode;
                user.resetCodeExpiry = resetCodeExpiry;
                yield user.save();
                console.log("resetCode", resetCode);
                return res.status(200).json({
                    message: 'If an account exists with this email, you will receive a reset code shortly'
                });
            }
            catch (error) {
                console.error('Password reset request error:', error);
                return res.status(500).json({
                    message: 'Error processing password reset request',
                    error: error.message
                });
            }
        });
    }
    static handleResetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const user = yield user_1.User.findOne({
                    email,
                    resetCode,
                    resetCodeExpiry: { $gt: new Date() }
                }).select('+password');
                if (!user) {
                    return res.status(400).json({
                        message: 'Invalid or expired reset code'
                    });
                }
                const isSamePassword = yield user.comparePassword(newPassword);
                if (isSamePassword) {
                    return res.status(400).json({
                        message: 'New password must be different from the current password'
                    });
                }
                user.password = newPassword;
                user.resetCode = undefined;
                user.resetCodeExpiry = undefined;
                yield user.save();
                return res.status(200).json({
                    message: 'Password reset successful'
                });
            }
            catch (error) {
                console.error('Password reset error:', error);
                return res.status(500).json({
                    message: 'Error resetting password',
                    error: error.message
                });
            }
        });
    }
}
Authentication.JWT_EXPIRY = '10h';
Authentication.REFRESH_TOKEN_EXPIRY = '1d';
Authentication.PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,16}$/;
Authentication.MAX_LOGIN_ATTEMPTS = 5;
Authentication.LOCK_TIME = 15 * 60 * 1000;
exports.default = Authentication;
