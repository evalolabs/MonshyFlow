import { api } from './api';

export interface SupportConsent {
  _id: string;
  tenantId: string;
  grantedByUserId: string;
  grantedToUserId: string;
  scopes: string[];
  ticketId?: string;
  reason?: string;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const supportConsentService = {
  async createConsent(params: {
    grantedToUserId: string;
    expiresInMinutes?: number;
    ticketId?: string;
    reason?: string;
    scopes?: string[];
  }): Promise<{ success: boolean; data: SupportConsent }> {
    const response = await api.post('/api/support-consents', params);
    return response.data;
  },

  async listConsents(limit: number = 100, skip: number = 0): Promise<{ success: boolean; data: SupportConsent[] }> {
    const response = await api.get('/api/support-consents', { params: { limit, skip } });
    return response.data;
  },

  async revokeConsent(id: string): Promise<{ success: boolean; data: SupportConsent }> {
    const response = await api.delete(`/api/support-consents/${id}`);
    return response.data;
  },
};


