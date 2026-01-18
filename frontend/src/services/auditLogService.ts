import { api } from './api';

export interface AuditLog {
  _id: string;
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
  timestamp: string;
  createdAt: string;
}

export interface AuditLogResponse {
  success: boolean;
  data: AuditLog[];
  pagination?: {
    total: number;
    limit: number;
    skip: number;
  };
}

export const auditLogService = {
  /**
   * Get audit logs for tenant
   * GET /api/audit-logs/tenant/:tenantId
   */
  async getTenantAuditLogs(
    tenantId: string,
    limit: number = 100,
    skip: number = 0
  ): Promise<AuditLogResponse> {
    const response = await api.get<AuditLogResponse>(
      `/api/audit-logs/tenant/${tenantId}`,
      {
        params: { limit, skip },
      }
    );
    return response.data;
  },

  /**
   * Get all superadmin access logs (only for superadmin)
   * GET /api/audit-logs/superadmin
   */
  async getSuperAdminAccessLogs(
    limit: number = 100,
    skip: number = 0
  ): Promise<AuditLogResponse> {
    const response = await api.get<AuditLogResponse>(
      '/api/audit-logs/superadmin',
      {
        params: { limit, skip },
      }
    );
    return response.data;
  },

  /**
   * Get audit logs for a specific resource
   * GET /api/audit-logs/resource/:resource/:resourceId
   */
  async getResourceAuditLogs(
    resource: string,
    resourceId: string,
    limit: number = 100
  ): Promise<AuditLogResponse> {
    const response = await api.get<AuditLogResponse>(
      `/api/audit-logs/resource/${resource}/${resourceId}`,
      {
        params: { limit },
      }
    );
    return response.data;
  },
};

