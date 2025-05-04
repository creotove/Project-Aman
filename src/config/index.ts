import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'LOG_FORMAT',
  'LOG_DIR',
  'ORIGIN',
  'DB_HOST',
  'DB_PORT',
  'DB_DATABASE',
  'JWT_ACCESS_EXPIRATION_MINUTES',
  'JWT_PRIVATE_KEY',
  'JWT_SECRET_KEY',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
}

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const NODE_ENV = process.env.NODE_ENV;
export const PORT = process.env.PORT;
export const LOG_FORMAT = process.env.LOG_FORMAT;
export const LOG_DIR = process.env.LOG_DIR;
export const ORIGIN = process.env.ORIGIN;
export const DB_HOST = process.env.DB_HOST;
export const DB_PORT = process.env.DB_PORT;
export const DB_DATABASE = process.env.DB_DATABASE;
export const JWT_ACCESS_EXPIRATION_MINUTES = process.env.JWT_ACCESS_EXPIRATION_MINUTES;
export const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
