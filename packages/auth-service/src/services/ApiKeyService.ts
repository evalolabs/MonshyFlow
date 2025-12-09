import { injectable, inject } from 'tsyringe';
import { ApiKeyRepository } from '../repositories/ApiKeyRepository';
import { generateApiKey, hashApiKey } from '@monshy/auth';
import { NotFoundError } from '@monshy/core';
import { logger } from '@monshy/core';

export interface CreateApiKeyDto {
  name: string;
  description?: string;
  tenantId: string;
  expiresAt?: Date;
}

@injectable()
export class ApiKeyService {
  constructor(
    @inject('ApiKeyRepository') private apiKeyRepo: ApiKeyRepository
  ) {}

  async create(data: CreateApiKeyDto): Promise<{ apiKey: string; id: string }> {
    // Generate API Key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);

    // Save hashed key
    const saved = await this.apiKeyRepo.create({
      keyHash,
      name: data.name,
      description: data.description,
      tenantId: data.tenantId,
      expiresAt: data.expiresAt,
    });

    logger.info({ apiKeyId: saved._id.toString(), tenantId: data.tenantId }, 'API Key created');

    // Return plain key only once (for user to save)
    return {
      apiKey,
      id: saved._id.toString(),
    };
  }

  async findByTenantId(tenantId: string) {
    return this.apiKeyRepo.findByTenantId(tenantId);
  }

  async findById(id: string) {
    const apiKey = await this.apiKeyRepo.findById(id);
    if (!apiKey) {
      throw new NotFoundError('ApiKey', id);
    }
    return apiKey;
  }

  async validateApiKey(apiKey: string): Promise<{ tenantId: string; apiKeyId: string } | null> {
    const keyHash = hashApiKey(apiKey);
    const apiKeyDoc = await this.apiKeyRepo.findByKeyHash(keyHash);

    if (!apiKeyDoc || !apiKeyDoc.isActive) {
      return null;
    }

    // Check expiration
    if (apiKeyDoc.expiresAt && apiKeyDoc.expiresAt < new Date()) {
      return null;
    }

    // Update last used
    await this.apiKeyRepo.update(apiKeyDoc._id.toString(), {
      lastUsedAt: new Date(),
    });

    return {
      tenantId: apiKeyDoc.tenantId,
      apiKeyId: apiKeyDoc._id.toString(),
    };
  }

  async revoke(id: string) {
    const apiKey = await this.apiKeyRepo.findById(id);
    if (!apiKey) {
      throw new NotFoundError('ApiKey', id);
    }

    await this.apiKeyRepo.update(id, { isActive: false });
    logger.info({ apiKeyId: id }, 'API Key revoked');
  }

  async delete(id: string) {
    return this.apiKeyRepo.delete(id);
  }
}

