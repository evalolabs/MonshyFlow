import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 
                   process.env.JwtSettings__SecretKey ||
                   'your-secret-key-min-32-chars-please-change-in-production';
const JWT_ISSUER = process.env.JWT_ISSUER || 
                   process.env.JwtSettings__Issuer ||
                   'monshy-auth-service';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 
                     process.env.JwtSettings__Audience ||
                     'monshy-services';

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: '24h',
  });
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

