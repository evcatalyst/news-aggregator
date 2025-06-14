import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import { authRoutes } from './routes/auth';
import { newsRoutes } from './routes/news';
import { errorHandler } from './middleware/error';
import { configureMiddleware } from './middleware/security';
import logger from './utils/logger';

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, '../static')));

// Security middleware
configureMiddleware(app);

// Routes
app.use('/auth', authRoutes);
app.use('/api', newsRoutes);

// Error handling
app.use(errorHandler);

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});
