import { injectable } from 'tsyringe';
import { SupportConsent, ISupportConsent } from '@monshy/database';
import { logger } from '@monshy/core';

export interface CreateSupportConsentDto {
  tenantId: string;
  grantedByUserId: string;
  grantedToUserId: string;
  scopes: string[];
  ticketId?: string;
  reason?: string;
  expiresAt: Date;
}

@injectable()
export class SupportConsentRepository {
  async create(data: CreateSupportConsentDto): Promise<ISupportConsent> {
    try {
      const consent = new SupportConsent({
        ...data,
        revokedAt: null,
      });
      return await consent.save();
    } catch (error) {
      logger.error({ err: error, data }, 'Failed to create support consent');
      throw error;
    }
  }

  async findActiveForSupportUser(params: {
    tenantId: string;
    grantedToUserId: string;
    scope?: string;
    now?: Date;
  }): Promise<ISupportConsent | null> {
    const now = params.now ?? new Date();
    const query: any = {
      tenantId: params.tenantId,
      grantedToUserId: params.grantedToUserId,
      revokedAt: null,
      expiresAt: { $gt: now },
    };
    if (params.scope) {
      query.scopes = { $in: [params.scope] };
    }
    try {
      return await SupportConsent.findOne(query).sort({ expiresAt: -1 }).exec();
    } catch (error) {
      logger.error({ err: error, query }, 'Failed to find active support consent');
      throw error;
    }
  }

  async findByTenantId(tenantId: string, limit: number = 100, skip: number = 0): Promise<ISupportConsent[]> {
    try {
      return await SupportConsent.find({ tenantId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      logger.error({ err: error, tenantId }, 'Failed to list support consents by tenant');
      throw error;
    }
  }

  async revoke(consentId: string, tenantId: string, revokedAt: Date = new Date()): Promise<ISupportConsent | null> {
    try {
      return await SupportConsent.findOneAndUpdate(
        { _id: consentId, tenantId, revokedAt: null },
        { revokedAt },
        { new: true }
      ).exec();
    } catch (error) {
      logger.error({ err: error, consentId, tenantId }, 'Failed to revoke support consent');
      throw error;
    }
  }
}


