import { injectable, inject } from 'tsyringe';
import { WorkflowRepository } from '../repositories/WorkflowRepository';
import { logger } from '@monshy/core';
import { User, WorkflowComment } from '@monshy/database';
import mongoose from 'mongoose';

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

    // Log debugging information
    logger.info({
      workflowId,
      nodeId,
      nodeCount: workflowObj.nodes?.length || 0,
      nodeIds: workflowObj.nodes?.map((n: any) => n.id) || [],
      searchingFor: nodeId,
    }, 'Attempting to update node');

    // Ensure nodes array exists
    if (!workflowObj.nodes || !Array.isArray(workflowObj.nodes)) {
      logger.error({ workflowId, nodeId }, 'Workflow has no nodes array');
      throw new Error('Workflow has no nodes');
    }

    // Find the node - try multiple ID field variations
    let nodeIndex = workflowObj.nodes.findIndex((n: any) => n.id === nodeId);
    
    // Fallback: try _id if id doesn't match (Mongoose might add _id)
    if (nodeIndex === -1) {
      nodeIndex = workflowObj.nodes.findIndex((n: any) => 
        (n._id && n._id.toString() === nodeId) || 
        (n._id && String(n._id) === nodeId)
      );
    }
    
    // Fallback: try case-insensitive match
    if (nodeIndex === -1) {
      nodeIndex = workflowObj.nodes.findIndex((n: any) => 
        n.id && String(n.id).toLowerCase() === String(nodeId).toLowerCase()
      );
    }
    
    if (nodeIndex === -1) {
      logger.error({
        workflowId,
        nodeId,
        nodeIdType: typeof nodeId,
        availableNodeIds: workflowObj.nodes.map((n: any) => ({
          id: n.id,
          idType: typeof n.id,
          _id: n._id,
          type: n.type,
        })),
        nodeCount: workflowObj.nodes.length,
      }, 'Node not found in workflow');
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

  /**
   * Get all public workflows (for browsing)
   * Returns only metadata, not full workflow data
   */
  async getPublicWorkflows(tenantId?: string) {
    // For now, return all public workflows (tenant-agnostic)
    // In the future, we might want to filter by tenant or make it configurable
    const workflows = await this.workflowRepo.findAll();
    const publicWorkflows = workflows.filter((w: any) => w.isPublished === true);
    
    // Get user information for all workflows
    // Filter out invalid ObjectIds to prevent MongoDB errors
    const userIds = [...new Set(publicWorkflows.map((w: any) => {
      const obj = w.toObject ? w.toObject() : w;
      return obj.userId;
    }).filter((id: any) => {
      // Only include valid MongoDB ObjectIds
      if (!id) return false;
      const idStr = id.toString();
      return mongoose.Types.ObjectId.isValid(idStr);
    }))];
    
    // Only query users if we have valid ObjectIds
    let users: any[] = [];
    let userMap = new Map();
    
    if (userIds.length > 0) {
      try {
        users = await User.find({ _id: { $in: userIds } }).exec();
        userMap = new Map(users.map((u: any) => [u._id.toString(), u]));
      } catch (err) {
        logger.warn({ err, userIds }, 'Failed to fetch user information for public workflows');
        // Continue without user info rather than failing completely
      }
    }
    
    return publicWorkflows.map((w: any) => {
      const workflowObj = w.toObject ? w.toObject() : w;
      const userId = workflowObj.userId?.toString();
      const user = userId ? userMap.get(userId) : null;
      
      return {
        id: workflowObj._id || workflowObj.id,
        name: workflowObj.name,
        description: workflowObj.description,
        tags: workflowObj.tags || [],
        userId: workflowObj.userId,
        authorName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown',
        authorEmail: user?.email || 'unknown@example.com',
        tenantId: workflowObj.tenantId,
        createdAt: workflowObj.createdAt,
        updatedAt: workflowObj.updatedAt,
        publishedAt: workflowObj.publishedAt,
        cloneCount: workflowObj.cloneCount || 0,
        starCount: workflowObj.starCount || 0,
        nodeCount: workflowObj.nodes?.length || 0,
        edgeCount: workflowObj.edges?.length || 0,
      };
    });
  }

  /**
   * Get a single public workflow by ID (read-only)
   */
  async getPublicWorkflowById(workflowId: string) {
    const workflow = await this.workflowRepo.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const workflowObj = workflow.toObject ? workflow.toObject() : workflow;
    
    if (!workflowObj.isPublished) {
      throw new Error('Workflow is not published');
    }

    // Get author information
    let authorName = 'Unknown';
    let authorEmail = 'unknown@example.com';
    try {
      const user = await User.findById(workflowObj.userId).exec();
      if (user) {
        authorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
        authorEmail = user.email || 'unknown@example.com';
      }
    } catch (err) {
      logger.warn({ err, userId: workflowObj.userId }, 'Failed to fetch author info');
    }

    // Return full workflow data but exclude sensitive information
    return {
      id: workflowObj._id || workflowObj.id,
      name: workflowObj.name,
      description: workflowObj.description,
      version: workflowObj.version,
      nodes: workflowObj.nodes || [],
      edges: workflowObj.edges || [],
      tags: workflowObj.tags || [],
      useAgentsSDK: workflowObj.useAgentsSDK || false,
      enableStreaming: workflowObj.enableStreaming || false,
      guardrails: workflowObj.guardrails,
      scheduleConfig: workflowObj.scheduleConfig,
      userId: workflowObj.userId,
      tenantId: workflowObj.tenantId,
      createdAt: workflowObj.createdAt,
      updatedAt: workflowObj.updatedAt,
      publishedAt: workflowObj.publishedAt,
      cloneCount: workflowObj.cloneCount || 0,
      starCount: workflowObj.starCount || 0,
      starredBy: workflowObj.starredBy || [],
      // Author info
      authorName,
      authorEmail,
      // Exclude: variables (user-specific), secrets (never exposed)
      // Exclude: executionCount, lastExecutedAt (private stats)
    };
  }

  /**
   * Star/unstar a public workflow
   */
  async toggleStar(workflowId: string, userId: string): Promise<{ starred: boolean; starCount: number }> {
    const workflow = await this.workflowRepo.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const workflowObj = workflow.toObject ? workflow.toObject() : workflow;
    
    if (!workflowObj.isPublished) {
      throw new Error('Workflow is not published');
    }

    const starredBy = workflowObj.starredBy || [];
    const isStarred = starredBy.includes(userId);
    
    let newStarredBy: string[];
    if (isStarred) {
      // Unstar
      newStarredBy = starredBy.filter((id: string) => id !== userId);
    } else {
      // Star
      newStarredBy = [...starredBy, userId];
    }

    await this.workflowRepo.update(workflowId, {
      starredBy: newStarredBy,
      starCount: newStarredBy.length,
    });

    return {
      starred: !isStarred,
      starCount: newStarredBy.length,
    };
  }

  /**
   * Get comments for a public workflow
   */
  async getComments(workflowId: string) {
    const comments = await WorkflowComment.find({ workflowId })
      .sort({ createdAt: -1 })
      .exec();
    
    return comments.map((c: any) => {
      const commentObj = c.toObject ? c.toObject() : c;
      return {
        id: commentObj._id || commentObj.id,
        workflowId: commentObj.workflowId,
        userId: commentObj.userId,
        userName: commentObj.userName || 'Unknown',
        userEmail: commentObj.userEmail || 'unknown@example.com',
        content: commentObj.content,
        createdAt: commentObj.createdAt,
        updatedAt: commentObj.updatedAt,
        parentCommentId: commentObj.parentCommentId,
      };
    });
  }

  /**
   * Add a comment to a public workflow
   */
  async addComment(workflowId: string, userId: string, userName: string, userEmail: string, content: string, parentCommentId?: string) {
    // Verify workflow exists and is published
    const workflow = await this.workflowRepo.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const workflowObj = workflow.toObject ? workflow.toObject() : workflow;
    if (!workflowObj.isPublished) {
      throw new Error('Workflow is not published');
    }

    const comment = new WorkflowComment({
      workflowId,
      userId,
      userName,
      userEmail,
      content,
      parentCommentId,
    });

    return await comment.save();
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string) {
    const comment = await WorkflowComment.findById(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const commentObj = comment.toObject ? comment.toObject() : comment;
    
    // Only allow user to delete their own comments
    if (commentObj.userId !== userId) {
      throw new Error('You can only delete your own comments');
    }

    await WorkflowComment.findByIdAndDelete(commentId);
  }

  /**
   * Clone a public workflow
   */
  async clonePublicWorkflow(workflowId: string, userId: string, tenantId: string, name?: string, description?: string) {
    // Get the public workflow
    const originalWorkflow = await this.workflowRepo.findById(workflowId);
    if (!originalWorkflow) {
      throw new Error('Workflow not found');
    }

    const originalWorkflowObj = originalWorkflow.toObject ? originalWorkflow.toObject() : originalWorkflow;
    
    if (!originalWorkflowObj.isPublished) {
      throw new Error('Workflow is not published');
    }

    // Create cloned workflow
    const clonedWorkflowData: any = {
      name: name || `${originalWorkflowObj.name} (Clone)`,
      description: description || originalWorkflowObj.description || '',
      version: 1,
      nodes: JSON.parse(JSON.stringify(originalWorkflowObj.nodes || [])), // Deep clone
      edges: JSON.parse(JSON.stringify(originalWorkflowObj.edges || [])), // Deep clone
      tags: [...(originalWorkflowObj.tags || [])],
      useAgentsSDK: originalWorkflowObj.useAgentsSDK || false,
      enableStreaming: originalWorkflowObj.enableStreaming || false,
      guardrails: originalWorkflowObj.guardrails ? JSON.parse(JSON.stringify(originalWorkflowObj.guardrails)) : undefined,
      scheduleConfig: originalWorkflowObj.scheduleConfig ? JSON.parse(JSON.stringify(originalWorkflowObj.scheduleConfig)) : undefined,
      userId: userId,
      tenantId: tenantId,
      isPublished: false, // Cloned workflows are always drafts
      status: 'draft',
      isActive: true,
      executionCount: 0,
      variables: {}, // Start with empty variables (user needs to configure)
      clonedFrom: workflowId, // Reference to original
      originalAuthorId: originalWorkflowObj.userId, // Store original author
    };

    // Create the cloned workflow
    const clonedWorkflow = await this.workflowRepo.create(clonedWorkflowData);

    // Increment clone count on original workflow
    const currentCloneCount = originalWorkflowObj.cloneCount || 0;
    await this.workflowRepo.update(workflowId, {
      cloneCount: currentCloneCount + 1,
    });

    return clonedWorkflow;
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

