import { Request, Response, NextFunction } from 'express';
import { logger } from '@monshy/core';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const requestId = (req as any).requestId;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const user = (req as any).user;
    
    logger.info({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: user?.userId,
      tenantId: user?.tenantId,
    }, 'Request completed');
  });
  
  next();
}

