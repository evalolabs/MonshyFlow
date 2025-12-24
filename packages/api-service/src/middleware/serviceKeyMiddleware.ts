import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@monshy/core';
import { logger } from '@monshy/core';

/**
 * Middleware für interne Service-zu-Service Kommunikation
 * Validiert X-Service-Key Header
 */
export function serviceKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const serviceKey = req.headers['x-service-key'] as string;
  const expectedKey = process.env.INTERNAL_SERVICE_KEY || 'internal-service-key-change-in-production';
  
  if (!serviceKey || serviceKey !== expectedKey) {
    logger.warn({ path: req.path, ip: req.ip }, 'Service key authentication failed');
    res.status(401).json({
      success: false,
      error: 'Invalid or missing service key',
      code: 'UNAUTHORIZED',
    });
    return;
  }
  
  logger.debug({ path: req.path }, 'Service key authentication successful');
  next();
}

