import mongoose, { Schema, Document } from 'mongoose';

export interface ISecret extends Document {
  name: string;
  description?: string;
  secretType: string; // e.g., "apiKey", "password", "token", "connectionString"
  provider?: string; // e.g., "openai", "azure", "aws"
  encryptedValue: string;
  salt: string;
  tenantId: string;
  userId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SecretSchema = new Schema<ISecret>({
  name: { type: String, required: true },
  description: { type: String },
  secretType: { type: String, required: true },
  provider: { type: String },
  encryptedValue: { type: String, required: true },
  salt: { type: String, required: true },
  tenantId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'secrets',
});

// Indexes
SecretSchema.index({ tenantId: 1, name: 1 }, { unique: true });
SecretSchema.index({ tenantId: 1 });
SecretSchema.index({ userId: 1 });

export const Secret = mongoose.model<ISecret>('Secret', SecretSchema);

