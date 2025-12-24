import { injectable, inject } from 'tsyringe';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { TenantRepository } from '../repositories/TenantRepository';
import { JwtService } from './JwtService';
import { UnauthorizedError, ConflictError } from '@monshy/core';
import { logger } from '@monshy/core';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  tenantId?: string;
}

@injectable()
export class AuthService {
  constructor(
    @inject('UserRepository') private userRepo: UserRepository,
    @inject('TenantRepository') private tenantRepo: TenantRepository,
    @inject('JwtService') private jwtService: JwtService
  ) {}

  async login(data: LoginDto): Promise<{ token: string; user: any }> {
    const user = await this.userRepo.findByEmail(data.email);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.jwtService.generateToken(user);

    // Get tenant name if tenantId exists
    let tenantName: string | undefined;
    if (user.tenantId) {
      try {
        const tenant = await this.tenantRepo.findById(user.tenantId);
        tenantName = tenant?.name;
      } catch (error) {
        logger.warn({ err: error, tenantId: user.tenantId }, 'Failed to fetch tenant name');
        // Continue without tenantName if lookup fails
      }
    }

    logger.info({ userId: user._id.toString(), email: user.email }, 'User logged in');

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        tenantId: user.tenantId,
        tenantName,
      },
    };
  }

  async register(data: RegisterDto): Promise<{ token: string; user: any }> {
    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Get or create tenant
    let tenantId = data.tenantId;
    if (!tenantId) {
      // Create default tenant for new user
      const tenant = await this.tenantRepo.create({
        name: `${data.firstName || data.email}'s Tenant`,
      });
      tenantId = tenant._id.toString();
    }

    // Create user
    const user = await this.userRepo.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      tenantId,
      roles: ['user'],
    });

    const token = this.jwtService.generateToken(user);

    logger.info({ userId: user._id.toString(), email: user.email }, 'User registered');

    // Get tenant name if tenantId exists
    let tenantName: string | undefined;
    if (user.tenantId) {
      try {
        const tenant = await this.tenantRepo.findById(user.tenantId);
        tenantName = tenant?.name;
      } catch (error) {
        logger.warn({ err: error, tenantId: user.tenantId }, 'Failed to fetch tenant name');
        // Continue without tenantName if lookup fails
      }
    }

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        tenantId: user.tenantId,
        tenantName,
      },
    };
  }

  async getCurrentUser(userId: string): Promise<any> {
    const user = await this.userRepo.findById(userId);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Get tenant name if tenantId exists
    let tenantName: string | undefined;
    if (user.tenantId) {
      try {
        const tenant = await this.tenantRepo.findById(user.tenantId);
        tenantName = tenant?.name;
      } catch (error) {
        logger.warn({ err: error, tenantId: user.tenantId }, 'Failed to fetch tenant name');
      }
    }

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      tenantId: user.tenantId,
      tenantName,
    };
  }

  async validateToken(token: string): Promise<{ valid: boolean; user?: any; expiresAt?: string; error?: string }> {
    try {
      const payload = this.jwtService.verifyToken(token);
      
      // Extract expiration from token (decode without verification to get exp)
      let expiresAt: string | undefined;
      try {
        const decoded = jwt.decode(token) as any;
        expiresAt = decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : undefined;
      } catch {
        // Ignore decode errors
      }
      
      // Get user from database to check if still active
      const user = await this.userRepo.findById(payload.userId);
      
      if (!user || !user.isActive) {
        return {
          valid: false,
          error: 'User not found or inactive',
        };
      }

      // Get tenant name if tenantId exists
      let tenantName: string | undefined;
      if (user.tenantId) {
        try {
          const tenant = await this.tenantRepo.findById(user.tenantId);
          tenantName = tenant?.name;
        } catch (error) {
          logger.warn({ err: error, tenantId: user.tenantId }, 'Failed to fetch tenant name');
        }
      }

      return {
        valid: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          tenantId: user.tenantId,
          tenantName,
        },
        expiresAt,
      };
    } catch (error) {
      logger.warn({ err: error }, 'Token validation failed');
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid or expired token',
      };
    }
  }
}

