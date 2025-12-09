import { Request, Response, NextFunction } from 'express';
import { logger } from '@monshy/core';

export function securityAuditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId;
  const ip = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  const suspiciousPatterns = [
    /\.\./, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /exec\(/i, // Command injection
  ];
  
  const path = req.path;
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(path) || pattern.test(req.url) || pattern.test(JSON.stringify(req.body))
  );
  
  if (hasSuspiciousPattern) {
    logger.warn({
      requestId,
      ip,
      path,
      userAgent,
      method: req.method,
      body: req.body,
    }, '🚨 Suspicious request detected');
  }
  
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.warn({
        requestId,
        ip,
        path,
        statusCode: res.statusCode,
        userAgent,
      }, '🔒 Authentication/Authorization failure');
    }
  });
  
  next();
}

