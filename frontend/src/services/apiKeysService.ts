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
    const response = await api.get<{ success: boolean; data: ApiKeyResponse[] }>('/api/apikeys');
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

  async createApiKey(request: CreateApiKeyRequest): Promise<ApiKeyResponse> {
    const response = await api.post<{ success: boolean; data: ApiKeyResponse }>('/api/apikeys', request);
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as unknown as ApiKeyResponse;
    }
    throw new Error('Invalid response format');
  },

  async deleteApiKey(id: string): Promise<void> {
    await api.delete(`/api/apikeys/${id}`);
    // 204 No Content oder {success: true}
  },

  async revokeApiKey(id: string): Promise<void> {
    await api.post(`/api/apikeys/${id}/revoke`);
    // {success: true}
  },
};

