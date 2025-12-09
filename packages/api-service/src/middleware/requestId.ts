import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID Middleware
 * 
 * Fügt eine eindeutige Request-ID zu jedem Request hinzu.
 * Wichtig für Tracing und Audit-Logs.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate or use existing request ID
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Add to request
  (req as any).requestId = requestId;
  
  // Add to response header
  res.setHeader('X-Request-ID', requestId);
  
  next();
}

