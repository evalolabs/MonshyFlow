import { injectable } from 'tsyringe';
import { AuditLog, IAuditLog } from '@monshy/database';
import { logger } from '@monshy/core';

export interface CreateAuditLogDto {
  userId: string;
  userEmail?: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  tenantId: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

@injectable()
export class AuditLogRepository {
  async create(data: CreateAuditLogDto): Promise<IAuditLog> {
    try {
      const auditLog = new AuditLog({
        ...data,
        timestamp: new Date(),
      });
      return await auditLog.save();
    } catch (error) {
      logger.error({ err: error, data }, 'Failed to create audit log');
      throw error;
    }
  }

  async findByTenantId(tenantId: string, limit: number = 100, skip: number = 0): Promise<IAuditLog[]> {
    try {
      return await AuditLog.find({ tenantId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .exec();
    } catch (error) {
      logger.error({ err: error, tenantId }, 'Failed to find audit logs by tenant');
      throw error;
    }
  }

  async findByUserId(userId: string, limit: number = 100, skip: number = 0): Promise<IAuditLog[]> {
    try {
      return await AuditLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .exec();
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to find audit logs by user');
      throw error;
    }
  }

  async findByResource(resource: string, resourceId: string, limit: number = 100): Promise<IAuditLog[]> {
    try {
      return await AuditLog.find({ resource, resourceId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      logger.error({ err: error, resource, resourceId }, 'Failed to find audit logs by resource');
      throw error;
    }
  }

  async countByTenantId(tenantId: string): Promise<number> {
    try {
      return await AuditLog.countDocuments({ tenantId }).exec();
    } catch (error) {
      logger.error({ err: error, tenantId }, 'Failed to count audit logs by tenant');
      throw error;
    }
  }

  async findSuperAdminAccess(limit: number = 100, skip: number = 0): Promise<IAuditLog[]> {
    try {
      return await AuditLog.find({ userRole: 'superadmin' })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .exec();
    } catch (error) {
      logger.error({ err: error }, 'Failed to find superadmin access logs');
      throw error;
    }
  }
}

