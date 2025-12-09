/**
 * Run Storage Service - MongoDB
 * 
 * Stores and retrieves workflow run data.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { WorkflowRun, RunStatus, RunOptions, RunError, RunUsage, RunEvent } from '../models/run';
import { config } from '../config/config';

// Mongoose Document Interface
export interface IRunDocument extends Document {
    run_id: string;
    workflow_id: string;
    workflow_version: string;
    status: RunStatus;
    input: any;
    output?: any;
    error?: RunError;
    options: RunOptions;
    metadata?: Record<string, any>;
    webhook_url?: string;
    created_at: Date;
    started_at?: Date;
    completed_at?: Date;
    last_event_at?: Date;
    progress?: number;
    usage?: RunUsage;
    events?: RunEvent[];
    idempotency_key?: string;
    request_id: string;
}

// Mongoose Schema
const RunSchema = new Schema<IRunDocument>({
    run_id: { type: String, required: true, unique: true, index: true },
    workflow_id: { type: String, required: true, index: true },
    workflow_version: { type: String, required: true },
    status: { type: String, required: true, enum: ['queued', 'running', 'completed', 'failed', 'cancelled', 'timeout'] },
    input: { type: Schema.Types.Mixed, required: true },
    output: { type: Schema.Types.Mixed },
    error: {
        type: {
            type: String,
            message: String,
            code: String,
            details: Schema.Types.Mixed
        }
    },
    options: {
        stream: Boolean,
        background: Boolean,
        store: { type: Boolean, default: true },
        timeout_ms: Number
    },
    metadata: { type: Map, of: Schema.Types.Mixed },
    webhook_url: String,
    created_at: { type: Date, default: Date.now, index: true },
    started_at: Date,
    completed_at: Date,
    last_event_at: Date,
    progress: Number,
    usage: {
        nodes: Number,
        latency_ms: Number,
        tokens: Number,
        api_calls: Number
    },
    events: [{
        type: String,
        timestamp: Date,
        payload: Schema.Types.Mixed
    }],
    idempotency_key: { type: String, index: true, sparse: true },
    request_id: { type: String, required: true }
}, {
    timestamps: false,
    collection: 'runs'
});

// Indexes for performance
RunSchema.index({ workflow_id: 1, created_at: -1 });
RunSchema.index({ status: 1, created_at: -1 });
RunSchema.index({ idempotency_key: 1 }, { unique: true, sparse: true });

const RunModel = mongoose.model<IRunDocument>('Run', RunSchema);

/**
 * Run Storage Service
 */
class RunStorageService {
    private connected: boolean = false;

    /**
     * Connect to MongoDB
     */
    async connect(): Promise<void> {
        if (this.connected) return;

        try {
            await mongoose.connect(config.mongodbUrl);
            this.connected = true;
            console.log('✅ Connected to MongoDB:', config.mongodbUrl);
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            throw error;
        }
    }

    /**
     * Create a new run
     */
    async createRun(run: Partial<WorkflowRun>): Promise<WorkflowRun> {
        const doc = new RunModel({
            ...run,
            created_at: new Date(),
            last_event_at: new Date()
        });

        await doc.save();
        return this.documentToRun(doc);
    }

    /**
     * Get run by ID
     */
    async getRun(runId: string): Promise<WorkflowRun | null> {
        const doc = await RunModel.findOne({ run_id: runId });
        return doc ? this.documentToRun(doc) : null;
    }

    /**
     * Get run by idempotency key
     */
    async getRunByIdempotencyKey(key: string): Promise<WorkflowRun | null> {
        const doc = await RunModel.findOne({ idempotency_key: key });
        return doc ? this.documentToRun(doc) : null;
    }

    /**
     * Update run
     */
    async updateRun(runId: string, update: Partial<WorkflowRun>): Promise<WorkflowRun | null> {
        const doc = await RunModel.findOneAndUpdate(
            { run_id: runId },
            { 
                ...update,
                last_event_at: new Date()
            },
            { new: true }
        );

        return doc ? this.documentToRun(doc) : null;
    }

    /**
     * Update run status
     */
    async updateRunStatus(runId: string, status: RunStatus, additionalData?: Partial<WorkflowRun>): Promise<void> {
        const update: any = {
            status,
            last_event_at: new Date(),
            ...additionalData
        };

        if (status === 'running' && !additionalData?.started_at) {
            update.started_at = new Date();
        }

        if (['completed', 'failed', 'cancelled', 'timeout'].includes(status)) {
            update.completed_at = new Date();
        }

        await RunModel.findOneAndUpdate({ run_id: runId }, update);
    }

    /**
     * Add event to run
     */
    async addEvent(runId: string, event: RunEvent): Promise<void> {
        await RunModel.findOneAndUpdate(
            { run_id: runId },
            {
                $push: { events: event },
                last_event_at: new Date()
            }
        );
    }

    /**
     * Get runs for a workflow
     */
    async getWorkflowRuns(workflowId: string, limit: number = 50): Promise<WorkflowRun[]> {
        const docs = await RunModel
            .find({ workflow_id: workflowId })
            .sort({ created_at: -1 })
            .limit(limit);

        return docs.map(doc => this.documentToRun(doc));
    }

    /**
     * Get recent runs
     */
    async getRecentRuns(limit: number = 100): Promise<WorkflowRun[]> {
        const docs = await RunModel
            .find()
            .sort({ created_at: -1 })
            .limit(limit);

        return docs.map(doc => this.documentToRun(doc));
    }

    /**
     * Delete old runs (cleanup)
     */
    async deleteOldRuns(olderThanDays: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await RunModel.deleteMany({
            created_at: { $lt: cutoffDate },
            status: { $in: ['completed', 'failed', 'cancelled'] }
        });

        console.log(`🗑️  Deleted ${result.deletedCount} old runs`);
        return result.deletedCount;
    }

    /**
     * Convert Mongoose document to WorkflowRun
     */
    private documentToRun(doc: IRunDocument): WorkflowRun {
        return {
            run_id: doc.run_id,
            workflow_id: doc.workflow_id,
            workflow_version: doc.workflow_version,
            status: doc.status,
            input: doc.input,
            output: doc.output,
            error: doc.error,
            options: doc.options,
            metadata: doc.metadata,
            webhook_url: doc.webhook_url,
            created_at: doc.created_at,
            started_at: doc.started_at,
            completed_at: doc.completed_at,
            last_event_at: doc.last_event_at,
            progress: doc.progress,
            usage: doc.usage,
            events: doc.events,
            idempotency_key: doc.idempotency_key,
            request_id: doc.request_id
        };
    }

    /**
     * Disconnect from MongoDB
     */
    async disconnect(): Promise<void> {
        await mongoose.disconnect();
        this.connected = false;
        console.log('👋 MongoDB disconnected');
    }
}

export const runStorageService = new RunStorageService();

