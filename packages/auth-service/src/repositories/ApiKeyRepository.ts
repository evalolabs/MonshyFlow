import { injectable } from 'tsyringe';
import { ApiKey, IApiKey } from '@monshy/database';
import { NotFoundError } from '@monshy/core';
import { logger } from '@monshy/core';

@injectable()
export class ApiKeyRepository {
  async findById(id: string): Promise<IApiKey | null> {
    try {
      return await ApiKey.findById(id).exec();
    } catch (error) {
      logger.error({ err: error, apiKeyId: id }, 'Failed to find API key by id');
      throw error;
    }
  }

  async findByKeyHash(keyHash: string): Promise<IApiKey | null> {
    try {
      return await ApiKey.findOne({ keyHash, isActive: true }).exec();
    } catch (error) {
      logger.error({ err: error }, 'Failed to find API key by hash');
      throw error;
    }
  }

  async findByTenantId(tenantId: string): Promise<IApiKey[]> {
    try {
      return await ApiKey.find({ tenantId, isActive: true }).exec();
    } catch (error) {
      logger.error({ err: error, tenantId }, 'Failed to find API keys by tenant');
      throw error;
    }
  }

  async create(data: {
    keyHash: string;
    name: string;
    description?: string;
    tenantId: string;
    expiresAt?: Date;
  }): Promise<IApiKey> {
    try {
      const apiKey = new ApiKey({
        ...data,
        isActive: true,
      });
      
      return await apiKey.save();
    } catch (error) {
      logger.error({ err: error, tenantId: data.tenantId }, 'Failed to create API key');
      throw error;
    }
  }

  async update(id: string, data: Partial<IApiKey>): Promise<IApiKey> {
    try {
      const apiKey = await ApiKey.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec();
      
      if (!apiKey) {
        throw new NotFoundError('ApiKey', id);
      }
      
      return apiKey;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, apiKeyId: id }, 'Failed to update API key');
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await ApiKey.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundError('ApiKey', id);
      }
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, apiKeyId: id }, 'Failed to delete API key');
      throw error;
    }
  }
}

