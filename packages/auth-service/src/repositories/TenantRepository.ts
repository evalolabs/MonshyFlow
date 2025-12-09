import { injectable } from 'tsyringe';
import { Tenant, ITenant } from '@monshy/database';
import { NotFoundError } from '@monshy/core';
import { logger } from '@monshy/core';

@injectable()
export class TenantRepository {
  async findById(id: string): Promise<ITenant | null> {
    try {
      return await Tenant.findById(id).exec();
    } catch (error) {
      logger.error({ err: error, tenantId: id }, 'Failed to find tenant by id');
      throw error;
    }
  }

  async findByDomain(domain: string): Promise<ITenant | null> {
    try {
      return await Tenant.findOne({ domain }).exec();
    } catch (error) {
      logger.error({ err: error, domain }, 'Failed to find tenant by domain');
      throw error;
    }
  }

  async findAll(): Promise<ITenant[]> {
    try {
      return await Tenant.find({ isActive: true }).exec();
    } catch (error) {
      logger.error({ err: error }, 'Failed to find all tenants');
      throw error;
    }
  }

  async create(data: {
    name: string;
    domain?: string;
  }): Promise<ITenant> {
    try {
      const tenant = new Tenant({
        ...data,
        isActive: true,
      });
      
      return await tenant.save();
    } catch (error) {
      logger.error({ err: error, data }, 'Failed to create tenant');
      throw error;
    }
  }

  async update(id: string, data: Partial<ITenant>): Promise<ITenant> {
    try {
      const tenant = await Tenant.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec();
      
      if (!tenant) {
        throw new NotFoundError('Tenant', id);
      }
      
      return tenant;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, tenantId: id }, 'Failed to update tenant');
      throw error;
    }
  }
}

