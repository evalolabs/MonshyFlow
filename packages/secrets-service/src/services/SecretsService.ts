import { injectable, inject } from 'tsyringe';
import { SecretRepository } from '../repositories/SecretRepository';
import { EncryptionService } from './EncryptionService';
import { ConflictError, NotFoundError } from '@monshy/core';
import { logger } from '@monshy/core';

export interface CreateSecretDto {
  name: string;
  description?: string;
  value: string;
  secretType: string;
  provider?: string;
  isActive?: boolean;
}

export interface UpdateSecretDto {
  name?: string;
  description?: string;
  value?: string;
  secretType?: string;
  provider?: string;
  isActive?: boolean;
}

@injectable()
export class SecretsService {
  constructor(
    @inject('SecretRepository') private secretRepo: SecretRepository,
    @inject('EncryptionService') private encryptionService: EncryptionService
  ) {}

  async create(tenantId: string, userId: string, data: CreateSecretDto): Promise<any> {
    // Check if secret with same name already exists
    const existing = await this.secretRepo.findByTenantIdAndName(tenantId, data.name);
    if (existing.length > 0) {
      throw new ConflictError(`Secret with name '${data.name}' already exists for this tenant`);
    }

    // Encrypt the value
    const { encryptedValue, salt } = this.encryptionService.encrypt(data.value);

    // Create secret
    const secret = await this.secretRepo.create({
      name: data.name,
      description: data.description,
      secretType: data.secretType,
      provider: data.provider,
      encryptedValue,
      salt,
      tenantId,
      userId,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    logger.info({ secretId: secret._id.toString(), tenantId, name: data.name }, 'Secret created');

    return this.toResponse(secret);
  }

  async getById(id: string, tenantId: string): Promise<any> {
    const secret = await this.secretRepo.findById(id);
    
    if (!secret || secret.tenantId !== tenantId) {
      throw new NotFoundError('Secret', id);
    }

    return this.toResponse(secret);
  }

  async getByTenantId(tenantId: string): Promise<any[]> {
    const secrets = await this.secretRepo.findByTenantId(tenantId);
    return secrets.map(s => this.toResponse(s));
  }

  async getDecrypted(id: string, tenantId: string): Promise<{ name: string; value: string }> {
    const secret = await this.secretRepo.findById(id);
    
    if (!secret || secret.tenantId !== tenantId) {
      throw new NotFoundError('Secret', id);
    }

    const decryptedValue = this.encryptionService.decrypt(secret.encryptedValue, secret.salt);

    return {
      name: secret.name,
      value: decryptedValue,
    };
  }

  async getDecryptedByName(tenantId: string, name: string): Promise<{ name: string; value: string } | null> {
    const secrets = await this.secretRepo.findByTenantIdAndName(tenantId, name);
    const secret = secrets[0];
    
    if (!secret) {
      return null;
    }

    const decryptedValue = this.encryptionService.decrypt(secret.encryptedValue, secret.salt);

    return {
      name: secret.name,
      value: decryptedValue,
    };
  }

  async update(id: string, tenantId: string, data: UpdateSecretDto): Promise<any> {
    const secret = await this.secretRepo.findById(id);
    
    if (!secret || secret.tenantId !== tenantId) {
      throw new NotFoundError('Secret', id);
    }

    // If name is being updated, check for conflicts
    if (data.name && data.name !== secret.name) {
      const existing = await this.secretRepo.findByTenantIdAndName(tenantId, data.name);
      if (existing.length > 0 && existing[0]._id.toString() !== id) {
        throw new ConflictError(`Secret with name '${data.name}' already exists for this tenant`);
      }
    }

    // If value is being updated, re-encrypt
    let encryptedValue = secret.encryptedValue;
    let salt = secret.salt;
    if (data.value) {
      const encrypted = this.encryptionService.encrypt(data.value);
      encryptedValue = encrypted.encryptedValue;
      salt = encrypted.salt;
    }

    const updated = await this.secretRepo.update(id, {
      ...data,
      encryptedValue,
      salt,
    });

    logger.info({ secretId: id, tenantId }, 'Secret updated');

    return this.toResponse(updated);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const secret = await this.secretRepo.findById(id);
    
    if (!secret || secret.tenantId !== tenantId) {
      throw new NotFoundError('Secret', id);
    }

    await this.secretRepo.delete(id);
    logger.info({ secretId: id, tenantId }, 'Secret deleted');

    return true;
  }

  private toResponse(secret: any): any {
    return {
      id: secret._id.toString(),
      name: secret.name,
      description: secret.description,
      secretType: secret.secretType,
      provider: secret.provider,
      tenantId: secret.tenantId,
      userId: secret.userId,
      isActive: secret.isActive,
      createdAt: secret.createdAt,
      updatedAt: secret.updatedAt,
    };
  }
}

