import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

// Rate Limiting Strategy:
// - Development/Testing: Disabled (Kong handles rate limiting)
// - Production: Defense-in-depth (backup if Kong is bypassed)
const isDevelopment = process.env.NODE_ENV !== 'production';

// No-op middleware for development (Kong handles rate limiting)
const noOpLimiter = (req: Request, res: Response, next: NextFunction) => {
  next();
};

// In development, disable service-level rate limiting (Kong handles it)
// In production, keep it as defense-in-depth with reasonable limits
export const apiLimiter = isDevelopment
  ? noOpLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per 15 minutes (defense-in-depth)
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
      },
    });

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

