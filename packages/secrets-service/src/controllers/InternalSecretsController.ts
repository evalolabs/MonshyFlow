import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { SecretsService } from '../services/SecretsService';
import { logger } from '@monshy/core';

@injectable()
export class InternalSecretsController {
  constructor(
    @inject('SecretsService') private secretsService: SecretsService
  ) {}

  /**
   * Internal endpoint for other services to get secrets
   * Requires X-Service-Key header
   */
  private isAuthorized(req: Request): boolean {
    const serviceKey = req.headers['x-service-key'] as string;
    const expectedKey = process.env.INTERNAL_SERVICE_KEY || 'internal-service-key-change-in-production';
    return serviceKey === expectedKey;
  }

  async getSecretsByTenant(req: Request, res: Response): Promise<void> {
    try {
      if (!this.isAuthorized(req)) {
        logger.warn({ path: req.path, ip: req.ip }, 'Unauthorized internal request');
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { tenantId } = req.params;
      const secrets = await this.secretsService.getByTenantId(tenantId);
      
      // Decrypt all secrets for internal use
      const decryptedSecrets = await Promise.all(
        secrets.map(async (secret) => {
          try {
            const decrypted = await this.secretsService.getDecrypted(secret.id, tenantId);
            return {
              name: decrypted.name,
              value: decrypted.value,
              secretType: secret.secretType,
              provider: secret.provider,
            };
          } catch (error) {
            logger.error({ err: error, secretId: secret.id }, 'Failed to decrypt secret');
            return null;
          }
        })
      );

      const validSecrets = decryptedSecrets.filter(s => s !== null);
      
      logger.info({ tenantId, count: validSecrets.length }, 'Returning decrypted secrets for tenant');
      res.json({ success: true, data: validSecrets });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get secrets by tenant');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getSecretByName(req: Request, res: Response): Promise<void> {
    try {
      if (!this.isAuthorized(req)) {
        logger.warn({ path: req.path, ip: req.ip }, 'Unauthorized internal request');
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { tenantId, name } = req.params;
      const secret = await this.secretsService.getDecryptedByName(tenantId, name);
      
      if (!secret) {
        res.status(404).json({ success: false, error: 'Secret not found' });
        return;
      }

      res.json({ success: true, data: secret });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get secret by name');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}

