import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { WorkflowService } from '../services/WorkflowService';
import { NotFoundError } from '@monshy/core';
import { logger } from '@monshy/core';

@injectable()
export class WorkflowController {
  constructor(
    @inject('WorkflowService') private workflowService: WorkflowService
  ) {}

  // Helper to convert MongoDB document to JSON
  private toJSON(workflow: any) {
    return {
      id: workflow._id.toString(),
      name: workflow.name,
      description: workflow.description,
      version: workflow.version,
      nodes: workflow.nodes,
      edges: workflow.edges,
      userId: workflow.userId,
      tenantId: workflow.tenantId,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      isPublished: workflow.isPublished,
      publishedAt: workflow.publishedAt,
      status: workflow.status,
      tags: workflow.tags,
      useAgentsSDK: workflow.useAgentsSDK,
      executionCount: workflow.executionCount,
      lastExecutedAt: workflow.lastExecutedAt,
      isActive: workflow.isActive,
      scheduleConfig: workflow.scheduleConfig,
    };
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      // Tenant ID aus User oder Query Parameter
      const tenantId = (req.query.tenantId as string) || user.tenantId;
      const workflows = await this.workflowService.getAll(tenantId);
      res.json({ 
        success: true, 
        data: workflows.map(w => this.toJSON(w))
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get workflows');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const workflow = await this.workflowService.getById(id);
      
      if (!workflow) {
        throw new NotFoundError('Workflow', id);
      }
      
      res.json({ success: true, data: this.toJSON(workflow) });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to get workflow');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const workflow = await this.workflowService.create({
        ...req.body,
        userId: user.userId,
        tenantId: user.tenantId,
      });
      logger.info({ workflowId: workflow._id.toString() }, 'Workflow created');
      res.status(201).json({ success: true, data: this.toJSON(workflow) });
    } catch (error) {
      logger.error({ err: error }, 'Failed to create workflow');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const workflow = await this.workflowService.update(id, req.body);
      logger.info({ workflowId: id }, 'Workflow updated');
      res.json({ success: true, data: this.toJSON(workflow) });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to update workflow');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.workflowService.delete(id);
      logger.info({ workflowId: id }, 'Workflow deleted');
      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to delete workflow');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async updateStartNode(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId, nodeId } = req.body;
      if (!workflowId || !nodeId) {
        res.status(400).json({ success: false, error: 'workflowId and nodeId are required' });
        return;
      }

      const config = {
        label: req.body.label,
        entryType: req.body.entryType,
        endpoint: req.body.endpoint,
        baseUrl: req.body.baseUrl,
        method: req.body.method,
        description: req.body.description,
        executionMode: req.body.executionMode,
        timeout: req.body.timeout,
        webhookUrl: req.body.webhookUrl,
        inputSchema: req.body.inputSchema,
        scheduleConfig: req.body.scheduleConfig,
      };

      // Remove undefined values
      Object.keys(config).forEach(key => {
        if ((config as any)[key] === undefined) {
          delete (config as any)[key];
        }
      });

      await this.workflowService.updateStartNode(workflowId, nodeId, config);
      logger.info({ workflowId, nodeId }, 'Start node updated');
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, 'Failed to update start node');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async updateNode(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId, nodeId } = req.body;
      if (!workflowId || !nodeId) {
        res.status(400).json({ success: false, error: 'workflowId and nodeId are required' });
        return;
      }

      const config = {
        type: req.body.type,
        data: req.body.data,
      };

      // Remove undefined values
      Object.keys(config).forEach(key => {
        if ((config as any)[key] === undefined) {
          delete (config as any)[key];
        }
      });

      await this.workflowService.updateNode(workflowId, nodeId, config);
      logger.info({ workflowId, nodeId }, 'Node updated');
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, 'Failed to update node');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async publish(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId, description } = req.body;
      if (!workflowId) {
        res.status(400).json({ success: false, error: 'workflowId is required' });
        return;
      }

      await this.workflowService.publish(workflowId, description);
      logger.info({ workflowId }, 'Workflow published');
      res.json({ success: true });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        logger.error({ err: error }, 'Failed to publish workflow');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async getPublished(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const tenantId = (req.query.tenantId as string) || user?.tenantId;
      const workflows = await this.workflowService.getPublished(tenantId);
      res.json({ 
        success: true, 
        data: workflows.map(w => this.toJSON(w))
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get published workflows');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async deleteNode(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId, nodeId } = req.params;
      if (!workflowId || !nodeId) {
        res.status(400).json({ success: false, error: 'workflowId and nodeId are required' });
        return;
      }

      await this.workflowService.deleteNode(workflowId, nodeId);
      logger.info({ workflowId, nodeId }, 'Node deleted');
      res.json({ success: true, message: 'Node deleted successfully' });
    } catch (error) {
      if ((error as Error).message === 'Workflow not found' || (error as Error).message === 'Node not found') {
        res.status(404).json({ success: false, error: (error as Error).message });
      } else {
        logger.error({ err: error }, 'Failed to delete node');
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  /**
   * Execute workflow (authenticated endpoint)
   * POST /api/workflows/:workflowId/execute
   */
  async execute(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      const user = (req as any).user;
      const input = req.body.input || req.body;
      
      // Validate user authentication
      if (!user || !user.tenantId) {
        logger.warn({ workflowId, hasUser: !!user, userKeys: user ? Object.keys(user) : [] }, 'Unauthorized: Missing user or tenantId');
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized: Invalid or missing authentication. Please check your API key or JWT token.' 
        });
        return;
      }
      
      // Load workflow
      const workflowData = await this.workflowService.getById(workflowId);
      
      if (!workflowData) {
        logger.warn({ workflowId, tenantId: user.tenantId }, 'Workflow not found');
        res.status(404).json({ success: false, error: 'Workflow not found' });
        return;
      }
      
      // Security check: User can only execute workflows from their tenant
      const workflow = workflowData.toObject ? workflowData.toObject() : workflowData;
      if (!workflow.tenantId) {
        logger.error({ workflowId }, 'Workflow has no tenantId');
        res.status(500).json({ success: false, error: 'Workflow configuration error: missing tenantId' });
        return;
      }
      
      if (workflow.tenantId !== user.tenantId) {
        logger.warn({ 
          requestedWorkflowId: workflowId, 
          userTenantId: user.tenantId, 
          workflowTenantId: workflow.tenantId,
          authMethod: user.authMethod 
        }, 'Forbidden: User tried to execute workflow from another tenant');
        res.status(403).json({ 
          success: false, 
          error: 'Forbidden: You can only execute workflows from your own tenant' 
        });
        return;
      }
      
      // Import here to avoid circular dependencies
      const axios = require('axios');
      const { config } = require('../config');
      
      // Load and decrypt secrets for the tenant
      let secrets: Record<string, string> = {};
      try {
        const secretsServiceUrl = config.services.secrets.url;
        const internalServiceKey = process.env.INTERNAL_SERVICE_KEY || 'internal-service-key';
        
        const secretsResponse = await axios.get(
          `${secretsServiceUrl}/api/internal/secrets/tenant/${workflow.tenantId}`,
          {
            headers: {
              'X-Service-Key': internalServiceKey,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          }
        );
        
        if (secretsResponse.data.success && Array.isArray(secretsResponse.data.data)) {
          secrets = secretsResponse.data.data.reduce((acc: Record<string, string>, secret: any) => {
            if (secret && secret.name && secret.value) {
              acc[secret.name] = secret.value;
            }
            return acc;
          }, {});
          logger.debug({ tenantId: workflow.tenantId, secretCount: Object.keys(secrets).length }, 'Loaded secrets for workflow execution');
        }
      } catch (secretsError: any) {
        logger.warn({ err: secretsError, tenantId: workflow.tenantId }, 'Failed to load secrets, continuing without secrets');
      }
      
      // Prepare request body for execution-service (WITH workflow data)
      const executionRequestBody: any = {
        input: input,
        tenantId: workflow.tenantId,
        // Pass workflow with secrets attached - execution-service will use it
        workflow: {
          ...workflow,
          nodes: workflow.nodes || [],
          edges: workflow.edges || [],
          secrets: secrets,
        },
      };
      
      // Forward to execution-service
      const executionServiceUrl = config.services.execution.url;
      logger.debug({ executionServiceUrl, workflowId, secretCount: Object.keys(secrets).length }, 'Forwarding execute request to execution-service');
      
      const response = await axios.post(
        `${executionServiceUrl}/api/execute/${workflowId}`,
        executionRequestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 120 seconds timeout
        }
      );
      
      // Return response from execution-service
      res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error({ 
        err: error, 
        workflowId: req.params.workflowId,
        errorMessage: error.message,
        errorStack: error.stack,
        errorResponse: error.response?.data,
        errorStatus: error.response?.status
      }, 'Failed to execute workflow');
      
      if (error.response) {
        // Forward error from execution-service with more details
        const errorMessage = error.response.data?.error || error.response.data?.message || error.message;
        res.status(error.response.status).json({
          success: false,
          error: errorMessage,
          details: error.response.data?.details || undefined,
        });
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        // Connection errors
        res.status(503).json({
          success: false,
          error: 'Service temporarily unavailable: Execution service is not reachable',
          code: error.code,
        });
      } else {
        // Other errors
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to execute workflow',
          code: error.code || 'INTERNAL_ERROR',
        });
      }
    }
  }

  /**
   * Get workflow by ID (internal endpoint for service-to-service)
   * GET /api/internal/workflows/:workflowId
   */
  async getByIdInternal(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      const workflow = await this.workflowService.getById(workflowId);
      
      if (!workflow) {
        res.status(404).json({ 
          success: false, 
          error: `Workflow ${workflowId} not found` 
        });
        return;
      }
      
      // Return workflow data directly (no wrapper for internal use)
      res.json(this.toJSON(workflow));
    } catch (error) {
      logger.error({ err: error, workflowId: req.params.workflowId }, 'Failed to get workflow (internal)');
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }
}

