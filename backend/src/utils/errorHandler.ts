import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  // PostgreSQL errors
  if ('code' in err) {
    const pgError = err as any;
    if (pgError.code === '23505') {
      return res.status(409).json({
        error: 'Resource already exists',
        detail: pgError.detail,
      });
    }
    if (pgError.code === '23503') {
      return res.status(400).json({
        error: 'Foreign key constraint violation',
        detail: pgError.detail,
      });
    }
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
