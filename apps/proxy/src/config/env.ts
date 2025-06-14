import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 3001,
  newsApiKey: process.env.NEWS_API_KEY,
  xaiApiKey: process.env.XAI_API_KEY,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  nodeEnv: process.env.NODE_ENV || 'development',
  cacheMaxAge: 5 * 60 * 1000, // 5 minutes in milliseconds
} as const;

// Validate required environment variables
const requiredEnvVars = ['NEWS_API_KEY', 'XAI_API_KEY'] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
