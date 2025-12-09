import { injectable } from 'tsyringe';
import { User, IUser } from '@monshy/database';
import { NotFoundError } from '@monshy/core';
import { logger } from '@monshy/core';

@injectable()
export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id).exec();
    } catch (error) {
      logger.error({ err: error, userId: id }, 'Failed to find user by id');
      throw error;
    }
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      return await User.findOne({ email: email.toLowerCase() }).exec();
    } catch (error) {
      logger.error({ err: error, email }, 'Failed to find user by email');
      throw error;
    }
  }

  async findByTenantId(tenantId: string): Promise<IUser[]> {
    try {
      return await User.find({ tenantId, isActive: true }).exec();
    } catch (error) {
      logger.error({ err: error, tenantId }, 'Failed to find users by tenant');
      throw error;
    }
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    tenantId: string;
    roles?: string[];
  }): Promise<IUser> {
    try {
      const user = new User({
        ...data,
        email: data.email.toLowerCase(),
        roles: data.roles || ['user'],
        isActive: true,
      });
      
      return await user.save();
    } catch (error) {
      logger.error({ err: error, email: data.email }, 'Failed to create user');
      throw error;
    }
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser> {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec();
      
      if (!user) {
        throw new NotFoundError('User', id);
      }
      
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, userId: id }, 'Failed to update user');
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundError('User', id);
      }
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, userId: id }, 'Failed to delete user');
      throw error;
    }
  }
}

