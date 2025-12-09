import { injectable } from 'tsyringe';
import { generateToken, verifyToken } from '@monshy/auth';
import { IUser } from '@monshy/database';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

@injectable()
export class JwtService {
  generateToken(user: IUser): string {
    const role = user.roles && user.roles.length > 0 ? user.roles[0] : 'user';
    
    return generateToken({
      userId: user._id.toString(),
      tenantId: user.tenantId,
      email: user.email,
      role: role,
    });
  }

  verifyToken(token: string): JwtPayload {
    return verifyToken(token);
  }
}

