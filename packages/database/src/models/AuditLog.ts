import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: string;
  userEmail?: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  tenantId: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  userEmail: { 
    type: String, 
    index: true 
  },
  userRole: { 
    type: String, 
    required: true,
    enum: ['superadmin', 'admin', 'user'],
    index: true
  },
  action: { 
    type: String, 
    required: true,
    index: true
  },
  resource: { 
    type: String, 
    required: true,
    index: true
  },
  resourceId: { 
    type: String,
    index: true
  },
  tenantId: { 
    type: String, 
    required: true,
    index: true
  },
  reason: { 
    type: String 
  },
  ipAddress: { 
    type: String 
  },
  userAgent: { 
    type: String 
  },
  metadata: { 
    type: Schema.Types.Mixed 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    required: true,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
}, {
  timestamps: true,
  collection: 'auditlogs',
});

// Indexes for efficient queries
AuditLogSchema.index({ tenantId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ userRole: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

// TTL Index: Delete logs older than 2 years (DSGVO requirement: minimum 2 years retention)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years in seconds

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

