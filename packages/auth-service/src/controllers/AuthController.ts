import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { AuthService } from '../services/AuthService';
import { logger } from '@monshy/core';

@injectable()
export class AuthController {
  constructor(
    @inject('AuthService') private authService: AuthService
  ) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.authService.login(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error({ err: error }, 'Login failed');
      res.status(401).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error({ err: error }, 'Registration failed');
      const statusCode = (error as any).statusCode || 500;
      res.status(statusCode).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.userId) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
        return;
      }

      const userData = await this.authService.getCurrentUser(user.userId);
      res.json(userData);
    } catch (error) {
      logger.error({ err: error }, 'Get current user failed');
      res.status(401).json({
        success: false,
        error: (error as Error).message || 'Invalid or expired token',
      });
    }
  }

  async validate(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          valid: false,
          error: 'Missing or invalid Authorization header',
        });
        return;
      }
      
      const token = authHeader.substring(7);
      const result = await this.authService.validateToken(token);
      
      if (result.valid) {
        res.json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      logger.error({ err: error }, 'Token validation failed');
      res.status(401).json({
        valid: false,
        error: (error as Error).message || 'Token validation failed',
      });
    }
  }
}

