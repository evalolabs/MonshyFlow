import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@monshy/auth';
import { UnauthorizedError } from '@monshy/core';
import { logger } from '@monshy/core';
import axios from 'axios';

/**
 * Authentication Middleware
 * 
 * Validiert JWT Tokens oder API Keys für geschützte Routes.
 * API Keys werden über Auth Service validiert.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }
    
    const token = authHeader.substring(7); // Remove "Bearer "
    
    if (!token) {
      throw new UnauthorizedError('Token is required');
    }
    
    // Try JWT Token first
    try {
      const payload = verifyToken(token);
      
      (req as any).user = {
        userId: payload.userId,
        tenantId: payload.tenantId,
        email: payload.email,
        role: payload.role,
        authMethod: 'JWT',
      };
      
      logger.debug({ userId: payload.userId, tenantId: payload.tenantId }, 'JWT authentication successful');
      next();
      return;
    } catch (jwtError) {
      // JWT validation failed, try API Key
      logger.debug('JWT validation failed, trying API Key');
    }
    
    // Try API Key validation via Auth Service
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5002';
      const response = await axios.post(
        `${authServiceUrl}/api/auth/validate-apikey`,
        { apiKey: token },
        { timeout: 5000 }
      );
      
      if (response.data.success && response.data.data) {
        const { tenantId, apiKeyId } = response.data.data;
        
        (req as any).user = {
          tenantId,
          apiKeyId,
          authMethod: 'ApiKey',
        };
        
        logger.debug({ tenantId, apiKeyId }, 'API Key authentication successful');
        next();
        return;
      }
    } catch (apiKeyError) {
      // API Key validation failed
      logger.debug('API Key validation failed');
    }
    
    // Both failed
    throw new UnauthorizedError('Invalid or expired token');
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logger.warn({ path: req.path, ip: req.ip }, 'Authentication failed');
      res.status(401).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED',
      });
      return;
    }
    next(error);
  }
}
