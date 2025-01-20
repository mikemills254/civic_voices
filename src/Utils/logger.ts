import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug'
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    error?: Error;
    requestId?: string;
    userId?: string;
    path?: string;
    method?: string;
}

const errorFormatter = winston.format((info) => {
    if (info.error instanceof Error) {
        info.error = {
            message: info.error.message,
            stack: info.error.stack,
            name: info.error.name,
        };
    }
    return info;
});

const winstonLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        errorFormatter(),
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        new winston.transports.File({
            filename: 'error.log',
            level: 'error',
            dirname: 'logs',
        }),
        new winston.transports.File({
            filename: 'combined.log',
            dirname: 'logs',
        }),
    ],
});

const getRequestContext = (req?: Request) => {
    if (!req) return {};

    return {
        requestId: req.headers['x-request-id'],
        userId: (req as any).user?.id,
        path: req.path,
        method: req.method,
        ip: req.ip,
    };
};

export class Logger {
    private context?: string;

    constructor(context?: string) {
        this.context = context;
    }

    private log(level: LogLevel, message: string, meta?: Record<string, any>, req?: Request) {
        const requestContext = getRequestContext(req);
        
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: {
                ...requestContext,
                service: this.context,
                environment: process.env.NODE_ENV,
                ...(meta || {}),
            }
        };

        winstonLogger.log(level, message, logEntry);
    }

    error(message: string, error?: Error, meta?: Record<string, any>, req?: Request) {
        this.log(LogLevel.ERROR, message, {
            ...meta,
            error,
        }, req);
    }

    warn(message: string, meta?: Record<string, any>, req?: Request) {
        this.log(LogLevel.WARN, message, meta, req);
    }

    info(message: string, meta?: Record<string, any>, req?: Request) {
        this.log(LogLevel.INFO, message, meta, req);
    }

    debug(message: string, meta?: Record<string, any>, req?: Request) {
        this.log(LogLevel.DEBUG, message, meta, req);
    }

    child(context: string): Logger {
        return new Logger(`${this.context ? this.context + ':' : ''}${context}`);
    }
}

export const logger = new Logger('app');

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    logger.info('Incoming request', {
        url: req.url,
        method: req.method,
        headers: req.headers,
    }, req);

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('Request completed', {
            statusCode: res.statusCode,
            duration,
        }, req);
    });

    next();
};