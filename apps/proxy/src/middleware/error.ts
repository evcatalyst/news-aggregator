import logger from '../utils/logger';
import { Request, Response, ErrorRequestHandler } from '../types/express';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorHandler: ErrorRequestHandler = async (err, req, res, next) => {
  const errorDetails = {
    path: req.path,
    method: req.method,
    body: req.body,
    headers: req.headers,
    error: err.message,
    stack: err.stack,
  };

  if (err instanceof ApiError) {
    logger.warn('API Error:', { ...errorDetails, statusCode: err.statusCode });
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  logger.error('Unhandled Error:', errorDetails);
  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
};
