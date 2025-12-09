// Common Types used across all services

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TenantContext {
  tenantId: string;
  userId?: string;
  userRole?: string;
}

export interface AuthContext extends TenantContext {
  authMethod: 'JWT' | 'ApiKey';
  permissions?: string[];
}

