import { injectable } from 'tsyringe';
import { Secret, ISecret } from '@monshy/database';
import { NotFoundError } from '@monshy/core';
import { logger } from '@monshy/core';

@injectable()
export class SecretRepository {
  async findById(id: string): Promise<ISecret | null> {
    try {
      return await Secret.findById(id).exec();
    } catch (error) {
      logger.error({ err: error, secretId: id }, 'Failed to find secret by id');
      throw error;
    }
  }

  async findByTenantId(tenantId: string): Promise<ISecret[]> {
    try {
      return await Secret.find({ tenantId, isActive: true }).exec();
    } catch (error) {
      logger.error({ err: error, tenantId }, 'Failed to find secrets by tenant');
      throw error;
    }
  }

  async findByTenantIdAndName(tenantId: string, name: string): Promise<ISecret[]> {
    try {
      return await Secret.find({ tenantId, name, isActive: true }).exec();
    } catch (error) {
      logger.error({ err: error, tenantId, name }, 'Failed to find secret by tenant and name');
      throw error;
    }
  }

  async create(data: {
    name: string;
    description?: string;
    secretType: string;
    provider?: string;
    encryptedValue: string;
    salt: string;
    tenantId: string;
    userId: string;
    isActive?: boolean;
  }): Promise<ISecret> {
    try {
      const secret = new Secret({
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
      });
      
      return await secret.save();
    } catch (error) {
      logger.error({ err: error, name: data.name, tenantId: data.tenantId }, 'Failed to create secret');
      throw error;
    }
  }

  async update(id: string, data: Partial<ISecret>): Promise<ISecret> {
    try {
      const secret = await Secret.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec();
      
      if (!secret) {
        throw new NotFoundError('Secret', id);
      }
      
      return secret;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, secretId: id }, 'Failed to update secret');
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await Secret.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundError('Secret', id);
      }
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, secretId: id }, 'Failed to delete secret');
      throw error;
    }
  }
}

