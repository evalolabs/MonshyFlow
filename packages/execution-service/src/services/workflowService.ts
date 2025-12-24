import axios from 'axios';
import { config } from '../config/config';
import { Workflow } from '../models/workflow';

class WorkflowService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.agentServiceUrl;
    }

    async getWorkflowById(workflowId: string): Promise<Workflow | null> {
        try {
            // Use internal endpoint for service-to-service communication (requires service key)
            const url = `${this.baseUrl}/api/internal/workflows/${workflowId}`;
            const serviceKey = process.env.INTERNAL_SERVICE_KEY || 'internal-service-key-change-in-production';
            
            console.log(`[WorkflowService] Fetching workflow ${workflowId} from: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'X-Service-Key': serviceKey
                }
            });
            console.log(`[WorkflowService] Successfully fetched workflow ${workflowId}`);
            return response.data;
        } catch (error: any) {
            console.error(`[WorkflowService] Error fetching workflow ${workflowId}:`, error.message);
            if (error.response) {
                console.error(`[WorkflowService] Response status: ${error.response.status}, data:`, JSON.stringify(error.response.data, null, 2));
                console.error(`[WorkflowService] Request URL was: ${error.config?.url || 'unknown'}`);
            } else if (error.request) {
                console.error(`[WorkflowService] No response received. Request config:`, error.config);
            }
            return null;
        }
    }
}

export const workflowService = new WorkflowService();

