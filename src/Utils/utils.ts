import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";


export const validateEmail = (email: string ) => {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}


export const handleGenerateCode = (length: number = 6): string => {
    let code = "";

    for (let i = 0; i < length; i++) {
        const randomDigit = crypto.randomInt(0, 10);
        code += randomDigit.toString();
    }

    return code;
};

export interface CustomRequest extends Request {
    token?: JwtPayload;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
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
        const jwtPayload = verify(token, process.env.JWT_SECRET!, {
            complete: true,
            algorithms: ["HS256"],
            clockTolerance: 0,
            ignoreExpiration: false,
            ignoreNotBefore: false,
        }) as JwtPayload;

        (req as CustomRequest).token = jwtPayload;
        next();
    } catch (error: any) {
        res.status(401).json({
            message: "Invalid token",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};