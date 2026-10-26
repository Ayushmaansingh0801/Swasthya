import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'swasthya-dev-jwt-super-secret-key-replace-in-production-32-chars',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'swasthya-dev-jwt-refresh-secret-key-replace-in-production-32-chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  AI_PROVIDER: process.env.AI_PROVIDER || 'mock',
  AI_API_KEY: process.env.AI_API_KEY || '',
  MAP_API_KEY: process.env.MAP_API_KEY || '',
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'mock',
  STORAGE_DIR: process.env.STORAGE_DIR || path.resolve(__dirname, '../../uploads'),
};
