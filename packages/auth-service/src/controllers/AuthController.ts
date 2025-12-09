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
}

