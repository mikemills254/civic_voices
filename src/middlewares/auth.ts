import { Request, Response, NextFunction } from 'express';
import { verify, JwtPayload } from 'jsonwebtoken';
import { CustomRequest } from '../Utils/utils';

const verifyToken = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            res.status(401).json({ message: 'Access Denied: No token provided' });
            return;
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured');
        }

        const jwtPayload = verify(token, process.env.JWT_SECRET) as JwtPayload;
        (req as CustomRequest).token = jwtPayload;

        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ message: 'Invalid or expired token' });
        return;
    }
};

export default verifyToken;