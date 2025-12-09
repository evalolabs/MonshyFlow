import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { AdminService } from '../services/AdminService';
import { NotFoundError, ConflictError } from '@monshy/core';
import { logger } from '@monshy/core';

@injectable()
export class AdminController {
  constructor(
    @inject('AdminService') private adminService: AdminService
  ) {}

  // Helper to convert MongoDB document to JSON
  private userToJSON(user: any) {
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
      const statistics = await this.adminService.getStatistics();
      res.json({ success: true, data: statistics });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get statistics');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.query.tenantId as string | undefined;
      const users = await this.adminService.getAllUsers(tenantId);
      res.json({ 
        success: true, 
        data: users.map(u => this.userToJSON(u))
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get all users');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.adminService.getUserById(id);
      res.json({ success: true, data: this.userToJSON(user) });
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
      const user = await this.adminService.createUser(req.body);
      logger.info({ userId: user._id.toString() }, 'User created');
      res.status(201).json({ success: true, data: this.userToJSON(user) });
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
      const user = await this.adminService.updateUser(id, req.body);
      logger.info({ userId: id }, 'User updated');
      res.json({ success: true, data: this.userToJSON(user) });
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
      const roles = await this.adminService.getRoles();
      res.json({ success: true, data: roles });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get roles');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}

