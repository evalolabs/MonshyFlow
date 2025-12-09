import { api } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  tenantName?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    roles: string[];
    permissions?: string[];
    tenantId?: string;
    tenantName?: string;
  };
}

export const authService = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/api/auth/login', request);
    // API gibt {success: true, data: {token, user}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Invalid response format');
  },

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/api/auth/register', request);
    // API gibt {success: true, data: {token, user}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Invalid response format');
  },
};

