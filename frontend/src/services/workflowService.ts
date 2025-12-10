import { api, executionApi } from './api';
import type { Workflow, CreateWorkflowRequest, ExecutionRequest, ExecutionResponse, Execution } from '../types/workflow';
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
    const response = await api.post<ExecutionResponse>(`/api/execute/${workflowId}`, request);
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

  // Execution methods
  async startExecution(workflowId: string, input?: any): Promise<ExecutionResponse> {
    console.log('🚀 workflowService.startExecution called');
    console.log('workflowId:', workflowId);
    console.log('input:', input);
    
    try {
      // Use executionApi (now routes through Kong Gateway on Port 5000)
      const response = await executionApi.post(`/api/execute/${workflowId}`, {
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
    console.log('[workflowService.testNode] 🔵 Sending test request:', {
      workflowId,
      nodeId,
      input,
      inputKeys: input ? Object.keys(input) : [],
      inputString: JSON.stringify(input || {}).substring(0, 200)
    });
    const response = await api.post(`/api/workflows/${workflowId}/nodes/${nodeId}/test-with-context`, input || {});
    console.log('[workflowService.testNode] 🔵 Received response:', response.data);
    
    // DEBUG: Check if _debug exists in response
    console.log('[workflowService.testNode] 🔍 Checking for _debug:', {
      hasDebug: !!response.data._debug,
      responseKeys: Object.keys(response.data || {}),
      fullResponse: JSON.stringify(response.data, null, 2)
    });
    
    // DEBUG: Log debug info if available
    if (response.data._debug) {
      console.log('[workflowService.testNode] 🔍 DEBUG INFO:', JSON.stringify(response.data._debug, null, 2));
      console.log('[workflowService.testNode] 🔍 receivedBody:', response.data._debug.receivedBody);
      console.log('[workflowService.testNode] 🔍 bodyKeys:', response.data._debug.bodyKeys);
      console.log('[workflowService.testNode] 🔍 inputData:', response.data._debug.inputData);
      console.log('[workflowService.testNode] 🔍 inputKeys:', response.data._debug.inputKeys);
      console.log('[workflowService.testNode] 🔍 executionRequestBodyInput:', response.data._debug.executionRequestBodyInput);
      console.log('[workflowService.testNode] 🔍 executionRequestBodyInputKeys:', response.data._debug.executionRequestBodyInputKeys);
    } else {
      console.log('[workflowService.testNode] ⚠️ No _debug info in response!');
    }
    
    return response.data;
  },
};

