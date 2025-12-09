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
    const response = await api.get<SecretResponse[]>('/api/secrets');
    return response.data;
  },

  async getSecretById(id: string): Promise<SecretResponse> {
    const response = await api.get<SecretResponse>(`/api/secrets/${id}`);
    return response.data;
  },

  async createSecret(request: CreateSecretRequest): Promise<SecretResponse> {
    const response = await api.post<SecretResponse>('/api/secrets', request);
    return response.data;
  },

  async updateSecret(id: string, request: UpdateSecretRequest): Promise<SecretResponse> {
    const response = await api.put<SecretResponse>(`/api/secrets/${id}`, request);
    return response.data;
  },

  async deleteSecret(id: string): Promise<void> {
    await api.delete(`/api/secrets/${id}`);
  },

  async getDecryptedSecret(id: string): Promise<DecryptedSecretResponse> {
    const response = await api.get<DecryptedSecretResponse>(`/api/secrets/${id}/decrypt`);
    return response.data;
  },
};

