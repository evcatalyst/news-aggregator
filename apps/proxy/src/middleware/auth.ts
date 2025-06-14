import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { Session } from '../types';
import { Request, Response, RequestHandler } from '../types/express';

declare global {
  namespace Express {
    interface Request {
      user?: Session;
    }
  }
}

export const authenticateToken: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const user = jwt.verify(token, config.jwtSecret) as Session;
    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
  next();
};
