"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.handleGenerateCode = exports.validateEmail = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = require("jsonwebtoken");
const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};
exports.validateEmail = validateEmail;
const handleGenerateCode = (length = 6) => {
    let code = "";
    for (let i = 0; i < length; i++) {
        const randomDigit = crypto_1.default.randomInt(0, 10);
        code += randomDigit.toString();
    }
    return code;
};
exports.handleGenerateCode = handleGenerateCode;
const verifyToken = (req, res, next) => {
    const authorizationHeader = req.headers["authorization"];
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        res.status(401).json({
            message: "Authorization header is missing or invalid",
        });
        return;
    }
    const token = authorizationHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({
            message: "Token is missing",
        });
        return;
    }
    try {
        const jwtPayload = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET, {
            complete: true,
            algorithms: ["HS256"],
            clockTolerance: 0,
            ignoreExpiration: false,
            ignoreNotBefore: false,
        });
        req.token = jwtPayload;
        next();
    }
    catch (error) {
        res.status(401).json({
            message: "Invalid token",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.verifyToken = verifyToken;
