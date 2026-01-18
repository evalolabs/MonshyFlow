import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { AdminService } from '../services/AdminService';
import { AuditLogService } from '../services/AuditLogService';
import { NotFoundError, ConflictError } from '@monshy/core';
import { logger } from '@monshy/core';
import { ROLES } from '@monshy/core';

@injectable()
export class AdminController {
  constructor(
    @inject('AdminService') private adminService: AdminService,
    @inject('AuditLogService') private auditLogService: AuditLogService
  ) {}

  // Helper to check if user is superadmin
  private isSuperAdmin(user: any): boolean {
    if (!user) return false;
    // Check if role is string or array
    if (typeof user.role === 'string') {
      return user.role === ROLES.SUPERADMIN;
    }
    if (Array.isArray(user.roles)) {
      return user.roles.includes(ROLES.SUPERADMIN);
    }
    return false;
  }

  private isTenantAdmin(user: any): boolean {
    if (!user) return false;
    if (typeof user.role === 'string') {
      return user.role === ROLES.ADMIN;
    }
    if (Array.isArray(user.roles)) {
      return user.roles.includes(ROLES.ADMIN);
    }
    return false;
  }

  // Helper to convert MongoDB document to JSON
  private userToJSON(user: any, isSuperAdminViewer: boolean = false) {
    // DSGVO-Konformität: Superadmin sieht nur Metadaten (Datenminimierung)
    if (isSuperAdminViewer) {
      return {
        id: user._id.toString(),
        email: user.email,
        roles: user.roles,
        tenantId: user.tenantId,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // ❌ KEINE firstName, lastName - nicht notwendig für Systemadministration
      };
    }
    
    // Normale User (Tenant-Admin) sehen vollständige Daten
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      tenantId: user.tenantId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private tenantToJSON(tenant: any) {
    return {
      id: tenant._id.toString(),
      name: tenant.name,
      description: tenant.domain, // Using domain as description
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const statistics = await this.adminService.getStatistics(user.tenantId, this.isSuperAdmin(user) ? ROLES.SUPERADMIN : undefined);
      res.json({ success: true, data: statistics });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get statistics');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      
      // Security: Only superadmin can specify tenantId parameter
      let tenantId: string | undefined = undefined;
      if (req.query.tenantId) {
        if (this.isSuperAdmin(user)) {
          tenantId = req.query.tenantId as string;
        } else {
          // Normal admins cannot override tenantId - use their own
          logger.warn({ 
            userId: user?.userId, 
            requestedTenantId: req.query.tenantId,
            userTenantId: user?.tenantId 
          }, 'User attempted to access users from different tenant');
          tenantId = user.tenantId;
        }
      } else {
        // If no parameter, use user's tenant (unless superadmin)
        tenantId = this.isSuperAdmin(user) ? undefined : user.tenantId;
      }
      
      const users = await this.adminService.getAllUsers(tenantId);
      const isSuperAdminViewer = this.isSuperAdmin(user);
      res.json({ 
        success: true, 
        data: users.map(u => this.userToJSON(u, isSuperAdminViewer))
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get all users');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const targetUser = await this.adminService.getUserById(id);
      
      // Security: Normal admins can only access users from their own tenant
      if (!this.isSuperAdmin(user) && targetUser.tenantId !== user.tenantId) {
        logger.warn({ 
          requestedUserId: id, 
          userTenantId: user.tenantId, 
          targetUserTenantId: targetUser.tenantId 
        }, 'Forbidden: User tried to access user from another tenant');
        res.status(403).json({ 
          success: false, 
          error: 'Forbidden: You can only access users from your own tenant' 
        });
        return;
      }
      
      // Kein Log bei READ - Superadmin sieht nur Metadaten (keine sensiblen Daten wie firstName/lastName)
      // Logs werden nur bei UPDATE/DELETE erstellt (siehe updateUser/deleteUser Methoden)
      
      res.json({ success: true, data: this.userToJSON(targetUser, this.isSuperAdmin(user)) });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to get user by id');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user || !user.tenantId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // Security: Tenant-Admins dürfen keine system-internen Rollen vergeben (support/superadmin)
      // und können nur in ihrem eigenen Tenant anlegen.
      let payload: any = req.body || {};
      if (!this.isSuperAdmin(user)) {
        // Only tenant admins can create users via this UI
        if (!this.isTenantAdmin(user)) {
          res.status(403).json({ success: false, error: 'Forbidden' });
          return;
        }

        // Force tenant
        payload = { ...payload, tenantId: user.tenantId };

        // Enforce allowed roles
        const requestedRoles: string[] = Array.isArray(payload.roles) ? payload.roles : [];
        const forbiddenRoles = new Set<string>([ROLES.SUPERADMIN, ROLES.SUPPORT]);
        if (requestedRoles.some(r => forbiddenRoles.has(r))) {
          logger.warn({ userId: user.userId, tenantId: user.tenantId, requestedRoles }, 'Tenant admin attempted to assign forbidden roles');
          res.status(403).json({ success: false, error: 'Forbidden: Tenant admins cannot assign support/superadmin roles' });
          return;
        }
        const allowedRoles = new Set<string>([ROLES.ADMIN, ROLES.USER]);
        const filteredRoles = requestedRoles.filter(r => allowedRoles.has(r));
        payload.roles = filteredRoles.length > 0 ? filteredRoles : [ROLES.USER];
      }

      const createdUser = await this.adminService.createUser(payload);
      logger.info({ userId: createdUser._id.toString() }, 'User created');
      res.status(201).json({ success: true, data: this.userToJSON(createdUser, this.isSuperAdmin(user)) });
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        res.status(error instanceof ConflictError ? 409 : 404).json({ 
          success: false, 
          error: error.message 
        });
      } else {
        logger.error({ err: error }, 'Failed to create user');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      
      // Get user before update to check tenant
      const targetUser = await this.adminService.getUserById(id);

      // Security: Tenant-Admins können nur User im eigenen Tenant bearbeiten
      if (!this.isSuperAdmin(user) && targetUser.tenantId !== user.tenantId) {
        logger.warn({ userId: user?.userId, userTenantId: user?.tenantId, targetUserTenantId: targetUser.tenantId }, 'Forbidden: cross-tenant user update attempt');
        res.status(403).json({ success: false, error: 'Forbidden: You can only update users from your own tenant' });
        return;
      }

      // Security: Tenant-Admins dürfen keine system-internen Rollen setzen und kein tenantId ändern
      let updatePayload: any = req.body || {};
      if (!this.isSuperAdmin(user)) {
        if ('tenantId' in updatePayload) {
          delete updatePayload.tenantId;
        }
        if (Array.isArray(updatePayload.roles)) {
          const requestedRoles: string[] = updatePayload.roles;
          const forbiddenRoles = new Set<string>([ROLES.SUPERADMIN, ROLES.SUPPORT]);
          if (requestedRoles.some(r => forbiddenRoles.has(r))) {
            logger.warn({ userId: user?.userId, tenantId: user?.tenantId, requestedRoles }, 'Tenant admin attempted to assign forbidden roles');
            res.status(403).json({ success: false, error: 'Forbidden: Tenant admins cannot assign support/superadmin roles' });
            return;
          }
          const allowedRoles = new Set<string>([ROLES.ADMIN, ROLES.USER]);
          updatePayload.roles = requestedRoles.filter(r => allowedRoles.has(r));
        }
      }
      
      const updatedUser = await this.adminService.updateUser(id, updatePayload);
      
      // DSGVO-Konformität: Log superadmin action (UPDATE ist eine echte Aktion)
      if (this.isSuperAdmin(user) && targetUser.tenantId !== user.tenantId) {
        this.auditLogService.logSuperAdminAccess({
          userId: user.userId,
          userEmail: user.email,
          action: 'UPDATE',
          resource: 'user',
          resourceId: id,
          tenantId: targetUser.tenantId,
          reason: 'System administration - user updated',
          ipAddress: (req as any).ip || req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        }).catch(err => {
          logger.error({ err }, 'Failed to log superadmin access');
        });
      }
      
      logger.info({ userId: id }, 'User updated');
      res.json({ success: true, data: this.userToJSON(updatedUser, this.isSuperAdmin(user)) });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        res.status(error instanceof NotFoundError ? 404 : 409).json({ 
          success: false, 
          error: error.message 
        });
      } else {
        logger.error({ err: error }, 'Failed to update user');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      
      // Get user before delete to check tenant
      const targetUser = await this.adminService.getUserById(id);

      // Security: Tenant-Admins können nur User im eigenen Tenant löschen
      if (!this.isSuperAdmin(user) && targetUser.tenantId !== user.tenantId) {
        logger.warn({ userId: user?.userId, userTenantId: user?.tenantId, targetUserTenantId: targetUser.tenantId }, 'Forbidden: cross-tenant user delete attempt');
        res.status(403).json({ success: false, error: 'Forbidden: You can only delete users from your own tenant' });
        return;
      }

      // Security: Tenant-Admins dürfen keine system-internen Accounts löschen
      if (!this.isSuperAdmin(user)) {
        const roles: string[] = Array.isArray((targetUser as any).roles) ? (targetUser as any).roles : [];
        if (roles.includes(ROLES.SUPERADMIN) || roles.includes(ROLES.SUPPORT)) {
          res.status(403).json({ success: false, error: 'Forbidden: Tenant admins cannot delete support/superadmin users' });
          return;
        }
      }
      
      // DSGVO-Konformität: Log superadmin action (DELETE ist eine kritische Aktion)
      if (this.isSuperAdmin(user) && targetUser.tenantId !== user.tenantId) {
        this.auditLogService.logSuperAdminAccess({
          userId: user.userId,
          userEmail: user.email,
          action: 'DELETE',
          resource: 'user',
          resourceId: id,
          tenantId: targetUser.tenantId,
          reason: 'System administration - user deleted',
          ipAddress: (req as any).ip || req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        }).catch(err => {
          logger.error({ err }, 'Failed to log superadmin access');
        });
      }
      
      await this.adminService.deleteUser(id);
      logger.info({ userId: id }, 'User deleted');
      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to delete user');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async getAllTenants(req: Request, res: Response): Promise<void> {
    try {
      const tenants = await this.adminService.getAllTenants();
      res.json({ 
        success: true, 
        data: tenants.map(t => this.tenantToJSON(t))
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get all tenants');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getTenantById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenant = await this.adminService.getTenantById(id);
      res.json({ success: true, data: this.tenantToJSON(tenant) });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to get tenant by id');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async createTenant(req: Request, res: Response): Promise<void> {
    try {
      const tenant = await this.adminService.createTenant(req.body);
      logger.info({ tenantId: tenant._id.toString() }, 'Tenant created');
      res.status(201).json({ success: true, data: this.tenantToJSON(tenant) });
    } catch (error) {
      logger.error({ err: error }, 'Failed to create tenant');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async updateTenant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenant = await this.adminService.updateTenant(id, req.body);
      logger.info({ tenantId: id }, 'Tenant updated');
      res.json({ success: true, data: this.tenantToJSON(tenant) });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to update tenant');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async deleteTenant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.adminService.deleteTenant(id);
      logger.info({ tenantId: id }, 'Tenant deleted');
      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to delete tenant');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const roles = await this.adminService.getRoles();

      // Tenant-Admins sollen keine system-internen Rollen sehen/zuweisen
      const filtered = this.isSuperAdmin(user)
        ? roles
        : roles.filter(r => r.id !== ROLES.SUPERADMIN && r.id !== ROLES.SUPPORT);

      res.json({ success: true, data: filtered });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get roles');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}

