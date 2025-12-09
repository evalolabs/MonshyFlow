import { api } from './api';

export interface ApiKeyResponse {
  id: string;
  key?: string; // Only returned on creation
  tenantId: string;
  name: string;
  description?: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string | null;
  isActive: boolean;
}

export interface CreateApiKeyRequest {
  name?: string;
  description?: string;
  expiresAt?: string | null; // ISO date string
}

export const apiKeysService = {
  async getAllApiKeys(): Promise<ApiKeyResponse[]> {
    const response = await api.get<ApiKeyResponse[]>('/api/apikeys');
    return response.data;
  },

  async createApiKey(request: CreateApiKeyRequest): Promise<ApiKeyResponse> {
    const response = await api.post<ApiKeyResponse>('/api/apikeys', request);
    return response.data;
  },

  async deleteApiKey(id: string): Promise<void> {
    await api.delete(`/api/apikeys/${id}`);
  },

  async revokeApiKey(id: string): Promise<void> {
    await api.post(`/api/apikeys/${id}/revoke`);
  },
};

