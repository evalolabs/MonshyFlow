import { api } from './api';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions?: string[];
  tenantId: string;
  tenantName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  tenantId?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  tenantId?: string;
  isActive?: boolean;
}

export interface CreateTenantRequest {
  name: string;
  description?: string;
}

export interface UpdateTenantRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export const adminService = {
  // Users
  async getAllUsers(tenantId?: string): Promise<User[]> {
    const params = tenantId ? { tenantId } : {};
    const response = await api.get<{ success: boolean; data: User[] }>('/api/admin/users', { params });
    // API gibt {success: true, data: [...]} zurück
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // Fallback für direkte Array-Response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get<{ success: boolean; data: User }>(`/api/admin/users/${id}`);
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as User;
    }
    throw new Error('Invalid response format');
  },

  async createUser(request: CreateUserRequest): Promise<User> {
    const response = await api.post<{ success: boolean; data: User }>('/api/admin/users', request);
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as User;
    }
    throw new Error('Invalid response format');
  },

  async updateUser(id: string, request: UpdateUserRequest): Promise<User> {
    const response = await api.put<{ success: boolean; data: User }>(`/api/admin/users/${id}`, request);
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as User;
    }
    throw new Error('Invalid response format');
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/api/admin/users/${id}`);
  },

  // Tenants
  async getAllTenants(): Promise<Tenant[]> {
    const response = await api.get<{ success: boolean; data: Tenant[] }>('/api/admin/tenants');
    // API gibt {success: true, data: [...]} zurück
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // Fallback für direkte Array-Response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  async getTenantById(id: string): Promise<Tenant> {
    const response = await api.get<{ success: boolean; data: Tenant }>(`/api/admin/tenants/${id}`);
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as Tenant;
    }
    throw new Error('Invalid response format');
  },

  async createTenant(request: CreateTenantRequest): Promise<Tenant> {
    const response = await api.post<{ success: boolean; data: Tenant }>('/api/admin/tenants', request);
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as Tenant;
    }
    throw new Error('Invalid response format');
  },

  async updateTenant(id: string, request: UpdateTenantRequest): Promise<Tenant> {
    const response = await api.put<{ success: boolean; data: Tenant }>(`/api/admin/tenants/${id}`, request);
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as Tenant;
    }
    throw new Error('Invalid response format');
  },

  async deleteTenant(id: string): Promise<void> {
    await api.delete(`/api/admin/tenants/${id}`);
  },

  // Roles
  async getRoles(): Promise<Role[]> {
    const response = await api.get<{ success: boolean; data: Role[] }>('/api/admin/roles');
    // API gibt {success: true, data: [...]} zurück
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // Fallback für direkte Array-Response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  // Statistics
  async getStatistics(): Promise<Statistics> {
    const response = await api.get<{ success: boolean; data: Statistics }>('/api/admin/statistics');
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as Statistics;
    }
    throw new Error('Invalid response format');
  },
};

