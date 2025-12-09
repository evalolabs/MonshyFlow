import { Request, Response, NextFunction } from 'express';
import { AppError } from '@monshy/core';
import { logger } from '@monshy/core';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn({ 
      error: err.message, 
      code: err.code, 
      statusCode: err.statusCode,
      path: req.path 
    }, 'Request failed');
    
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  logger.error({ 
    err, 
    path: req.path,
    method: req.method 
  }, 'Unhandled error');
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}

