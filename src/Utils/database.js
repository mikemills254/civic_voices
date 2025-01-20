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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../Utils/logger");
dotenv_1.default.config();
const dbLogger = logger_1.logger.child('database');
class Database {
    static validateConfig() {
        if (!this.config.uri) {
            throw new Error('Database URL is not configured in environment variables');
        }
    }
    static connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.validateConfig();
                // Set mongoose connection options
                mongoose_1.default.set('strictQuery', true);
                // Listen for connection events
                mongoose_1.default.connection.on('connected', () => {
                    dbLogger.info('MongoDB connection established');
                });
                mongoose_1.default.connection.on('error', (err) => {
                    dbLogger.error('MongoDB connection error', err);
                });
                mongoose_1.default.connection.on('disconnected', () => {
                    dbLogger.warn('MongoDB connection disconnected');
                });
                // Connect to MongoDB
                yield mongoose_1.default.connect(this.config.uri, this.config.options);
                dbLogger.info('Database connected successfully', {
                    host: mongoose_1.default.connection.host,
                    port: mongoose_1.default.connection.port,
                    name: mongoose_1.default.connection.name
                });
                return {
                    success: true,
                    message: 'Database connected successfully'
                };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                dbLogger.error('Failed to connect to database', error, {
                    uri: this.config.uri.replace(/\/\/[^:]+:[^@]+@/, '//:@')
                });
                return {
                    success: false,
                    message: 'Failed to connect to database',
                    error: errorMessage
                };
            }
        });
    }
    static disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (mongoose_1.default.connection.readyState === 0) {
                    return {
                        success: true,
                        message: 'Database is already disconnected'
                    };
                }
                yield mongoose_1.default.disconnect();
                dbLogger.info('Database disconnected successfully');
                return {
                    success: true,
                    message: 'Database disconnected successfully'
                };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                dbLogger.error('Failed to disconnect from database', error);
                return {
                    success: false,
                    message: 'Failed to disconnect from database',
                    error: errorMessage
                };
            }
        });
    }
    static getConnectionStatus() {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
            99: 'uninitialized'
        };
        return states[mongoose_1.default.connection.readyState] || 'unknown';
    }
}
Database.config = {
    uri: process.env.DATABASE_URL || '',
    options: {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
        minPoolSize: 2,
        retryWrites: true,
    }
};
exports.default = Database;
