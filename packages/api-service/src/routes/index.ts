import { Express, Request, Response } from 'express';
import { DependencyContainer } from 'tsyringe';
import { WorkflowController } from '../controllers/WorkflowController';
import { AdminController } from '../controllers/AdminController';
import { authMiddleware } from '../middleware/authMiddleware';
import { logger } from '@monshy/core';
import axios from 'axios';
import { config } from '../config';

/**
 * API Service Routes Setup
 * 
 * HINWEIS: Gateway-Funktionalität wurde zu Kong OSS migriert.
 * Der API Service behandelt nur noch lokale Workflow-Routes.
 * Alle anderen Routes werden über Kong Gateway (Port 8000) geroutet.
 * 
 * Siehe: kong/kong.yml für Gateway-Konfiguration
 * 
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *         requestId:
 *           type: string
 *     Success:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 */
export function setupRoutes(app: Express, container: DependencyContainer): void {
  logger.info('Setting up API Service routes (Workflow Management and Admin)');
  
  // Register Controllers
  container.register('WorkflowController', { useClass: WorkflowController });
  container.register('AdminController', { useClass: AdminController });
  
  const workflowController = container.resolve(WorkflowController);
  const adminController = container.resolve(AdminController);
  
  // ============================================
  // Workflow Routes (direkt im API Service)
  // ============================================
  // Alle Workflow Routes benötigen Authentication
  // Diese werden über Kong Gateway (Port 5000) erreichbar sein
  app.get('/api/workflows', authMiddleware, (req, res) => workflowController.getAll(req, res));
  app.get('/api/workflows/:id', authMiddleware, (req, res) => workflowController.getById(req, res));
  app.post('/api/workflows', authMiddleware, (req, res) => workflowController.create(req, res));
  app.put('/api/workflows/:id', authMiddleware, (req, res) => workflowController.update(req, res));
  app.delete('/api/workflows/:id', authMiddleware, (req, res) => workflowController.delete(req, res));
  
  // Workflow Node Testing Route (proxies to execution-service)
  app.post('/api/workflows/:workflowId/nodes/:nodeId/test-with-context', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { workflowId, nodeId } = req.params;
      const user = (req as any).user;
      
      // Get workflow directly from service (not through controller)
      const workflowService = container.resolve('WorkflowService') as any;
      const workflowData = await workflowService.getById(workflowId);
      
      if (!workflowData) {
        return res.status(404).json({ success: false, error: 'Workflow not found' });
      }
      
      // Convert MongoDB document to plain object if needed
      const workflow = workflowData.toObject ? workflowData.toObject() : workflowData;
      
      // Load and decrypt secrets for the tenant
      let secrets: Record<string, string> = {};
      try {
        const secretsServiceUrl = config.services.secrets.url;
        const internalServiceKey = process.env.INTERNAL_SERVICE_KEY || 'internal-service-key';
        
        const secretsResponse = await axios.get(
          `${secretsServiceUrl}/api/internal/secrets/tenant/${user.tenantId}`,
          {
            headers: {
              'X-Service-Key': internalServiceKey,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          }
        );
        
        if (secretsResponse.data.success && Array.isArray(secretsResponse.data.data)) {
          // Convert array of {name, value} to object {name: value}
          secrets = secretsResponse.data.data.reduce((acc: Record<string, string>, secret: any) => {
            if (secret && secret.name && secret.value) {
              acc[secret.name] = secret.value;
            }
            return acc;
          }, {});
          logger.debug({ tenantId: user.tenantId, secretCount: Object.keys(secrets).length }, 'Loaded secrets for workflow node test');
        }
      } catch (secretsError: any) {
        logger.warn({ err: secretsError, tenantId: user.tenantId }, 'Failed to load secrets, continuing without secrets');
        // Continue without secrets - execution-service will handle missing secrets
      }
      
      // Prepare request body for execution-service
      const executionRequestBody = {
        workflow: {
          ...workflow,
          // Ensure nodes and edges are included
          nodes: workflow.nodes || [],
          edges: workflow.edges || [],
        },
        nodeId,
        input: req.body.input || {},
        secrets: secrets, // Use loaded secrets instead of req.body.secrets
      };
      
      // Forward to execution-service
      const executionServiceUrl = config.services.execution.url;
      logger.debug({ executionServiceUrl, workflowId, nodeId, secretCount: Object.keys(secrets).length }, 'Forwarding node test to execution-service');
      
      const response = await axios.post(
        `${executionServiceUrl}/api/execute/test-node-with-context`,
        executionRequestBody,
        {
          headers: {
            'Authorization': req.headers.authorization,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout for node testing
        }
      );
      
      // Return response from execution-service
      res.json({ success: true, data: response.data });
    } catch (error: any) {
      logger.error({ err: error, workflowId: req.params.workflowId, nodeId: req.params.nodeId }, 'Failed to test node');
      
      if (error.response) {
        // Forward error from execution-service
        res.status(error.response.status).json({
          success: false,
          error: error.response.data?.error || error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to test node',
        });
      }
    }
  });
  
  // ============================================
  // Admin Routes (direkt im API Service)
  // ============================================
  // Alle Admin Routes benötigen Authentication
  // Diese werden über Kong Gateway (Port 5000) erreichbar sein
  // Statistics
  app.get('/api/admin/statistics', authMiddleware, (req, res) => adminController.getStatistics(req, res));
  
  // Users
  app.get('/api/admin/users', authMiddleware, (req, res) => adminController.getAllUsers(req, res));
  app.get('/api/admin/users/:id', authMiddleware, (req, res) => adminController.getUserById(req, res));
  app.post('/api/admin/users', authMiddleware, (req, res) => adminController.createUser(req, res));
  app.put('/api/admin/users/:id', authMiddleware, (req, res) => adminController.updateUser(req, res));
  app.delete('/api/admin/users/:id', authMiddleware, (req, res) => adminController.deleteUser(req, res));
  
  // Tenants
  app.get('/api/admin/tenants', authMiddleware, (req, res) => adminController.getAllTenants(req, res));
  app.get('/api/admin/tenants/:id', authMiddleware, (req, res) => adminController.getTenantById(req, res));
  app.post('/api/admin/tenants', authMiddleware, (req, res) => adminController.createTenant(req, res));
  app.put('/api/admin/tenants/:id', authMiddleware, (req, res) => adminController.updateTenant(req, res));
  app.delete('/api/admin/tenants/:id', authMiddleware, (req, res) => adminController.deleteTenant(req, res));
  
  // Roles
  app.get('/api/admin/roles', authMiddleware, (req, res) => adminController.getRoles(req, res));
  
  // ============================================
  // Webhook Routes (öffentlich, keine Auth erforderlich)
  // ============================================
  // Webhook-Endpoint für Workflow-Execution
  // POST /api/webhook/:workflowId
  app.post('/api/webhook/:workflowId', async (req: Request, res: Response) => {
    try {
      const { workflowId } = req.params;
      const input = req.body || {};
      
      logger.info({ workflowId, hasInput: !!input }, 'Received webhook request');
      
      // Get workflow from database
      const workflowService = container.resolve('WorkflowService') as any;
      const workflowData = await workflowService.getById(workflowId);
      
      if (!workflowData) {
        return res.status(404).json({ success: false, error: 'Workflow not found' });
      }
      
      // Check if workflow is active
      const workflow = workflowData.toObject ? workflowData.toObject() : workflowData;
      if (!workflow.isActive) {
        return res.status(400).json({ 
          success: false, 
          error: 'Workflow is not active' 
        });
      }
      
      // Warn if workflow is not published (but allow execution for testing)
      if (!workflow.isPublished) {
        logger.warn({ workflowId }, 'Webhook called for unpublished workflow (allowing for testing)');
      }
      
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
          // Convert array of {name, value} to object {name: value}
          secrets = secretsResponse.data.data.reduce((acc: Record<string, string>, secret: any) => {
            if (secret && secret.name && secret.value) {
              acc[secret.name] = secret.value;
            }
            return acc;
          }, {});
          logger.debug({ tenantId: workflow.tenantId, secretCount: Object.keys(secrets).length }, 'Loaded secrets for webhook execution');
        }
      } catch (secretsError: any) {
        logger.warn({ err: secretsError, tenantId: workflow.tenantId }, 'Failed to load secrets, continuing without secrets');
        // Continue without secrets - execution-service will handle missing secrets
      }
      
      // Prepare request body for execution-service
      // The execution-service expects: { input, options?, webhook_url?, metadata?, workflow_version? }
      // But we can also pass workflow in the request, which will be used if provided
      const executionRequestBody: any = {
        input: input,
        options: {
          stream: false,
          background: false,
          store: true,
        },
        metadata: {
          source: 'webhook',
          workflowId: workflowId,
        },
        // Pass workflow with secrets attached - execution-service will use it if provided
        workflow: {
          ...workflow,
          nodes: workflow.nodes || [],
          edges: workflow.edges || [],
          secrets: secrets, // Attach secrets to workflow
        },
      };
      
      // Forward to execution-service
      const executionServiceUrl = config.services.execution.url;
      logger.debug({ executionServiceUrl, workflowId, secretCount: Object.keys(secrets).length }, 'Forwarding webhook request to execution-service');
      
      const response = await axios.post(
        `${executionServiceUrl}/v1/workflows/${workflowId}/runs`,
        executionRequestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 seconds timeout for webhook execution
        }
      );
      
      // Return response from execution-service
      res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error({ err: error, workflowId: req.params.workflowId }, 'Failed to execute webhook');
      
      if (error.response) {
        // Forward error from execution-service
        res.status(error.response.status).json({
          success: false,
          error: error.response.data?.error || error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to execute webhook',
        });
      }
    }
  });
  
  logger.info('✅ Workflow routes registered');
  logger.info('✅ Admin routes registered');
  logger.info('✅ Webhook routes registered');
}
