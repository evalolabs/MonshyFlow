import { AuthContext } from '@monshy/core';
import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface ApiKeyPayload {
  apiKeyId: string;
  tenantId: string;
  name: string;
  authMethod: 'ApiKey';
}

export interface AuthRequest extends Request {
  auth?: AuthContext;
}

