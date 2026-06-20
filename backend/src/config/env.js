const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',

  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/job-tracker',

  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-change-me',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-me',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '30m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'openai/gpt-4o',
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || '',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
};

module.exports = env;