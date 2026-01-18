import mongoose, { Schema, Document } from 'mongoose';

/**
 * SupportConsent
 * Tenant-Admin can grant a time-limited permission to a specific support user
 * to view workflow CONTENT for this tenant. Secrets are never included.
 */

export interface ISupportConsent extends Document {
  tenantId: string;
  grantedByUserId: string; // tenant admin
  grantedToUserId: string; // support user
  scopes: string[]; // e.g. ['workflow:read:content']
  ticketId?: string;
  reason?: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SupportConsentSchema = new Schema<ISupportConsent>(
  {
    tenantId: { type: String, required: true, index: true },
    grantedByUserId: { type: String, required: true, index: true },
    grantedToUserId: { type: String, required: true, index: true },
    scopes: { type: [String], required: true, default: [] },
    ticketId: { type: String },
    reason: { type: String },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    collection: 'support_consents',
  }
);

// TTL: delete the consent automatically after it expires
SupportConsentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Query helpers
SupportConsentSchema.index({ tenantId: 1, grantedToUserId: 1, revokedAt: 1, expiresAt: 1 });

export const SupportConsent = mongoose.model<ISupportConsent>('SupportConsent', SupportConsentSchema);


