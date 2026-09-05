import { Request, Response, NextFunction } from 'express';
import { ZodSchema, z } from 'zod';

import { AppError } from './errorHandler.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      return next();
    }
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return next(new AppError(400, 'Invalid request body', { details }));
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (result.success) {
      req.query = result.data as Request['query'];
      return next();
    }
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return next(new AppError(400, 'Invalid query parameters', { details }));
  };
}

export const emptyBodySchema = z.object({});
