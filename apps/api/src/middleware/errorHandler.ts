import { Request, Response, NextFunction } from 'express';

interface AppErrorOptions {
  isOperational?: boolean;
  details?: unknown;
}

export class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    public readonly statusCode: number,
    message: string,
    options: AppErrorOptions = {}
  ) {
    super(message);
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      error: err.message,
    };
    if (err.details !== undefined) {
      body.details = err.details;
    }
    return res.status(err.statusCode).json(body);
  }

  console.error('Unhandled error:', err);

  return res.status(500).json({
    error: 'Internal server error',
  });
}