"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : null;
        if (!token) {
            res.status(401).json({ message: 'Access Denied: No token provided' });
            return;
        }
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured');
        }
        const jwtPayload = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET);
        req.token = jwtPayload;
        next();
    }
    catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ message: 'Invalid or expired token' });
        return;
    }
};
exports.default = verifyToken;
