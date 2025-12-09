/**
 * Queue Service - RabbitMQ Integration
 * 
 * Handles background job queueing for async workflow execution.
 */

import * as amqp from 'amqplib';
import { config } from '../config/config';
import { runStorageService } from './runStorageService';
import { webhookService } from './webhookService';
import { executionService } from './executionService';

export interface QueueJob {
    run_id: string;
    workflow_id: string;
    workflow_version: string;
    input: any;
    timeout_ms?: number;
    webhook_url?: string;
    metadata?: Record<string, any>;
    request_id: string;
}

class QueueService {
    private connection: any = null;
    private channel: any = null;
    private readonly queueName = 'workflow_runs';
    private readonly rabbitUrl: string;

    constructor() {
        this.rabbitUrl = config.rabbitmqUrl || 'amqp://localhost:5672';
    }

    /**
     * Connect to RabbitMQ
     */
    async connect(): Promise<void> {
        try {
            const conn = await amqp.connect(this.rabbitUrl);
            this.connection = conn;
            const ch = await conn.createChannel();
            this.channel = ch;
            
            // Assert queue exists
            await ch.assertQueue(this.queueName, {
                durable: true, // Survives broker restart
            });

            console.log('✅ Connected to RabbitMQ:', this.rabbitUrl);
        } catch (error) {
            console.error('❌ RabbitMQ connection failed:', error);
            // Fallback to in-memory queue for development
            console.warn('⚠️  Using in-memory queue (no persistence)');
        }
    }

    /**
     * Publish a workflow run to the queue
     */
    async publishRun(job: QueueJob): Promise<void> {
        if (!this.channel) {
            console.warn('Queue not connected, processing immediately');
            // Fallback: process immediately (for dev without RabbitMQ)
            await this.processJob(job);
            return;
        }

        const message = Buffer.from(JSON.stringify(job));
        
        this.channel.sendToQueue(this.queueName, message, {
            persistent: true,
            contentType: 'application/json',
            messageId: job.run_id
        });

        console.log(`📨 Queued run: ${job.run_id}`);
    }

    /**
     * Start background worker
     */
    startWorker(): void {
        if (!this.channel) {
            console.error('Cannot start worker: Queue not connected');
            return;
        }

        // Set prefetch to 1 (process one job at a time)
        this.channel.prefetch(1);

        console.log('👷 Worker started, waiting for jobs...');

        this.channel.consume(
            this.queueName,
            async (msg: any) => {
                if (!msg) return;

                try {
                    const job: QueueJob = JSON.parse(msg.content.toString());
                    console.log(`⚙️  Processing job: ${job.run_id}`);

                    await this.processJob(job);

                    // Acknowledge successful processing
                    this.channel!.ack(msg);
                    console.log(`✅ Job completed: ${job.run_id}`);

                } catch (error: any) {
                    console.error(`❌ Job failed: ${error.message}`);
                    // Reject and don't requeue (dead letter queue would handle this)
                    this.channel!.nack(msg, false, false);
                }
            },
            { noAck: false }
        );
    }

    /**
     * Process a queued job
     */
    private async processJob(job: QueueJob): Promise<void> {
        const startTime = Date.now();
        try {
            // Update status to running
            await runStorageService.updateRunStatus(job.run_id, 'running');

            // Execute workflow
            const result = await executionService.executeWorkflowById(job.workflow_id, job.input);

            const latency = Date.now() - startTime;

            // Update run with result
            await runStorageService.updateRun(job.run_id, {
                status: 'completed',
                output: result.output,
                completed_at: new Date(),
                usage: {
                    nodes: result.trace?.length || 0,
                    latency_ms: latency
                }
            });

            // Send webhook if configured
            if (job.webhook_url) {
                const run = await runStorageService.getRun(job.run_id);
                if (run) {
                    await webhookService.sendWebhook(job.webhook_url, run);
                }
            }

        } catch (error: any) {
            console.error(`Execution failed for ${job.run_id}:`, error);

            // Update run with error
            await runStorageService.updateRun(job.run_id, {
                status: 'failed',
                error: {
                    type: 'execution_error',
                    message: error.message,
                    code: 'EXECUTION_FAILED'
                },
                completed_at: new Date()
            });

            // Send webhook with error
            if (job.webhook_url) {
                const run = await runStorageService.getRun(job.run_id);
                if (run) {
                    await webhookService.sendWebhook(job.webhook_url, run);
                }
            }

            throw error;
        }
    }

    /**
     * Disconnect from RabbitMQ
     */
    async disconnect(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            console.log('👋 RabbitMQ disconnected');
        } catch (error) {
            console.error('Error disconnecting from RabbitMQ:', error);
        }
    }

    /**
     * Check if queue is connected
     */
    isConnected(): boolean {
        return this.channel !== null && this.connection !== null;
    }
}

export const queueService = new QueueService();

