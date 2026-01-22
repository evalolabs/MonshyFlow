import mongoose, { Schema, Document } from 'mongoose';

export interface INode {
  id: string;
  type: string;
  position?: {
    x: number;
    y: number;
  };
  data?: any; // Flexible data structure
  label?: string;
  entryType?: string;
  endpoint?: string;
  baseUrl?: string;
  method?: string;
  description?: string;
  inputSchema?: string;
  outputSchema?: string;
  executionMode?: string;
  timeout?: number;
  webhookUrl?: string;
}

export interface IEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface IScheduleConfig {
  enabled: boolean;
  cronExpression?: string;
  timezone?: string;
  nextRun?: Date;
}

export interface IWorkflow extends Document {
  name: string;
  description?: string;
  version: number;
  nodes: INode[];
  edges: IEdge[];
  userId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  publishedAt?: Date;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  useAgentsSDK: boolean;
  executionCount: number;
  lastExecutedAt?: Date;
  isActive: boolean;
  scheduleConfig?: IScheduleConfig;
  variables?: Record<string, any>; // Workflow variables - can store any data type
}

const NodeSchema = new Schema<INode>({
  id: { type: String, required: true },
  type: { type: String, required: true },
  position: {
    x: { type: Number },
    y: { type: Number },
  },
  data: { type: Schema.Types.Mixed },
  label: { type: String },
  entryType: { type: String },
  endpoint: { type: String },
  baseUrl: { type: String },
  method: { type: String },
  description: { type: String },
  inputSchema: { type: String },
  outputSchema: { type: String },
  executionMode: { type: String },
  timeout: { type: Number },
  webhookUrl: { type: String },
}, { _id: false });

const EdgeSchema = new Schema<IEdge>({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: { type: String },
  targetHandle: { type: String },
}, { _id: false });

const ScheduleConfigSchema = new Schema<IScheduleConfig>({
  enabled: { type: Boolean, default: false },
  cronExpression: { type: String },
  timezone: { type: String },
  nextRun: { type: Date },
}, { _id: false });

const WorkflowSchema = new Schema<IWorkflow>({
  name: { type: String, required: true },
  description: { type: String },
  version: { type: Number, default: 1 },
  nodes: { type: [NodeSchema], default: [] },
  edges: { type: [EdgeSchema], default: [] },
  userId: { type: String, required: true },
  tenantId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  tags: { type: [String], default: [] },
  useAgentsSDK: { type: Boolean, default: false },
  executionCount: { type: Number, default: 0 },
  lastExecutedAt: { type: Date },
  isActive: { type: Boolean, default: true },
  scheduleConfig: { type: ScheduleConfigSchema },
  variables: { type: Schema.Types.Mixed, default: {} }, // Workflow variables
}, {
  timestamps: true,
  collection: 'workflows',
});

// Indexes
WorkflowSchema.index({ tenantId: 1, createdAt: -1 });
WorkflowSchema.index({ tenantId: 1, status: 1 });
WorkflowSchema.index({ userId: 1 });

export const Workflow = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);

