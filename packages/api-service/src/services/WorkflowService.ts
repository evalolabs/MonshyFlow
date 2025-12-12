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

  async updateStartNode(workflowId: string, nodeId: string, config: any) {
    const workflow = await this.workflowRepo.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Convert Mongoose document to plain object if needed
    const workflowObj = workflow.toObject ? workflow.toObject() : workflow;

    // Find the start node
    const nodeIndex = workflowObj.nodes.findIndex((n: any) => n.id === nodeId && n.type === 'start');
    if (nodeIndex === -1) {
      throw new Error('Start node not found');
    }

    // Create updated nodes array with the updated node
    const updatedNodes = [...workflowObj.nodes];
    const node = updatedNodes[nodeIndex];
    
    // Merge existing node data with new config
    // Ensure node.data is always an object
    const existingData = node.data && typeof node.data === 'object' ? node.data : {};
    updatedNodes[nodeIndex] = {
      ...node,
      data: {
        ...existingData,
        ...config,
      },
    };

    // Update workflow
    return this.workflowRepo.update(workflowId, {
      nodes: updatedNodes,
    });
  }

  async updateNode(workflowId: string, nodeId: string, config: { type?: string; data?: any }) {
    const workflow = await this.workflowRepo.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Convert Mongoose document to plain object if needed
    const workflowObj = workflow.toObject ? workflow.toObject() : workflow;

    // Find the node
    const nodeIndex = workflowObj.nodes.findIndex((n: any) => n.id === nodeId);
    if (nodeIndex === -1) {
      throw new Error('Node not found');
    }

    // Create updated nodes array with the updated node
    const updatedNodes = [...workflowObj.nodes];
    const node = updatedNodes[nodeIndex];
    
    // Update node type if provided
    if (config.type !== undefined) {
      node.type = config.type;
    }
    
    // Update node data
    // If config.data is provided, use it (can be object or null)
    // Otherwise, merge with existing data
    if (config.data !== undefined) {
      node.data = config.data;
    } else {
      // If no data provided, keep existing data
      // Ensure node.data is always an object
      const existingData = node.data && typeof node.data === 'object' ? node.data : {};
      node.data = existingData;
    }

    updatedNodes[nodeIndex] = { ...node };

    // Update workflow
    return this.workflowRepo.update(workflowId, {
      nodes: updatedNodes,
    });
  }

  async publish(workflowId: string, description?: string) {
    const updateData: any = {
      isPublished: true,
      status: 'published',
      publishedAt: new Date(),
    };
    
    // Only update description if provided
    if (description !== undefined) {
      updateData.description = description;
    }
    
    return this.workflowRepo.update(workflowId, updateData);
  }

  async getPublished(tenantId?: string) {
    const workflows = tenantId 
      ? await this.workflowRepo.findByTenantId(tenantId)
      : await this.workflowRepo.findAll();
    return workflows.filter((w: any) => w.isPublished === true);
  }

  async deleteNode(workflowId: string, nodeId: string) {
    const workflow = await this.workflowRepo.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Convert Mongoose document to plain object if needed
    const workflowObj = workflow.toObject ? workflow.toObject() : workflow;

    // Find the node
    const nodeIndex = workflowObj.nodes.findIndex((n: any) => n.id === nodeId);
    if (nodeIndex === -1) {
      throw new Error('Node not found');
    }

    // Remove node from nodes array
    const updatedNodes = workflowObj.nodes.filter((n: any) => n.id !== nodeId);

    // Remove all edges connected to this node
    const updatedEdges = (workflowObj.edges || []).filter(
      (e: any) => e.source !== nodeId && e.target !== nodeId
    );

    // Update workflow
    return this.workflowRepo.update(workflowId, {
      nodes: updatedNodes,
      edges: updatedEdges,
    });
  }
}

