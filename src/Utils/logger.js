"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.logger = exports.Logger = exports.LogLevel = void 0;
const winston_1 = __importDefault(require("winston"));
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
const errorFormatter = winston_1.default.format((info) => {
    if (info.error instanceof Error) {
        info.error = {
            message: info.error.message,
            stack: info.error.stack,
            name: info.error.name,
        };
    }
    return info;
});
const winstonLogger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(errorFormatter(), winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
        }),
        new winston_1.default.transports.File({
            filename: 'error.log',
            level: 'error',
            dirname: 'logs',
        }),
        new winston_1.default.transports.File({
            filename: 'combined.log',
            dirname: 'logs',
        }),
    ],
});
const getRequestContext = (req) => {
    var _a;
    if (!req)
        return {};
    return {
        requestId: req.headers['x-request-id'],
        userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        path: req.path,
        method: req.method,
        ip: req.ip,
    };
};
class Logger {
    constructor(context) {
        this.context = context;
    }
    log(level, message, meta, req) {
        const requestContext = getRequestContext(req);
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: Object.assign(Object.assign(Object.assign({}, requestContext), { service: this.context, environment: process.env.NODE_ENV }), (meta || {}))
        };
        winstonLogger.log(level, message, logEntry);
    }
    error(message, error, meta, req) {
        this.log(LogLevel.ERROR, message, Object.assign(Object.assign({}, meta), { error }), req);
    }
    warn(message, meta, req) {
        this.log(LogLevel.WARN, message, meta, req);
    }
    info(message, meta, req) {
        this.log(LogLevel.INFO, message, meta, req);
    }
    debug(message, meta, req) {
        this.log(LogLevel.DEBUG, message, meta, req);
    }
    child(context) {
        return new Logger(`${this.context ? this.context + ':' : ''}${context}`);
    }
}
exports.Logger = Logger;
exports.logger = new Logger('app');
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    exports.logger.info('Incoming request', {
        url: req.url,
        method: req.method,
        headers: req.headers,
    }, req);
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        exports.logger.info('Request completed', {
            statusCode: res.statusCode,
            duration,
        }, req);
    });
    next();
};
exports.requestLogger = requestLogger;
