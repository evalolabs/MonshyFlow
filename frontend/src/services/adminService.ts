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
    const response = await api.get<User[]>('/api/admin/users', { params });
    return response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get<User>(`/api/admin/users/${id}`);
    return response.data;
  },

  async createUser(request: CreateUserRequest): Promise<User> {
    const response = await api.post<User>('/api/admin/users', request);
    return response.data;
  },

  async updateUser(id: string, request: UpdateUserRequest): Promise<User> {
    const response = await api.put<User>(`/api/admin/users/${id}`, request);
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/api/admin/users/${id}`);
  },

  // Tenants
  async getAllTenants(): Promise<Tenant[]> {
    const response = await api.get<Tenant[]>('/api/admin/tenants');
    return response.data;
  },

  async getTenantById(id: string): Promise<Tenant> {
    const response = await api.get<Tenant>(`/api/admin/tenants/${id}`);
    return response.data;
  },

  async createTenant(request: CreateTenantRequest): Promise<Tenant> {
    const response = await api.post<Tenant>('/api/admin/tenants', request);
    return response.data;
  },

  async updateTenant(id: string, request: UpdateTenantRequest): Promise<Tenant> {
    const response = await api.put<Tenant>(`/api/admin/tenants/${id}`, request);
    return response.data;
  },

  async deleteTenant(id: string): Promise<void> {
    await api.delete(`/api/admin/tenants/${id}`);
  },

  // Roles
  async getRoles(): Promise<Role[]> {
    const response = await api.get<Role[]>('/api/admin/roles');
    return response.data;
  },

  // Statistics
  async getStatistics(): Promise<Statistics> {
    const response = await api.get<Statistics>('/api/admin/statistics');
    return response.data;
  },
};

