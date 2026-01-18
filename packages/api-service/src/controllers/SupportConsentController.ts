import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { SupportConsentService } from '../services/SupportConsentService';
import { logger } from '@monshy/core';
import { ConflictError, NotFoundError } from '@monshy/core';

@injectable()
export class SupportConsentController {
  constructor(
    @inject('SupportConsentService') private supportConsentService: SupportConsentService
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const consent = await this.supportConsentService.createConsent(user, req.body || {});
      res.status(201).json({ success: true, data: consent });
    } catch (error) {
      if (error instanceof ConflictError) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      logger.error({ err: error }, 'Failed to create support consent');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const limit = parseInt(req.query.limit as string) || 100;
      const skip = parseInt(req.query.skip as string) || 0;
      const consents = await this.supportConsentService.listConsentsForTenant(user, limit, skip);
      res.json({ success: true, data: consents, pagination: { limit, skip } });
    } catch (error) {
      if (error instanceof ConflictError) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      logger.error({ err: error }, 'Failed to list support consents');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async revoke(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const consent = await this.supportConsentService.revokeConsent(user, id);
      res.json({ success: true, data: consent });
    } catch (error) {
      if (error instanceof ConflictError) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      logger.error({ err: error }, 'Failed to revoke support consent');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}


