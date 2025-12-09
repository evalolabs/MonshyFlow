import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { SecretsService } from '../services/SecretsService';
import { NotFoundError, ConflictError } from '@monshy/core';
import { logger } from '@monshy/core';

@injectable()
export class SecretsController {
  constructor(
    @inject('SecretsService') private secretsService: SecretsService
  ) {}

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const secrets = await this.secretsService.getByTenantId(user.tenantId);
      res.json({ success: true, data: secrets });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get secrets');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const secret = await this.secretsService.getById(id, user.tenantId);
      res.json({ success: true, data: secret });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to get secret');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async getDecrypted(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const secret = await this.secretsService.getDecrypted(id, user.tenantId);
      res.json({ success: true, data: secret });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to get decrypted secret');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const secret = await this.secretsService.create(user.tenantId, user.userId, req.body);
      res.status(201).json({ success: true, data: secret });
    } catch (error) {
      if (error instanceof ConflictError) {
        res.status(409).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to create secret');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const secret = await this.secretsService.update(id, user.tenantId, req.body);
      res.json({ success: true, data: secret });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else if (error instanceof ConflictError) {
        res.status(409).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to update secret');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      await this.secretsService.delete(id, user.tenantId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to delete secret');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }
}

