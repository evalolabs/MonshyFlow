import { container } from 'tsyringe';
import { UserRepository } from '../repositories/UserRepository';
import { TenantRepository } from '../repositories/TenantRepository';
import { ApiKeyRepository } from '../repositories/ApiKeyRepository';
import { AuthService } from './AuthService';
import { UserService } from './UserService';
import { ApiKeyService } from './ApiKeyService';
import { JwtService } from './JwtService';

// Register repositories
container.register('UserRepository', { useClass: UserRepository });
container.register('TenantRepository', { useClass: TenantRepository });
container.register('ApiKeyRepository', { useClass: ApiKeyRepository });

// Register services
container.register('JwtService', { useClass: JwtService });
container.register('AuthService', { useClass: AuthService });
container.register('UserService', { useClass: UserService });
container.register('ApiKeyService', { useClass: ApiKeyService });

export { container };

