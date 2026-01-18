import { injectable, inject } from 'tsyringe';
import { SupportConsentRepository, CreateSupportConsentDto } from '../repositories/SupportConsentRepository';
import { NotFoundError, ConflictError, ROLES } from '@monshy/core';
import { logger } from '@monshy/core';
import { AdminService } from './AdminService';

export const SUPPORT_SCOPE_WORKFLOW_CONTENT = 'workflow:read:content';

@injectable()
export class SupportConsentService {
  constructor(
    @inject('SupportConsentRepository') private repo: SupportConsentRepository,
    @inject('AdminService') private adminService: AdminService
  ) {}

  private isTenantAdmin(user: any): boolean {
    if (!user) return false;
    if (typeof user.role === 'string') return user.role === ROLES.ADMIN;
    if (Array.isArray(user.roles)) return user.roles.includes(ROLES.ADMIN);
    return false;
  }

  async createConsent(requestingUser: any, data: {
    grantedToUserId: string;
    expiresInMinutes?: number;
    expiresAt?: string;
    ticketId?: string;
    reason?: string;
    scopes?: string[];
  }) {
    if (!requestingUser?.tenantId || !requestingUser?.userId) {
      throw new ConflictError('Invalid user context');
    }
    if (!this.isTenantAdmin(requestingUser)) {
      throw new ConflictError('Forbidden: only tenant admins can grant support access');
    }
    if (!data.grantedToUserId) {
      throw new ConflictError('grantedToUserId is required');
    }

    // Validate target user exists and has support role
    const supportUser = await this.adminService.getUserById(data.grantedToUserId);
    const hasSupportRole = Array.isArray((supportUser as any).roles) && (supportUser as any).roles.includes(ROLES.SUPPORT);
    if (!hasSupportRole) {
      throw new ConflictError('Target user is not a support user');
    }

    // Only allow workflow content scope for now
    const requestedScopes = Array.isArray(data.scopes) && data.scopes.length > 0
      ? data.scopes
      : [SUPPORT_SCOPE_WORKFLOW_CONTENT];
    const scopes = requestedScopes.filter(s => s === SUPPORT_SCOPE_WORKFLOW_CONTENT);
    if (scopes.length === 0) {
      throw new ConflictError('No allowed scopes requested');
    }

    // expiry
    let expiresAt: Date;
    if (data.expiresAt) {
      expiresAt = new Date(data.expiresAt);
    } else {
      const minutes = Math.min(Math.max(data.expiresInMinutes ?? 60, 5), 240); // 5..240
      expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    }
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      throw new ConflictError('expiresAt must be in the future');
    }

    const dto: CreateSupportConsentDto = {
      tenantId: requestingUser.tenantId,
      grantedByUserId: requestingUser.userId,
      grantedToUserId: data.grantedToUserId,
      scopes,
      ticketId: data.ticketId,
      reason: data.reason,
      expiresAt,
    };

    const consent = await this.repo.create(dto);

    logger.info({
      tenantId: dto.tenantId,
      grantedByUserId: dto.grantedByUserId,
      grantedToUserId: dto.grantedToUserId,
      scopes: dto.scopes,
      expiresAt: dto.expiresAt,
      ticketId: dto.ticketId,
    }, 'Support consent granted');

    return consent;
  }

  async listConsentsForTenant(requestingUser: any, limit: number = 100, skip: number = 0) {
    if (!requestingUser?.tenantId) {
      throw new ConflictError('Invalid user context');
    }
    if (!this.isTenantAdmin(requestingUser)) {
      throw new ConflictError('Forbidden: only tenant admins can view consents');
    }
    return this.repo.findByTenantId(requestingUser.tenantId, limit, skip);
  }

  async revokeConsent(requestingUser: any, consentId: string) {
    if (!requestingUser?.tenantId) {
      throw new ConflictError('Invalid user context');
    }
    if (!this.isTenantAdmin(requestingUser)) {
      throw new ConflictError('Forbidden: only tenant admins can revoke consents');
    }
    const revoked = await this.repo.revoke(consentId, requestingUser.tenantId);
    if (!revoked) {
      throw new NotFoundError('SupportConsent', consentId);
    }
    logger.info({ tenantId: requestingUser.tenantId, consentId }, 'Support consent revoked');
    return revoked;
  }

  async hasWorkflowContentConsent(params: { tenantId: string; supportUserId: string }): Promise<boolean> {
    const consent = await this.repo.findActiveForSupportUser({
      tenantId: params.tenantId,
      grantedToUserId: params.supportUserId,
      scope: SUPPORT_SCOPE_WORKFLOW_CONTENT,
    });
    return !!consent;
  }
}


