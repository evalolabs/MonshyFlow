import { Express, Request, Response } from 'express';
import { DependencyContainer } from 'tsyringe';
import { WorkflowController } from '../controllers/WorkflowController';
import { AdminController } from '../controllers/AdminController';
import { TenantController } from '../controllers/TenantController';
import { OAuth2Controller } from '../controllers/OAuth2Controller';
import { AuditLogController } from '../controllers/AuditLogController';
import { SupportConsentController } from '../controllers/SupportConsentController';
import { authMiddleware } from '../middleware/authMiddleware';
import { serviceKeyMiddleware } from '../middleware/serviceKeyMiddleware';
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
  container.register('TenantController', { useClass: TenantController });
  container.register('OAuth2Controller', { useClass: OAuth2Controller });
  container.register('AuditLogController', { useClass: AuditLogController });
  container.register('SupportConsentController', { useClass: SupportConsentController });
  
  const workflowController = container.resolve(WorkflowController);
  const adminController = container.resolve(AdminController);
  const tenantController = container.resolve(TenantController);
  const oauth2Controller = container.resolve(OAuth2Controller);
  const auditLogController = container.resolve(AuditLogController);
  const supportConsentController = container.resolve(SupportConsentController);
  
  // ============================================
  // Workflow Routes (direkt im API Service)
  // ============================================
  // Alle Workflow Routes benötigen Authentication
  // Diese werden über Kong Gateway (Port 5000) erreichbar sein
  
  // WICHTIG: Spezifische Routes MÜSSEN vor generischen Routes stehen!
  // Sonst interpretiert Express "node", "start-node", "publish" als :id Parameter
  
  // Start Node Update (spezifisch, vor :id)
  app.put('/api/workflows/start-node', authMiddleware, (req, res) => workflowController.updateStartNode(req, res));
  
  // Node Update (spezifisch, vor :id)
  app.put('/api/workflows/node', authMiddleware, (req, res) => workflowController.updateNode(req, res));
  
  // Node Delete (spezifisch, vor :id)
  app.delete('/api/workflows/:workflowId/nodes/:nodeId', authMiddleware, (req, res) => workflowController.deleteNode(req, res));
  
  // Publish Workflow (spezifisch, vor :id)
  app.post('/api/workflows/publish', authMiddleware, (req, res) => workflowController.publish(req, res));
  
  // Get Published Workflows (spezifisch, vor :id)
  app.get('/api/workflows/published', authMiddleware, (req, res) => workflowController.getPublished(req, res));
  
  // Public Workflows Routes (spezifisch, vor :id)
  app.get('/api/workflows/public', authMiddleware, (req, res) => workflowController.getPublicWorkflows(req, res));
  app.get('/api/workflows/public/:id', authMiddleware, (req, res) => workflowController.getPublicWorkflowById(req, res));
  app.post('/api/workflows/public/:id/clone', authMiddleware, (req, res) => workflowController.clonePublicWorkflow(req, res));
  app.post('/api/workflows/public/:id/star', authMiddleware, (req, res) => workflowController.toggleStar(req, res));
  app.get('/api/workflows/public/:id/comments', authMiddleware, (req, res) => workflowController.getComments(req, res));
  app.post('/api/workflows/public/:id/comments', authMiddleware, (req, res) => workflowController.addComment(req, res));
  app.delete('/api/workflows/public/comments/:commentId', authMiddleware, (req, res) => workflowController.deleteComment(req, res));
  
  // Generische Routes (nach spezifischen Routes)
  app.get('/api/workflows', authMiddleware, (req, res) => workflowController.getAll(req, res));
  app.get('/api/workflows/:id', authMiddleware, (req, res) => workflowController.getById(req, res));
  app.post('/api/workflows', authMiddleware, (req, res) => workflowController.create(req, res));
  app.put('/api/workflows/:id', authMiddleware, (req, res) => workflowController.update(req, res));
  app.delete('/api/workflows/:id', authMiddleware, (req, res) => workflowController.delete(req, res));
  
  // Workflow Execution (authenticated)
  // POST /api/workflows/:workflowId/execute
  app.post('/api/workflows/:workflowId/execute', authMiddleware, (req, res) => workflowController.execute(req, res));
  
  // Workflow Export/Import (authenticated)
  // GET /api/workflows/:id/export
  app.get('/api/workflows/:id/export', authMiddleware, (req, res) => workflowController.exportWorkflow(req, res));
  // POST /api/workflows/import
  app.post('/api/workflows/import', authMiddleware, (req, res) => workflowController.importWorkflow(req, res));

  // ============================================
  // Tenant Routes (für normale User)
  // ============================================
  // Tenant Info abrufen (User kann nur eigenen Tenant abrufen)
  app.get('/api/tenants/:tenantId', authMiddleware, (req, res) => tenantController.getTenantById(req, res));
  
  // Workflow Node Testing Route (proxies to execution-service)
  // TEST ENDPOINT: Check if body parsing works at all
  app.post('/api/test-body', async (req: Request, res: Response) => {
    console.log('=== TEST BODY ENDPOINT ===');
    console.log('req.body:', req.body);
    console.log('req.body type:', typeof req.body);
    console.log('req.body keys:', req.body ? Object.keys(req.body) : 'NO_BODY');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
    res.json({ 
      received: req.body,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    });
  });

  app.post('/api/workflows/:workflowId/nodes/:nodeId/test-with-context', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { workflowId, nodeId } = req.params;
      const user = (req as any).user;
      
      // CRITICAL: Log req.body IMMEDIATELY to see if it's empty
      // This will help us understand if Kong Gateway or body-parser is the issue
      console.log('\n🔴🔴🔴 TEST-WITH-CONTEXT - req.body check');
      console.log('🔴 req.body exists:', !!req.body);
      console.log('🔴 req.body type:', typeof req.body);
      console.log('🔴 req.body keys:', req.body ? Object.keys(req.body) : 'NO_BODY');
      console.log('🔴 req.body content:', JSON.stringify(req.body || {}).substring(0, 300));
      console.log('🔴 req.headers[content-type]:', req.headers['content-type']);
      console.log('🔴 req.headers[content-length]:', req.headers['content-length']);
      console.log('🔴 req.rawBody exists:', !!(req as any).rawBody);
      console.log('');
      
      // Also log to stderr for Docker logs
      process.stderr.write(`\n🔴🔴🔴 TEST-WITH-CONTEXT - req.body check\n`);
      process.stderr.write(`🔴 req.body exists: ${!!req.body}\n`);
      process.stderr.write(`🔴 req.body type: ${typeof req.body}\n`);
      process.stderr.write(`🔴 req.body keys: ${req.body ? Object.keys(req.body).join(', ') : 'NO_BODY'}\n`);
      process.stderr.write(`🔴 req.body content: ${JSON.stringify(req.body || {}).substring(0, 300)}\n`);
      process.stderr.write(`🔴 req.headers[content-type]: ${req.headers['content-type']}\n`);
      process.stderr.write(`🔴 req.headers[content-length]: ${req.headers['content-length']}\n\n`);
      
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
      // Frontend sends input data directly as req.body (e.g., { userPrompt: "..." })
      // Use req.body directly as input (not req.body.input)
      const inputData = req.body || {};
      
      logger.info({ 
        workflowId, 
        nodeId,
        bodyType: typeof req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        bodySample: JSON.stringify(req.body).substring(0, 500),
        inputKeys: Object.keys(inputData),
        inputSample: JSON.stringify(inputData).substring(0, 200)
      }, '📥 Received test-node-with-context request - using req.body directly as input');
      
      const executionRequestBody = {
        workflow: {
          ...workflow,
          // Ensure nodes and edges are included
          nodes: workflow.nodes || [],
          edges: workflow.edges || [],
          variables: workflow.variables || {}, // Preserve workflow variables
        },
        nodeId,
        input: inputData, // Use req.body directly, not req.body.input
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
      
      // DEBUG: Include body info in response to see what was received
      // This helps diagnose why req.body might be empty
      const debugInfo = {
        receivedBody: req.body,
        bodyType: typeof req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        bodyString: JSON.stringify(req.body || {}),
        inputData: inputData,
        inputKeys: Object.keys(inputData),
        inputString: JSON.stringify(inputData),
        headersContentType: req.headers['content-type'],
        headersContentLength: req.headers['content-length'],
        executionRequestBodyInput: executionRequestBody.input,
        executionRequestBodyInputKeys: Object.keys(executionRequestBody.input || {}),
      };
      
      // Return response from execution-service with debug info
      res.json({ 
        success: true, 
        data: response.data,
        _debug: debugInfo  // Temporär für Debugging - später entfernen
      });
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
  // Audit Log Routes (DSGVO-Konformität: Transparenz)
  // ============================================
  // Get audit logs for tenant (Tenants können ihre eigenen Logs sehen)
  app.get('/api/audit-logs/tenant/:tenantId', authMiddleware, (req, res) => auditLogController.getTenantAuditLogs(req, res));
  
  // Get all superadmin access logs (nur für Superadmin)
  app.get('/api/audit-logs/superadmin', authMiddleware, (req, res) => auditLogController.getSuperAdminAccessLogs(req, res));
  
  // Get audit logs for a specific resource
  app.get('/api/audit-logs/resource/:resource/:resourceId', authMiddleware, (req, res) => auditLogController.getResourceAuditLogs(req, res));

  // ============================================
  // Support Consent Routes (Tenant-Admin Freigabe für Support)
  // ============================================
  // Tenant-Admin can grant time-limited access for support to view workflow CONTENT
  app.post('/api/support-consents', authMiddleware, (req, res) => supportConsentController.create(req, res));
  app.get('/api/support-consents', authMiddleware, (req, res) => supportConsentController.list(req, res));
  app.delete('/api/support-consents/:id', authMiddleware, (req, res) => supportConsentController.revoke(req, res));
  
  // ============================================
  // Internal Routes (Service-to-Service)
  // ============================================
  // Internal workflow endpoint (für execution-service)
  // GET /api/internal/workflows/:workflowId
  app.get('/api/internal/workflows/:workflowId', serviceKeyMiddleware, (req, res) => workflowController.getByIdInternal(req, res));
  
  // ============================================
  // Webhook Routes (öffentlich, keine Auth erforderlich)
  // ============================================
  // Webhook-Endpoint für Workflow-Execution
  // POST /api/webhooks/:workflowId (Plural für Konsistenz)
  app.post('/api/webhooks/:workflowId', async (req: Request, res: Response) => {
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
          variables: workflow.variables || {}, // Preserve workflow variables
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
