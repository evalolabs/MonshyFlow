import { injectable, inject } from 'tsyringe';
import { AuditLogRepository, CreateAuditLogDto } from '../repositories/AuditLogRepository';
import { logger } from '@monshy/core';

@injectable()
export class AuditLogService {
  constructor(
    @inject('AuditLogRepository') private auditLogRepo: AuditLogRepository
  ) {}

  /**
   * Log superadmin access to tenant data
   * DSGVO-Konformität: Alle Superadmin-Zugriffe müssen protokolliert werden
   */
  async logSuperAdminAccess(data: {
    userId: string;
    userEmail?: string;
    action: string;
    resource: string;
    resourceId?: string;
    tenantId: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.auditLogRepo.create({
        ...data,
        userRole: 'superadmin',
      });
      
      logger.info({
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        tenantId: data.tenantId,
      }, 'Superadmin access logged');
    } catch (error) {
      // Don't throw - logging should not break the main flow
      logger.error({ err: error, data }, 'Failed to log superadmin access');
    }
  }

  /**
   * Get audit logs for a tenant (only their own data)
   */
  async getTenantAuditLogs(tenantId: string, limit: number = 100, skip: number = 0) {
    try {
      const logs = await this.auditLogRepo.findByTenantId(tenantId, limit, skip);
      const total = await this.auditLogRepo.countByTenantId(tenantId);
      
      return {
        logs,
        total,
        limit,
        skip,
      };
    } catch (error) {
      logger.error({ err: error, tenantId }, 'Failed to get tenant audit logs');
      throw error;
    }
  }

  /**
   * Get all superadmin access logs (only for superadmin)
   */
  async getSuperAdminAccessLogs(limit: number = 100, skip: number = 0) {
    try {
      const logs = await this.auditLogRepo.findSuperAdminAccess(limit, skip);
      return {
        logs,
        limit,
        skip,
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to get superadmin access logs');
      throw error;
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceAuditLogs(resource: string, resourceId: string, limit: number = 100) {
    try {
      return await this.auditLogRepo.findByResource(resource, resourceId, limit);
    } catch (error) {
      logger.error({ err: error, resource, resourceId }, 'Failed to get resource audit logs');
      throw error;
    }
  }
}

