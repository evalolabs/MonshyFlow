import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKey extends Document {
  keyHash: string; // Hashed API Key (never store plain key)
  name: string;
  description?: string;
  tenantId: string;
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>({
  keyHash: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  tenantId: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
  lastUsedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'apikeys',
});

// Indexes
ApiKeySchema.index({ tenantId: 1, isActive: 1 });
ApiKeySchema.index({ keyHash: 1 });

export const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);

