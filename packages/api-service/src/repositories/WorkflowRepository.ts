import { injectable } from 'tsyringe';
import { Workflow, IWorkflow } from '@monshy/database';
import { NotFoundError } from '@monshy/core';
import { logger } from '@monshy/core';

@injectable()
export class WorkflowRepository {
  async findAll(): Promise<IWorkflow[]> {
    try {
      return await Workflow.find({}).sort({ createdAt: -1 }).exec();
    } catch (error) {
      logger.error({ err: error }, 'Failed to find all workflows');
      throw error;
    }
  }

  async findById(id: string): Promise<IWorkflow | null> {
    try {
      return await Workflow.findById(id).exec();
    } catch (error) {
      logger.error({ err: error, workflowId: id }, 'Failed to find workflow by id');
      throw error;
    }
  }

  async findByTenantId(tenantId: string): Promise<IWorkflow[]> {
    try {
      return await Workflow.find({ tenantId }).sort({ createdAt: -1 }).exec();
    } catch (error) {
      logger.error({ err: error, tenantId }, 'Failed to find workflows by tenant');
      throw error;
    }
  }

  async create(data: {
    name: string;
    description?: string;
    nodes?: any[];
    edges?: any[];
    tenantId: string;
    userId: string;
    clonedFrom?: string;
    originalAuthorId?: string;
    cloneCount?: number;
    [key: string]: any; // Allow additional fields
  }): Promise<IWorkflow> {
    try {
      const workflow = new Workflow({
        ...data,
        nodes: data.nodes || [],
        edges: data.edges || [],
        version: 1,
        status: 'draft',
        isPublished: false,
        isActive: true,
        executionCount: 0,
        tags: [],
        useAgentsSDK: false,
      });
      
      return await workflow.save();
    } catch (error) {
      logger.error({ err: error, data }, 'Failed to create workflow');
      throw error;
    }
  }

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    nodes: any[];
    edges: any[];
    status: 'draft' | 'published' | 'archived';
    isPublished: boolean;
    isActive: boolean;
    scheduleConfig: any;
    publishedAt: Date;
    cloneCount: number;
    clonedFrom: string;
    originalAuthorId: string;
    starCount: number;
    starredBy: string[];
  }>): Promise<IWorkflow> {
    try {
      const workflow = await Workflow.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec();
      
      if (!workflow) {
        throw new NotFoundError('Workflow', id);
      }
      
      return workflow;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, workflowId: id }, 'Failed to update workflow');
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await Workflow.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundError('Workflow', id);
      }
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error, workflowId: id }, 'Failed to delete workflow');
      throw error;
    }
  }
}

