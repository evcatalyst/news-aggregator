import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Session } from './index';

export interface Request extends ExpressRequest {
  user?: Session;
}

export interface Response extends ExpressResponse {}

export type RequestHandler = (
  req: Request,
  res: Response,
  next: (error?: any) => void
) => Promise<void | Response> | void | Response;

export type ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: (error?: any) => void
) => Promise<void | Response> | void | Response;
