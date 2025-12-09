import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors';
import { logger } from '../logger';

export function ValidationMiddleware(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn({ errors: error.errors }, 'Validation failed');
        // Convert ZodError to format expected by ValidationError
        const errorMap: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errorMap[path]) {
            errorMap[path] = [];
          }
          errorMap[path].push(err.message);
        });
        throw new ValidationError('Validation failed', errorMap);
      }
      next(error);
    }
  };
}

