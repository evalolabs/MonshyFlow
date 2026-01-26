import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflowComment extends Document {
  workflowId: string;
  userId: string;
  userName?: string; // Cached user name for display
  userEmail?: string; // Cached user email for display
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentCommentId?: string; // For nested comments/replies
}

const WorkflowCommentSchema = new Schema<IWorkflowComment>({
  workflowId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String },
  userEmail: { type: String },
  content: { type: String, required: true },
  parentCommentId: { type: String }, // For nested comments
}, {
  timestamps: true,
  collection: 'workflow_comments',
});

// Indexes
WorkflowCommentSchema.index({ workflowId: 1, createdAt: -1 });
WorkflowCommentSchema.index({ userId: 1 });
WorkflowCommentSchema.index({ parentCommentId: 1 });

export const WorkflowComment = mongoose.model<IWorkflowComment>('WorkflowComment', WorkflowCommentSchema);

