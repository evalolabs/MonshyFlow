import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { WorkflowService } from '../services/WorkflowService';
import { AuditLogService } from '../services/AuditLogService';
import { SupportConsentService } from '../services/SupportConsentService';
import { NotFoundError } from '@monshy/core';
import { logger } from '@monshy/core';
import { ROLES } from '@monshy/core';

@injectable()
export class WorkflowController {
  constructor(
    @inject('WorkflowService') private workflowService: WorkflowService,
    @inject('AuditLogService') private auditLogService: AuditLogService,
    @inject('SupportConsentService') private supportConsentService: SupportConsentService
  ) {}

  // Helper to check if user is superadmin
  private isSuperAdmin(user: any): boolean {
    if (!user) return false;
    // Check if role is string or array
    if (typeof user.role === 'string') {
      return user.role === ROLES.SUPERADMIN;
    }
    if (Array.isArray(user.roles)) {
      return user.roles.includes(ROLES.SUPERADMIN);
    }
    return false;
  }

  private isSupport(user: any): boolean {
    if (!user) return false;
    if (typeof user.role === 'string') {
      return user.role === ROLES.SUPPORT;
    }
    if (Array.isArray(user.roles)) {
      return user.roles.includes(ROLES.SUPPORT);
    }
    return false;
  }

  // Helper to check tenant access for MUTATING operations (strict)
  private async checkTenantAccess(workflowId: string, user: any): Promise<{ allowed: boolean; workflow?: any }> {
    const workflow = await this.workflowService.getById(workflowId);
    if (!workflow) {
      return { allowed: false };
    }
    
    const workflowObj = workflow.toObject ? workflow.toObject() : workflow;
    
    // Only the owning tenant may mutate workflows (superadmin/support are blocked cross-tenant)
    if (!user.tenantId || workflowObj.tenantId !== user.tenantId) {
      logger.warn({ 
        requestedWorkflowId: workflowId, 
        userTenantId: user.tenantId, 
        workflowTenantId: workflowObj.tenantId 
      }, 'Forbidden: User tried to access workflow from another tenant');
      return { allowed: false, workflow: workflowObj };
    }
    
    return { allowed: true, workflow: workflowObj };
  }

  // Helper to convert MongoDB document to JSON
  private toJSON(workflow: any, isSuperAdmin: boolean = false) {
    // Superadmin sieht nur Metadaten (DSGVO-Konformität: Datenminimierung)
    if (isSuperAdmin) {
      return {
        id: workflow._id.toString(),
        name: workflow.name,
        description: workflow.description,
        tenantId: workflow.tenantId,
        userId: workflow.userId,
        status: workflow.status,
        isPublished: workflow.isPublished,
        publishedAt: workflow.publishedAt,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        executionCount: workflow.executionCount,
        lastExecutedAt: workflow.lastExecutedAt,
        isActive: workflow.isActive,
        // ❌ KEINE nodes, edges, tags, scheduleConfig - enthalten möglicherweise personenbezogene Daten
      };
    }
    
    // Normale User sehen vollständige Daten
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
      variables: workflow.variables || {}, // Workflow variables
    };
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const isSuperAdminUser = this.isSuperAdmin(user);
      const isSupportUser = this.isSupport(user);
      
      // Security: Only superadmin/support can specify tenantId parameter
      let tenantId: string | undefined = user.tenantId;
      if (req.query.tenantId) {
        if (isSuperAdminUser) {
          tenantId = req.query.tenantId as string;
        } else if (isSupportUser) {
          // Support may target a tenant ONLY if there is an active consent
          const requestedTenantId = req.query.tenantId as string;
          if (!user.userId) {
            res.status(401).json({ success: false, error: 'Unauthorized: support userId missing' });
            return;
          }
          const allowed = await this.supportConsentService.hasWorkflowContentConsent({
            tenantId: requestedTenantId,
            supportUserId: user.userId,
          });
          if (!allowed) {
            res.status(403).json({ success: false, error: 'Forbidden: No active tenant-admin consent for this tenant' });
            return;
          }
          tenantId = requestedTenantId;
        } else {
          // Normal users cannot override tenantId - use their own
          logger.warn({ 
            userId: user.userId, 
            requestedTenantId: req.query.tenantId,
            userTenantId: user.tenantId 
          }, 'User attempted to access workflows from different tenant');
          tenantId = user.tenantId;
        }
      }
      
      const workflows = await this.workflowService.getAll(tenantId);
      res.json({ 
        success: true, 
        // Support gets only metadata in list view; content is available via GET /api/workflows/:id (with consent)
        data: workflows.map(w => this.toJSON(w, isSuperAdminUser || isSupportUser))
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get workflows');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      
      const workflow = await this.workflowService.getById(id);
      if (!workflow) {
        throw new NotFoundError('Workflow', id);
      }
      const workflowObj = workflow.toObject ? workflow.toObject() : workflow;

      // Owner tenant: full access (except superadmin view is minimized)
      if (user?.tenantId && workflowObj.tenantId === user.tenantId) {
        res.json({ success: true, data: this.toJSON(workflowObj, this.isSuperAdmin(user)) });
        return;
      }

      // Superadmin: may see only METADATA (no content) across tenants
      if (this.isSuperAdmin(user)) {
        res.json({ success: true, data: this.toJSON(workflowObj, true) });
        return;
      }

      // Support: may see CONTENT only with active tenant-admin consent for this tenant
      if (this.isSupport(user)) {
        if (!user.userId) {
          res.status(401).json({ success: false, error: 'Unauthorized: support userId missing' });
          return;
        }
        const allowed = await this.supportConsentService.hasWorkflowContentConsent({
          tenantId: workflowObj.tenantId,
          supportUserId: user.userId,
        });
        if (!allowed) {
          res.status(403).json({ success: false, error: 'Forbidden: Tenant admin has not granted workflow-content access (or it expired)' });
          return;
        }
        // Return full workflow (still without secrets; secrets are separate service and blocked)
        res.json({ success: true, data: this.toJSON(workflowObj, false) });
        return;
      }

      res.status(403).json({ success: false, error: 'Forbidden: You can only access workflows from your own tenant' });
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
      res.status(201).json({ success: true, data: this.toJSON(workflow, this.isSuperAdmin(user)) });
    } catch (error) {
      logger.error({ err: error }, 'Failed to create workflow');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      
      // Check tenant access before update
      const access = await this.checkTenantAccess(id, user);
      if (!access.allowed) {
        if (!access.workflow) {
          throw new NotFoundError('Workflow', id);
        }
        res.status(403).json({ 
          success: false, 
          error: 'Forbidden: You can only update workflows from your own tenant' 
        });
        return;
      }
      
      // Superadmin/support cannot reach here cross-tenant (strict checkTenantAccess)
      
      const workflow = await this.workflowService.update(id, req.body);
      logger.info({ workflowId: id }, 'Workflow updated');
      res.json({ success: true, data: this.toJSON(workflow, this.isSuperAdmin(user)) });
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
      const user = (req as any).user;
      
      // Check tenant access before delete
      const access = await this.checkTenantAccess(id, user);
      if (!access.allowed) {
        if (!access.workflow) {
          throw new NotFoundError('Workflow', id);
        }
        res.status(403).json({ 
          success: false, 
          error: 'Forbidden: You can only delete workflows from your own tenant' 
        });
        return;
      }
      
      // Superadmin/support cannot reach here cross-tenant (strict checkTenantAccess)
      
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
      const user = (req as any).user;
      
      if (!workflowId || !nodeId) {
        res.status(400).json({ success: false, error: 'workflowId and nodeId are required' });
        return;
      }

      // Check tenant access before update
      const access = await this.checkTenantAccess(workflowId, user);
      if (!access.allowed) {
        if (!access.workflow) {
          res.status(404).json({ success: false, error: 'Workflow not found' });
          return;
        }
        res.status(403).json({ 
          success: false, 
          error: 'Forbidden: You can only update nodes in workflows from your own tenant' 
        });
        return;
      }

      // Superadmin/support cannot reach here cross-tenant (strict checkTenantAccess)

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
      const user = (req as any).user;
      
      if (!workflowId || !nodeId) {
        res.status(400).json({ success: false, error: 'workflowId and nodeId are required' });
        return;
      }

      // Check tenant access before update
      const access = await this.checkTenantAccess(workflowId, user);
      if (!access.allowed) {
        if (!access.workflow) {
          res.status(404).json({ success: false, error: 'Workflow not found' });
          return;
        }
        res.status(403).json({ 
          success: false, 
          error: 'Forbidden: You can only update nodes in workflows from your own tenant' 
        });
        return;
      }

      // Superadmin/support cannot reach here cross-tenant (strict checkTenantAccess)

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
      const user = (req as any).user;
      
      if (!workflowId) {
        res.status(400).json({ success: false, error: 'workflowId is required' });
        return;
      }

      // Check tenant access before publish
      const access = await this.checkTenantAccess(workflowId, user);
      if (!access.allowed) {
        if (!access.workflow) {
          res.status(404).json({ success: false, error: 'Workflow not found' });
          return;
        }
        res.status(403).json({ 
          success: false, 
          error: 'Forbidden: You can only publish workflows from your own tenant' 
        });
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
      
      // Security: Only superadmin can specify tenantId parameter
      let tenantId: string | undefined = user?.tenantId;
      if (req.query.tenantId) {
        if (this.isSuperAdmin(user)) {
          tenantId = req.query.tenantId as string;
        } else {
          // Normal users cannot override tenantId - use their own
          logger.warn({ 
            userId: user?.userId, 
            requestedTenantId: req.query.tenantId,
            userTenantId: user?.tenantId 
          }, 'User attempted to access published workflows from different tenant');
          tenantId = user?.tenantId;
        }
      }
      
      const workflows = await this.workflowService.getPublished(tenantId);
      const isSuperAdminUser = this.isSuperAdmin(user);
      res.json({ 
        success: true, 
        data: workflows.map(w => this.toJSON(w, isSuperAdminUser))
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get published workflows');
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async deleteNode(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId, nodeId } = req.params;
      const user = (req as any).user;
      
      if (!workflowId || !nodeId) {
        res.status(400).json({ success: false, error: 'workflowId and nodeId are required' });
        return;
      }

      // Check tenant access before delete
      const access = await this.checkTenantAccess(workflowId, user);
      if (!access.allowed) {
        if (!access.workflow) {
          res.status(404).json({ success: false, error: 'Workflow not found' });
          return;
        }
        res.status(403).json({ 
          success: false, 
          error: 'Forbidden: You can only delete nodes in workflows from your own tenant' 
        });
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
  /**
   * Export workflow as JSON file
   * GET /api/workflows/:id/export
   */
  async exportWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      
      // Check access
      const accessCheck = await this.checkTenantAccess(id, user);
      if (!accessCheck.allowed) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }
      
      const workflow = accessCheck.workflow!;
      const workflowObj = workflow.toObject ? workflow.toObject() : workflow;
      
      // Create export object with metadata
      const exportData = {
        // Export metadata
        exportVersion: '1.0',
        exportedAt: new Date().toISOString(),
        exportedBy: user.userId || user.email || 'unknown',
        
        // Workflow data (exclude sensitive/internal fields)
        workflow: {
          name: workflowObj.name,
          description: workflowObj.description,
          version: workflowObj.version,
          nodes: workflowObj.nodes || [],
          edges: workflowObj.edges || [],
          tags: workflowObj.tags || [],
          useAgentsSDK: workflowObj.useAgentsSDK || false,
          enableStreaming: workflowObj.enableStreaming,
          guardrails: workflowObj.guardrails,
          variables: workflowObj.variables || {}, // Include workflow variables
          scheduleConfig: workflowObj.scheduleConfig,
          // Exclude: id, userId, tenantId, createdAt, updatedAt, isPublished, publishedAt, status, executionCount, lastExecutedAt, isActive
          // Exclude: secrets (security - never export secrets)
        },
        
        // Instructions for import
        importInstructions: {
          note: 'This workflow can be imported to create a new workflow. Secrets and execution metadata are not included.',
          requiredSecrets: this.extractRequiredSecrets(workflowObj.nodes || []),
        }
      };
      
      // Set headers for file download
      const filename = `workflow-${workflowObj.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.json({ success: true, data: exportData });
    } catch (error: any) {
      logger.error({ error: error.message, stack: error.stack }, 'Error exporting workflow');
      res.status(500).json({ success: false, error: 'Failed to export workflow' });
    }
  }

  /**
   * Import workflow from JSON file
   * POST /api/workflows/import
   */
  async importWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { workflow, name, description } = req.body;
      
      if (!workflow) {
        res.status(400).json({ success: false, error: 'Workflow data is required' });
        return;
      }
      
      // Validate workflow structure
      if (!workflow.name && !name) {
        res.status(400).json({ success: false, error: 'Workflow name is required' });
        return;
      }
      
      if (!Array.isArray(workflow.nodes)) {
        res.status(400).json({ success: false, error: 'Invalid workflow: nodes must be an array' });
        return;
      }
      
      if (!Array.isArray(workflow.edges)) {
        res.status(400).json({ success: false, error: 'Invalid workflow: edges must be an array' });
        return;
      }
      
      // Create new workflow from import
      const workflowData: any = {
        name: name || workflow.name || 'Imported Workflow',
        description: description || workflow.description || '',
        version: workflow.version || 1,
        nodes: workflow.nodes || [],
        edges: workflow.edges || [],
        tags: workflow.tags || [],
        useAgentsSDK: workflow.useAgentsSDK || false,
        enableStreaming: workflow.enableStreaming,
        guardrails: workflow.guardrails,
        variables: workflow.variables || {}, // Import workflow variables
        scheduleConfig: workflow.scheduleConfig,
        userId: user.userId || user.id,
        tenantId: user.tenantId,
        isPublished: false, // Always import as draft
        status: 'draft',
        isActive: true,
        executionCount: 0,
      };
      
      // Validate nodes and edges
      const validationError = this.validateWorkflowStructure(workflowData);
      if (validationError) {
        res.status(400).json({ success: false, error: validationError });
        return;
      }
      
      // Create workflow
      const created = await this.workflowService.create(workflowData);
      
      // Log import (using logger instead of audit log for now)
      logger.info({
        userId: user.userId || user.id,
        tenantId: user.tenantId,
        workflowId: created.id,
        importedName: workflow.name,
        importedVersion: workflow.version,
      }, 'Workflow imported');
      
      res.json({ 
        success: true, 
        data: this.toJSON(created, this.isSuperAdmin(user)),
        message: 'Workflow imported successfully'
      });
    } catch (error: any) {
      logger.error({ error: error.message, stack: error.stack }, 'Error importing workflow');
      res.status(500).json({ success: false, error: 'Failed to import workflow: ' + error.message });
    }
  }

  /**
   * Extract required secrets from workflow nodes
   */
  private extractRequiredSecrets(nodes: any[]): string[] {
    const secrets = new Set<string>();
    
    for (const node of nodes) {
      // Check node data for secret references
      const nodeData = node.data || {};
      const nodeString = JSON.stringify(nodeData);
      
      // Look for common secret patterns
      const secretPattern = /\{\{secrets\.([^}]+)\}\}/g;
      let match;
      while ((match = secretPattern.exec(nodeString)) !== null) {
        secrets.add(match[1]);
      }
    }
    
    return Array.from(secrets);
  }

  /**
   * Validate workflow structure
   */
  private validateWorkflowStructure(workflow: any): string | null {
    // Check for start node
    const hasStartNode = workflow.nodes.some((n: any) => n.type === 'start');
    if (!hasStartNode) {
      return 'Workflow must have at least one start node';
    }
    
    // Validate node IDs are unique
    const nodeIds = new Set<string>();
    for (const node of workflow.nodes) {
      if (!node.id) {
        return 'All nodes must have an id';
      }
      if (nodeIds.has(node.id)) {
        return `Duplicate node id: ${node.id}`;
      }
      nodeIds.add(node.id);
    }
    
    // Validate edges reference existing nodes
    for (const edge of workflow.edges) {
      if (!edge.source || !edge.target) {
        return 'All edges must have source and target';
      }
      if (!nodeIds.has(edge.source)) {
        return `Edge references non-existent source node: ${edge.source}`;
      }
      if (!nodeIds.has(edge.target)) {
        return `Edge references non-existent target node: ${edge.target}`;
      }
    }
    
    // Validate loop pairs
    const loopNodes = workflow.nodes.filter((n: any) => n.type === 'loop' && n.data?.pairId);
    for (const loopNode of loopNodes) {
      const pairId = loopNode.data.pairId;
      const endLoopNode = workflow.nodes.find((n: any) => n.type === 'end-loop' && n.data?.pairId === pairId);
      if (!endLoopNode) {
        return `Loop node ${loopNode.id} has no matching end-loop node with pairId ${pairId}`;
      }
    }
    
    return null;
  }

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

