import { api } from './api';

// SecretType as integer (0 = ApiKey, 1 = Password, 2 = Token, 3 = Generic)
export const SecretType = {
  ApiKey: 0,
  Password: 1,
  Token: 2,
  Generic: 3,
  Smtp: 4,
} as const;

export type SecretType = (typeof SecretType)[keyof typeof SecretType];

export const SecretTypeLabels: Record<SecretType, string> = {
  [SecretType.ApiKey]: 'API Key',
  [SecretType.Password]: 'Password',
  [SecretType.Token]: 'Token',
  [SecretType.Generic]: 'Generic',
  [SecretType.Smtp]: 'SMTP Profile',
};

export interface SecretResponse {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  description?: string;
  secretType: number; // 0 = ApiKey, 1 = Password, 2 = Token, 3 = Generic
  provider?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
}

export interface CreateSecretRequest {
  name: string;
  description?: string;
  secretType: number; // 0 = ApiKey, 1 = Password, 2 = Token, 3 = Generic, 4 = SMTP
  provider?: string;
  value: string;
  isActive?: boolean;
}

export interface UpdateSecretRequest {
  name?: string;
  description?: string;
  secretType?: number;
  provider?: string;
  value?: string;
  isActive?: boolean;
}

export interface DecryptedSecretResponse {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  description?: string;
  secretType: number;
  provider?: string;
  value: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
}

export const secretsService = {
  async getAllSecrets(): Promise<SecretResponse[]> {
    const response = await api.get<{ success: boolean; data: SecretResponse[] }>('/api/secrets');
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

  async getSecretById(id: string): Promise<SecretResponse> {
    const response = await api.get<{ success: boolean; data: SecretResponse }>(`/api/secrets/${id}`);
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as unknown as SecretResponse;
    }
    throw new Error('Invalid response format');
  },

  async createSecret(request: CreateSecretRequest): Promise<SecretResponse> {
    const response = await api.post<{ success: boolean; data: SecretResponse }>('/api/secrets', request);
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as unknown as SecretResponse;
    }
    throw new Error('Invalid response format');
  },

  async updateSecret(id: string, request: UpdateSecretRequest): Promise<SecretResponse> {
    const response = await api.put<{ success: boolean; data: SecretResponse }>(`/api/secrets/${id}`, request);
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as unknown as SecretResponse;
    }
    throw new Error('Invalid response format');
  },

  async deleteSecret(id: string): Promise<void> {
    await api.delete(`/api/secrets/${id}`);
    // 204 No Content oder {success: true}
  },

  async getDecryptedSecret(id: string): Promise<DecryptedSecretResponse> {
    const response = await api.get<{ success: boolean; data: DecryptedSecretResponse }>(`/api/secrets/${id}/decrypt`);
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as unknown as DecryptedSecretResponse;
    }
    throw new Error('Invalid response format');
  },
};

