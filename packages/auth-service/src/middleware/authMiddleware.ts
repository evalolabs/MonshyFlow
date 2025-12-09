import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@monshy/auth';
import { UnauthorizedError } from '@monshy/core';
import { logger } from '@monshy/core';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      throw new UnauthorizedError('Token is required');
    }
    
    const payload = verifyToken(token);
    
    (req as any).user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email,
      role: payload.role,
      authMethod: 'JWT',
    };
    
    next();
  } catch (error) {
    logger.warn({ path: req.path, ip: req.ip }, 'Authentication failed');
    res.status(401).json({
      success: false,
      error: error instanceof UnauthorizedError ? error.message : 'Unauthorized',
      code: 'UNAUTHORIZED',
    });
  }
}

