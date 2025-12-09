import { injectable, inject } from 'tsyringe';
import { UserRepository } from '../repositories/UserRepository';
import { NotFoundError } from '@monshy/core';

@injectable()
export class UserService {
  constructor(
    @inject('UserRepository') private userRepo: UserRepository
  ) {}

  async getById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }
    return user;
  }

  async getByTenantId(tenantId: string) {
    return this.userRepo.findByTenantId(tenantId);
  }

  async update(id: string, data: any) {
    return this.userRepo.update(id, data);
  }

  async delete(id: string) {
    return this.userRepo.delete(id);
  }
}

