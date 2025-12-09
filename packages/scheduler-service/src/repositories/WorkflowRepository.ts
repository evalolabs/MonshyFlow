import { injectable } from 'tsyringe';
import { Workflow, IWorkflow } from '@monshy/database';
import { logger } from '@monshy/core';

@injectable()
export class WorkflowRepository {
  async findAll(): Promise<IWorkflow[]> {
    try {
      return await Workflow.find({}).exec();
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

  async update(id: string, data: Partial<IWorkflow>): Promise<IWorkflow> {
    try {
      const workflow = await Workflow.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec();
      
      if (!workflow) {
        throw new Error(`Workflow ${id} not found`);
      }
      
      return workflow;
    } catch (error) {
      logger.error({ err: error, workflowId: id }, 'Failed to update workflow');
      throw error;
    }
  }
}

