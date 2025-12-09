import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ApiKeyService } from '../services/ApiKeyService';
import { NotFoundError } from '@monshy/core';
import { logger } from '@monshy/core';

@injectable()
export class ApiKeyController {
  constructor(
    @inject('ApiKeyService') private apiKeyService: ApiKeyService
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const result = await this.apiKeyService.create({
        ...req.body,
        tenantId: user.tenantId,
      });
      
      // ⚠️ WICHTIG: API Key wird nur einmal zurückgegeben!
      res.status(201).json({
        success: true,
        data: {
          id: result.id,
          key: result.apiKey, // Nur bei Erstellung sichtbar!
          name: req.body.name,
          description: req.body.description,
          tenantId: user.tenantId,
          createdAt: new Date(),
          expiresAt: req.body.expiresAt,
          isActive: true,
        },
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to create API key');
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const apiKeys = await this.apiKeyService.findByTenantId(user.tenantId);
      
      // API Keys ohne den tatsächlichen Key zurückgeben
      res.json({
        success: true,
        data: apiKeys.map(key => ({
          id: key._id.toString(),
          name: key.name,
          description: key.description,
          tenantId: key.tenantId,
          createdAt: key.createdAt,
          expiresAt: key.expiresAt,
          lastUsedAt: key.lastUsedAt,
          isActive: key.isActive,
        })),
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get API keys');
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }

  async revoke(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.apiKeyService.revoke(id);
      res.json({ success: true, message: 'API Key revoked' });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to revoke API key');
        res.status(500).json({ 
          success: false, 
          error: (error as Error).message 
        });
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.apiKeyService.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to delete API key');
        res.status(500).json({ 
          success: false, 
          error: (error as Error).message 
        });
      }
    }
  }
}

