import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

export const configureMiddleware = (app: Express): void => {
  // Security headers
  app.use(helmet());
  
  // Rate limiting
  app.use('/api/', limiter);
  
  // Trust proxy - important if you're behind a reverse proxy (Heroku, AWS ELB, etc)
  app.set('trust proxy', 1);
};
