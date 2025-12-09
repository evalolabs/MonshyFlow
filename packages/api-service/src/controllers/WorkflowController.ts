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
}

