import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { AdminService } from '../services/AdminService';
import { NotFoundError, UnauthorizedError } from '@monshy/core';
import { logger } from '@monshy/core';

@injectable()
export class TenantController {
  constructor(
    @inject('AdminService') private adminService: AdminService
  ) {}

  private tenantToJSON(tenant: any) {
    return {
      id: tenant._id.toString(),
      name: tenant.name,
      domain: tenant.domain,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  /**
   * Get tenant by ID
   * User can only access their own tenant (from JWT token)
   */
  async getTenantById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const user = (req as any).user;

      if (!user || !user.tenantId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized - No tenant information in token',
        });
        return;
      }

      // Security: User can only access their own tenant
      if (user.tenantId !== tenantId) {
        logger.warn({ 
          requestedTenantId: tenantId, 
          userTenantId: user.tenantId,
          userId: user.userId 
        }, 'User attempted to access different tenant');
        res.status(403).json({
          success: false,
          error: 'Forbidden - You can only access your own tenant',
        });
        return;
      }

      const tenant = await this.adminService.getTenantById(tenantId);
      res.json({ 
        success: true, 
        data: this.tenantToJSON(tenant) 
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ 
          success: false, 
          error: error.message || 'Tenant not found' 
        });
      } else {
        logger.error({ err: error, tenantId: req.params.tenantId }, 'Failed to get tenant by id');
        res.status(500).json({ 
          success: false, 
          error: (error as Error).message 
        });
      }
    }
  }
}

