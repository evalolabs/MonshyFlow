import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { AuditLogService } from '../services/AuditLogService';
import { logger } from '@monshy/core';
import { ROLES } from '@monshy/core';

@injectable()
export class AuditLogController {
  constructor(
    @inject('AuditLogService') private auditLogService: AuditLogService
  ) {}

  // Helper to check if user is superadmin
  private isSuperAdmin(user: any): boolean {
    if (!user) return false;
    if (typeof user.role === 'string') {
      return user.role === ROLES.SUPERADMIN;
    }
    if (Array.isArray(user.roles)) {
      return user.roles.includes(ROLES.SUPERADMIN);
    }
    return false;
  }

  /**
   * Get audit logs for tenant (DSGVO-Konformität: Transparenz)
   * GET /api/audit-logs/tenant/:tenantId
   * Tenants können ihre eigenen Audit-Logs sehen
   */
  async getTenantAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const user = (req as any).user;
      
      // Security: User can only see logs from their own tenant (unless superadmin)
      if (!this.isSuperAdmin(user) && user.tenantId !== tenantId) {
        logger.warn({ 
          requestedTenantId: tenantId, 
          userTenantId: user.tenantId 
        }, 'Forbidden: User tried to access audit logs from another tenant');
        res.status(403).json({ 
          success: false, 
          error: 'Forbidden: You can only access audit logs from your own tenant' 
        });
        return;
      }
      
      const limit = parseInt(req.query.limit as string) || 100;
      const skip = parseInt(req.query.skip as string) || 0;
      
      const result = await this.auditLogService.getTenantAuditLogs(tenantId, limit, skip);
      
      res.json({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          limit: result.limit,
          skip: result.skip,
        },
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get tenant audit logs');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Get all superadmin access logs (only for superadmin)
   * GET /api/audit-logs/superadmin
   */
  async getSuperAdminAccessLogs(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      
      // Security: Only superadmin can see superadmin access logs
      if (!this.isSuperAdmin(user)) {
        res.status(403).json({ 
          success: false, 
          error: 'Forbidden: Only superadmin can view superadmin access logs' 
        });
        return;
      }
      
      const limit = parseInt(req.query.limit as string) || 100;
      const skip = parseInt(req.query.skip as string) || 0;
      
      const result = await this.auditLogService.getSuperAdminAccessLogs(limit, skip);
      
      res.json({
        success: true,
        data: result.logs,
        pagination: {
          limit: result.limit,
          skip: result.skip,
        },
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get superadmin access logs');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  /**
   * Get audit logs for a specific resource
   * GET /api/audit-logs/resource/:resource/:resourceId
   */
  async getResourceAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { resource, resourceId } = req.params;
      const user = (req as any).user;
      
      const limit = parseInt(req.query.limit as string) || 100;
      
      const logs = await this.auditLogService.getResourceAuditLogs(resource, resourceId, limit);
      
      // Security: Filter logs by tenant (unless superadmin)
      const filteredLogs = this.isSuperAdmin(user)
        ? logs
        : logs.filter(log => log.tenantId === user.tenantId);
      
      res.json({
        success: true,
        data: filteredLogs,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get resource audit logs');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}

