import { injectable, inject } from 'tsyringe';
import { WorkflowRepository } from '../repositories/WorkflowRepository';

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  nodes?: any[];
  edges?: any[];
  tenantId: string;
  userId: string;
}

@injectable()
export class WorkflowService {
  constructor(
    @inject('WorkflowRepository') private workflowRepo: WorkflowRepository
  ) {}

  async getAll(tenantId?: string) {
    if (tenantId) {
      return this.workflowRepo.findByTenantId(tenantId);
    }
    return this.workflowRepo.findAll();
  }

  async getById(id: string) {
    return this.workflowRepo.findById(id);
  }

  async create(data: CreateWorkflowDto) {
    if (!data.userId) {
      throw new Error('userId is required');
    }
    if (!data.tenantId) {
      throw new Error('tenantId is required');
    }
    return this.workflowRepo.create(data);
  }

  async update(id: string, data: Partial<CreateWorkflowDto>) {
    return this.workflowRepo.update(id, data);
  }

  async delete(id: string) {
    return this.workflowRepo.delete(id);
  }
}

