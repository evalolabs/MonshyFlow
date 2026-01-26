import { api } from './api';
import type { Workflow, CreateWorkflowRequest, ExecutionRequest, ExecutionResponse, Execution, PublicWorkflowPreview, WorkflowComment } from '../types/workflow';
import type { StartNodeUpdateRequest } from '../types/startNode';

export const workflowService = {
  // Get all workflows
  async getAllWorkflows(): Promise<Workflow[]> {
    const response = await api.get<{ success: boolean; data: Workflow[] }>('/api/workflows');
    // API gibt {success: true, data: [...]} zurück
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // Fallback für direkte Array-Response (falls API geändert wurde)
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  // Get workflow by ID
  async getWorkflowById(id: string): Promise<Workflow> {
    const response = await api.get<{ success: boolean; data: Workflow }>(`/api/workflows/${id}`);
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as unknown as Workflow;
    }
    throw new Error('Invalid response format');
  },

  // Create workflow
  async createWorkflow(workflow: CreateWorkflowRequest): Promise<Workflow> {
    const response = await api.post<{ success: boolean; data: Workflow }>('/api/workflows', {
      ...workflow,
      version: 1,
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
    });
    // API gibt {success: true, data: {...}} zurück
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback für direkte Object-Response
    if (response.data && !response.data.success) {
      return response.data as unknown as Workflow;
    }
    throw new Error('Invalid response format');
  },

  // Update workflow
  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<void> {
    // Ensure node.data is always an object, not a string
    // This is a critical fix to prevent backend InvalidCastException errors
    const sanitizedWorkflow = {
      ...workflow,
      nodes: workflow.nodes?.map(node => {
        let nodeData = node.data;
        
        if (typeof nodeData === 'string') {
          try {
            nodeData = JSON.parse(nodeData);
          } catch (e) {
            console.error(`[workflowService] Failed to parse node.data string for node ${node.id}:`, e);
            nodeData = {};
          }
        }
        
        // Ensure data is always an object, never null or undefined
        if (!nodeData || typeof nodeData !== 'object' || Array.isArray(nodeData)) {
          nodeData = {};
        }
        
        return {
          ...node,
          data: nodeData,
        };
      }),
    };
    
    try {
      await api.put(`/api/workflows/${id}`, sanitizedWorkflow);
    } catch (error: any) {
      // Enhanced error logging
      console.error('[workflowService] Failed to update workflow:', {
        workflowId: id,
        nodeCount: sanitizedWorkflow.nodes?.length,
        error: error.message,
        response: error.response?.data,
        firstNodeData: sanitizedWorkflow.nodes?.[0]?.data,
        firstNodeDataType: typeof sanitizedWorkflow.nodes?.[0]?.data,
      });
      throw error;
    }
  },

  // Delete workflow
  async deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/api/workflows/${id}`);
  },

  // Execute workflow
  async executeWorkflow(workflowId: string, request: ExecutionRequest): Promise<ExecutionResponse> {
    const response = await api.post<ExecutionResponse>(`/api/workflows/${workflowId}/execute`, request);
    return response.data;
  },

  // Get execution status
  async getExecutionStatus(executionId: string): Promise<any> {
    const response = await api.get(`/api/execute/${executionId}/status`);
    return response.data;
  },

  // Update start node configuration
  async updateStartNode(workflowId: string, nodeId: string, config: Omit<StartNodeUpdateRequest, 'workflowId' | 'nodeId'>): Promise<void> {
    await api.put('/api/workflows/start-node', {
      workflowId,
      nodeId,
      ...config
    });
  },

  // Update workflow activation status
  async updateWorkflowActivation(workflowId: string, isActive: boolean): Promise<void> {
    await api.put(`/api/workflows/${workflowId}`, {
      isActive
    });
  },

  // Update any node configuration
  async updateNode(workflowId: string, nodeId: string, config: {
    type: string;
    data: any;
  }): Promise<void> {
    await api.put('/api/workflows/node', {
      workflowId,
      nodeId,
      ...config
    });
  },

  // Delete node
  async deleteNode(workflowId: string, nodeId: string): Promise<void> {
    await api.delete(`/api/workflows/${workflowId}/nodes/${nodeId}`);
  },

  // Publish workflow
  async publishWorkflow(workflowId: string, description?: string): Promise<void> {
    await api.post('/api/workflows/publish', {
      workflowId,
      description
    });
  },

  // Get published workflows
  async getPublishedWorkflows(): Promise<Workflow[]> {
    const response = await api.get('/api/workflows/published');
    return response.data;
  },

  // Get all public workflows (for browsing)
  async getPublicWorkflows(): Promise<PublicWorkflowPreview[]> {
    const response = await api.get<{ success: boolean; data: PublicWorkflowPreview[] }>('/api/workflows/public');
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  // Get a single public workflow by ID (read-only)
  async getPublicWorkflowById(id: string): Promise<Workflow> {
    const response = await api.get<{ success: boolean; data: Workflow }>(`/api/workflows/public/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    if (response.data && !response.data.success) {
      return response.data as unknown as Workflow;
    }
    throw new Error('Invalid response format');
  },

  // Clone a public workflow
  async clonePublicWorkflow(workflowId: string, name?: string, description?: string): Promise<{ id: string; name: string; description?: string }> {
    const response = await api.post<{ success: boolean; data: { id: string; name: string; description?: string } }>(
      `/api/workflows/public/${workflowId}/clone`,
      { name, description }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to clone workflow');
  },

  // Toggle star on a public workflow
  async toggleStar(workflowId: string): Promise<{ starred: boolean; starCount: number }> {
    const response = await api.post<{ success: boolean; data: { starred: boolean; starCount: number } }>(
      `/api/workflows/public/${workflowId}/star`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to toggle star');
  },

  // Get comments for a public workflow
  async getComments(workflowId: string): Promise<WorkflowComment[]> {
    const response = await api.get<{ success: boolean; data: WorkflowComment[] }>(
      `/api/workflows/public/${workflowId}/comments`
    );
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  // Add a comment to a public workflow
  async addComment(workflowId: string, content: string, parentCommentId?: string): Promise<WorkflowComment> {
    const response = await api.post<{ success: boolean; data: WorkflowComment }>(
      `/api/workflows/public/${workflowId}/comments`,
      { content, parentCommentId }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to add comment');
  },

  // Delete a comment
  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/api/workflows/public/comments/${commentId}`);
  },

  // Execution methods
  async startExecution(workflowId: string, input?: any): Promise<ExecutionResponse> {
    console.log('🚀 workflowService.startExecution called');
    console.log('workflowId:', workflowId);
    console.log('input:', input);
    
    try {
      // Use new endpoint: /api/workflows/:id/execute (authenticated)
      const response = await api.post(`/api/workflows/${workflowId}/execute`, {
        input: input || {}
      });
      console.log('✅ startExecution response:', response.data);
      return {
        executionId: response.data.executionId || response.data.id,
        status: response.data.status,
        output: response.data.output
      };
    } catch (error) {
      console.error('❌ startExecution error:', error);
      throw error;
    }
  },

  async getExecution(executionId: string): Promise<Execution> {
    // Get execution status from C# AgentService (not Node.js execution-service)
    const response = await api.get(`/api/execution/${executionId}`);
    return response.data;
  },

  async getExecutionsByWorkflow(workflowId: string): Promise<Execution[]> {
    const response = await api.get(`/api/execution/workflow/${workflowId}`);
    return response.data;
  },

  async updateExecutionStatus(executionId: string, status: string): Promise<void> {
    await api.put(`/api/execution/${executionId}/status`, { status });
  },

  async completeExecution(executionId: string, output?: any, error?: string): Promise<void> {
    await api.post(`/api/execution/${executionId}/complete`, { output, error });
  },

  // Test workflow execution
  async testWorkflow(workflowId: string, input: any): Promise<{
    success: boolean;
    executionId: string;
    status: string;
    input: any;
    output?: any;
    error?: string;
    executionTrace?: any[];
    duration?: number;
  }> {
    const response = await api.post(`/api/test/${workflowId}/execute`, input);
    return response.data;
  },

  // Get workflow test info
  async getWorkflowTestInfo(workflowId: string): Promise<{
    workflowId: string;
    workflowName: string;
    startNode: any;
    nodeCount: number;
    edgeCount: number;
  }> {
    const response = await api.get(`/api/test/${workflowId}/info`);
    return response.data;
  },

  // Test a single node
  async testNode(workflowId: string, nodeId: string, input?: any): Promise<any> {
    const response = await api.post(`/api/workflows/${workflowId}/nodes/${nodeId}/test-with-context`, input || {});
    return response.data;
  },

  // Export workflow
  async exportWorkflow(workflowId: string): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>(`/api/workflows/${workflowId}/export`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to export workflow');
    }
    
    const exportData = response.data.data;
    
    // Create blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename from workflow name and date
    const workflowName = exportData.workflow?.name || 'workflow';
    const sanitizedName = workflowName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    const filename = `workflow-${sanitizedName}-${date}.json`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return exportData;
  },

  // Import workflow
  async importWorkflow(workflowData: any, name?: string, description?: string): Promise<Workflow> {
    const response = await api.post<{ success: boolean; data: Workflow; message?: string }>('/api/workflows/import', {
      workflow: workflowData,
      name,
      description,
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to import workflow');
  },
};

