import { injectable } from 'tsyringe';
import bcrypt from 'bcrypt';
import { User, IUser } from '@monshy/database';
import { Tenant, ITenant } from '@monshy/database';
import { Workflow } from '@monshy/database';
import { Secret } from '@monshy/database';
import { NotFoundError, ConflictError } from '@monshy/core';
import { logger } from '@monshy/core';
import { ROLES } from '@monshy/core';

export interface Statistics {
  totalUsers: number;
  totalTenants: number;
  totalWorkflows: number;
  totalSecrets: number;
  activeUsers: number;
  activeTenants: number;
  publishedWorkflows: number;
  superAdmins: number;
  admins: number;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  tenantId?: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  tenantId?: string;
  isActive?: boolean;
}

export interface CreateTenantDto {
  name: string;
  description?: string;
}

export interface UpdateTenantDto {
  name?: string;
  description?: string; // Will be stored in domain field
  isActive?: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

@injectable()
export class AdminService {
  async getStatistics(): Promise<Statistics> {
    try {
      const [
        totalUsers,
        totalTenants,
        totalWorkflows,
        totalSecrets,
        activeUsers,
        activeTenants,
        publishedWorkflows,
        superAdmins,
        admins,
      ] = await Promise.all([
        User.countDocuments(),
        Tenant.countDocuments(),
        Workflow.countDocuments(),
        Secret.countDocuments(),
        User.countDocuments({ isActive: true }),
        Tenant.countDocuments({ isActive: true }),
        Workflow.countDocuments({ isPublished: true }),
        User.countDocuments({ roles: { $in: [ROLES.SUPERADMIN] } }),
        User.countDocuments({ roles: { $in: [ROLES.ADMIN] } }),
      ]);

      return {
        totalUsers,
        totalTenants,
        totalWorkflows,
        totalSecrets,
        activeUsers,
        activeTenants,
        publishedWorkflows,
        superAdmins,
        admins,
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to get statistics');
      throw error;
    }
  }

  async getAllUsers(tenantId?: string): Promise<IUser[]> {
    try {
      const query = tenantId ? { tenantId } : {};
      return await User.find(query).exec();
    } catch (error) {
      logger.error({ err: error, tenantId }, 'Failed to get all users');
      throw error;
    }
  }

  async getUserById(id: string): Promise<IUser> {
    try {
      const user = await User.findById(id).exec();
      if (!user) {
        throw new NotFoundError('User', id);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, userId: id }, 'Failed to get user by id');
      throw error;
    }
  }

  async createUser(data: CreateUserDto): Promise<IUser> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: data.email.toLowerCase() }).exec();
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Validate tenant exists if provided
      if (data.tenantId) {
        const tenant = await Tenant.findById(data.tenantId).exec();
        if (!tenant) {
          throw new NotFoundError('Tenant', data.tenantId);
        }
      }

      const user = new User({
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: data.roles || [ROLES.USER],
        tenantId: data.tenantId || '',
        isActive: true,
      });

      return await user.save();
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, email: data.email }, 'Failed to create user');
      throw error;
    }
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<IUser> {
    try {
      const updateData: any = { ...data };
      
      // If email is being updated, check for conflicts
      if (data.email) {
        const existingUser = await User.findOne({ 
          email: data.email.toLowerCase(),
          _id: { $ne: id }
        }).exec();
        if (existingUser) {
          throw new ConflictError('User with this email already exists');
        }
        updateData.email = data.email.toLowerCase();
      }

      // Validate tenant exists if provided
      if (data.tenantId) {
        const tenant = await Tenant.findById(data.tenantId).exec();
        if (!tenant) {
          throw new NotFoundError('Tenant', data.tenantId);
        }
      }

      const user = await User.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec();

      if (!user) {
        throw new NotFoundError('User', id);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      logger.error({ err: error, userId: id }, 'Failed to update user');
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const user = await User.findByIdAndDelete(id).exec();
      if (!user) {
        throw new NotFoundError('User', id);
      }
      logger.info({ userId: id }, 'User deleted');
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, userId: id }, 'Failed to delete user');
      throw error;
    }
  }

  async getAllTenants(): Promise<ITenant[]> {
    try {
      return await Tenant.find().exec();
    } catch (error) {
      logger.error({ err: error }, 'Failed to get all tenants');
      throw error;
    }
  }

  async getTenantById(id: string): Promise<ITenant> {
    try {
      const tenant = await Tenant.findById(id).exec();
      if (!tenant) {
        throw new NotFoundError('Tenant', id);
      }
      return tenant;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, tenantId: id }, 'Failed to get tenant by id');
      throw error;
    }
  }

  async createTenant(data: CreateTenantDto): Promise<ITenant> {
    try {
      const tenant = new Tenant({
        name: data.name,
        domain: data.description || undefined, // Store description in domain field
        isActive: true,
      });

      return await tenant.save();
    } catch (error) {
      logger.error({ err: error, name: data.name }, 'Failed to create tenant');
      throw error;
    }
  }

  async updateTenant(id: string, data: UpdateTenantDto): Promise<ITenant> {
    try {
      const updateData: any = { ...data };
      // Map description to domain field
      if (data.description !== undefined) {
        updateData.domain = data.description;
        delete updateData.description;
      }

      const tenant = await Tenant.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
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

  async deleteTenant(id: string): Promise<void> {
    try {
      const tenant = await Tenant.findByIdAndDelete(id).exec();
      if (!tenant) {
        throw new NotFoundError('Tenant', id);
      }
      logger.info({ tenantId: id }, 'Tenant deleted');
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, tenantId: id }, 'Failed to delete tenant');
      throw error;
    }
  }

  async getRoles(): Promise<Role[]> {
    // Return static list of available roles
    // In a real system, this might come from a database
    return [
      {
        id: 'superadmin',
        name: 'superadmin',
        description: 'Super Administrator with full system access',
        permissions: ['*'], // All permissions
        isSystemRole: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'admin',
        name: 'admin',
        description: 'Administrator with tenant management access',
        permissions: ['users:read', 'users:write', 'tenants:read', 'tenants:write', 'workflows:read', 'workflows:write'],
        isSystemRole: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user',
        name: 'user',
        description: 'Standard user with basic access',
        permissions: ['workflows:read', 'workflows:write', 'secrets:read'],
        isSystemRole: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}

