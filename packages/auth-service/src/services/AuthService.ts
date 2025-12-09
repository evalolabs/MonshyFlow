import { injectable, inject } from 'tsyringe';
import bcrypt from 'bcrypt';
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

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        tenantId: user.tenantId,
      },
    };
  }
}

