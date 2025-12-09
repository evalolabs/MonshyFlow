/**
 * Execution Storage Service - MongoDB
 * 
 * Stores and retrieves execution state in MongoDB instead of in-memory.
 * This enables horizontal scaling and persistence across restarts.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { Execution, TraceEntry } from '../models/execution';
import { config } from '../config/config';

// Mongoose Document Interface
export interface IExecutionDocument extends Document {
    id: string;
    workflowId: string;
    status: 'running' | 'completed' | 'failed';
    input: any;
    output?: any;
    error?: string;
    trace: TraceEntry[];
    startedAt: Date;
    completedAt?: Date;
}

// Mongoose Schema
const ExecutionSchema = new Schema<IExecutionDocument>({
    id: { type: String, required: true, unique: true, index: true },
    workflowId: { type: String, required: true, index: true },
    status: { type: String, required: true, enum: ['running', 'completed', 'failed'], index: true },
    input: { type: Schema.Types.Mixed, required: true },
    output: { type: Schema.Types.Mixed },
    error: { type: String },
    trace: [{
        nodeId: Schema.Types.Mixed,
        type: Schema.Types.Mixed,
        input: Schema.Types.Mixed,
        output: Schema.Types.Mixed,
        timestamp: Date,
        duration: Number,
        inputSchema: Schema.Types.Mixed,
        outputSchema: Schema.Types.Mixed,
        error: String,
        toolCalls: [{
            toolName: String,
            input: Schema.Types.Mixed,
            output: Schema.Types.Mixed
        }],
        response: Schema.Types.Mixed,
        agentName: String
    }],
    startedAt: { type: Date, required: true, index: true },
    completedAt: { type: Date, index: true }
}, {
    timestamps: false,
    collection: 'executions'
});

// Indexes for performance
ExecutionSchema.index({ workflowId: 1, startedAt: -1 });
ExecutionSchema.index({ status: 1, startedAt: -1 });

const ExecutionModel = mongoose.model<IExecutionDocument>('Execution', ExecutionSchema);

/**
 * Execution Storage Service
 */
class ExecutionStorageService {
    private connected: boolean = false;

    /**
     * Connect to MongoDB (reuse existing connection if available)
     */
    async connect(): Promise<void> {
        if (this.connected || mongoose.connection.readyState === 1) {
            this.connected = true;
            return;
        }

        try {
            // Reuse existing MongoDB connection if available
            if (mongoose.connection.readyState === 0) {
                await mongoose.connect(config.mongodbUrl);
            }
            this.connected = true;
            console.log('[ExecutionStorage] ✅ Connected to MongoDB');
        } catch (error) {
            console.error('[ExecutionStorage] ❌ MongoDB connection failed:', error);
            throw error;
        }
    }

    /**
     * Create a new execution
     */
    async createExecution(execution: Execution): Promise<Execution> {
        if (!execution.id) {
            throw new Error('Execution ID is required');
        }

        const doc = new ExecutionModel({
            id: execution.id,
            workflowId: execution.workflowId,
            status: execution.status,
            input: execution.input,
            output: execution.output,
            error: execution.error,
            trace: execution.trace || [],
            startedAt: execution.startedAt,
            completedAt: execution.completedAt
        });

        await doc.save();
        return this.documentToExecution(doc);
    }

    /**
     * Get execution by ID
     */
    async getExecution(executionId: string): Promise<Execution | null> {
        const doc = await ExecutionModel.findOne({ id: executionId });
        return doc ? this.documentToExecution(doc) : null;
    }

    /**
     * Update execution
     */
    async updateExecution(executionId: string, update: Partial<Execution>): Promise<Execution | null> {
        const updateDoc: any = {};
        
        if (update.status !== undefined) updateDoc.status = update.status;
        if (update.output !== undefined) updateDoc.output = update.output;
        if (update.error !== undefined) updateDoc.error = update.error;
        if (update.trace !== undefined) updateDoc.trace = update.trace;
        if (update.completedAt !== undefined) updateDoc.completedAt = update.completedAt;

        const doc = await ExecutionModel.findOneAndUpdate(
            { id: executionId },
            { $set: updateDoc },
            { new: true }
        );

        return doc ? this.documentToExecution(doc) : null;
    }

    /**
     * Update execution status
     */
    async updateExecutionStatus(executionId: string, status: 'running' | 'completed' | 'failed', error?: string): Promise<void> {
        const update: any = { status };
        if (error) {
            update.error = error;
        }
        if (status === 'completed' || status === 'failed') {
            update.completedAt = new Date();
        }

        await ExecutionModel.findOneAndUpdate({ id: executionId }, { $set: update });
    }

    /**
     * Add trace entry to execution
     */
    async addTraceEntry(executionId: string, traceEntry: TraceEntry): Promise<void> {
        await ExecutionModel.findOneAndUpdate(
            { id: executionId },
            { $push: { trace: traceEntry } }
        );
    }

    /**
     * Update trace array
     */
    async updateTrace(executionId: string, trace: TraceEntry[]): Promise<void> {
        await ExecutionModel.findOneAndUpdate(
            { id: executionId },
            { $set: { trace } }
        );
    }

    /**
     * Get executions for a workflow
     */
    async getWorkflowExecutions(workflowId: string, limit: number = 50): Promise<Execution[]> {
        const docs = await ExecutionModel
            .find({ workflowId })
            .sort({ startedAt: -1 })
            .limit(limit);

        return docs.map(doc => this.documentToExecution(doc));
    }

    /**
     * Get running executions
     */
    async getRunningExecutions(): Promise<Execution[]> {
        const docs = await ExecutionModel
            .find({ status: 'running' })
            .sort({ startedAt: -1 });

        return docs.map(doc => this.documentToExecution(doc));
    }

    /**
     * Delete old executions (cleanup)
     */
    async deleteOldExecutions(olderThanDays: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await ExecutionModel.deleteMany({
            startedAt: { $lt: cutoffDate },
            status: { $in: ['completed', 'failed'] }
        });

        console.log(`[ExecutionStorage] 🗑️  Deleted ${result.deletedCount} old executions`);
        return result.deletedCount;
    }

    /**
     * Convert Mongoose document to Execution
     */
    private documentToExecution(doc: IExecutionDocument): Execution {
        return {
            id: doc.id,
            workflowId: doc.workflowId,
            status: doc.status,
            input: doc.input,
            output: doc.output,
            error: doc.error,
            trace: doc.trace || [],
            startedAt: doc.startedAt,
            completedAt: doc.completedAt
        };
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.connected || mongoose.connection.readyState === 1;
    }
}

export const executionStorageService = new ExecutionStorageService();

