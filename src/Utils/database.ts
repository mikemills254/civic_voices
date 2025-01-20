import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../Utils/logger';

dotenv.config();

const dbLogger = logger.child('database');

interface DatabaseResponse {
    success: boolean;
    message: string;
    error?: string;
}

interface DatabaseConfig {
    uri: string;
    options: mongoose.ConnectOptions;
}

class Database {
    private static config: DatabaseConfig = {
        uri: process.env.DATABASE_URL || '',
        options: {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10,
            minPoolSize: 2,
            retryWrites: true,
        }
    };

    private static validateConfig(): void {
        if (!this.config.uri) {
            throw new Error('Database URL is not configured in environment variables');
        }
    }

    public static async connect(): Promise<DatabaseResponse> {
        try {
            this.validateConfig();

            // Set mongoose connection options
            mongoose.set('strictQuery', true);
            
            // Listen for connection events
            mongoose.connection.on('connected', () => {
                dbLogger.info('MongoDB connection established');
            });

            mongoose.connection.on('error', (err) => {
                dbLogger.error('MongoDB connection error', err);
            });

            mongoose.connection.on('disconnected', () => {
                dbLogger.warn('MongoDB connection disconnected');
            });

            // Connect to MongoDB
            await mongoose.connect(this.config.uri, this.config.options);

            dbLogger.info('Database connected successfully', {
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                name: mongoose.connection.name
            });

            return {
                success: true,
                message: 'Database connected successfully'
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            dbLogger.error('Failed to connect to database', error as Error, {
                uri: this.config.uri.replace(/\/\/[^:]+:[^@]+@/, '//:@')
            });

            return {
                success: false,
                message: 'Failed to connect to database',
                error: errorMessage
            };
        }
    }

    public static async disconnect(): Promise<DatabaseResponse> {
        try {
            if (mongoose.connection.readyState === 0) {
                return {
                    success: true,
                    message: 'Database is already disconnected'
                };
            }

            await mongoose.disconnect();
            
            dbLogger.info('Database disconnected successfully');
            
            return {
                success: true,
                message: 'Database disconnected successfully'
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            dbLogger.error('Failed to disconnect from database', error as Error);

            return {
                success: false,
                message: 'Failed to disconnect from database',
                error: errorMessage
            };
        }
    }

    public static getConnectionStatus(): string {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
            99: 'uninitialized'
        };

        return states[mongoose.connection.readyState] || 'unknown';
    }
}

export default Database;