/**
 * Webhook Service
 * 
 * Sends webhook callbacks when runs complete
 */

import axios from 'axios';
import * as crypto from 'crypto';
import { WorkflowRun } from '../models/run';

export interface WebhookPayload {
    run_id: string;
    workflow_id: string;
    status: string;
    output?: any;
    error?: any;
    timestamp: string;
}

class WebhookService {
    private readonly secret: string = process.env.WEBHOOK_SECRET || 'change-me-in-production';
    private readonly timeout: number = 10000; // 10 seconds

    /**
     * Send webhook notification
     */
    async sendWebhook(webhookUrl: string, run: WorkflowRun): Promise<boolean> {
        const payload: WebhookPayload = {
            run_id: run.run_id,
            workflow_id: run.workflow_id,
            status: run.status,
            output: run.output,
            error: run.error,
            timestamp: new Date().toISOString()
        };

        const signature = this.generateSignature(payload);

        try {
            console.log(`📡 Sending webhook to: ${webhookUrl}`);

            const response = await axios.post(webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Signature': signature,
                    'X-Run-Id': run.run_id,
                    'User-Agent': 'AgentBuilder-Webhook/1.0'
                },
                timeout: this.timeout
            });

            console.log(`✅ Webhook delivered: ${response.status}`);
            return true;
        } catch (error: any) {
            console.error(`❌ Webhook failed: ${error.message}`);
            
            // Log but don't throw - webhook failures shouldn't break execution
            if (error.response) {
                console.error(`   Status: ${error.response.status}`);
            }
            
            return false;
        }
    }

    /**
     * Generate HMAC signature for webhook payload
     */
    private generateSignature(payload: any): string {
        const data = JSON.stringify(payload);
        const hmac = crypto.createHmac('sha256', this.secret);
        hmac.update(data);
        return `v1=${hmac.digest('hex')}`;
    }

    /**
     * Verify webhook signature (for receiving webhooks)
     */
    verifySignature(payload: any, signature: string): boolean {
        const expectedSignature = this.generateSignature(payload);
        return signature === expectedSignature;
    }
}

export const webhookService = new WebhookService();

