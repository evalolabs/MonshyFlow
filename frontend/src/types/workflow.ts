export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  label?: string;
  instructions?: string;
  model?: string;
  tools?: string[];
  
  // Agents SDK specific features
  useAgentsSDK?: boolean;
  enableStreaming?: boolean;
  continueOnError?: boolean;
  includeChatHistory?: boolean;
  outputFormat?: 'auto' | 'json' | 'text' | 'string';
  reasoningEffort?: 'low' | 'medium' | 'high';
  verbosity?: 'low' | 'medium' | 'high';
  summary?: 'auto' | 'manual' | 'detailed';
  userInputExamples?: string[];
  guardrails?: {
    input?: string;
    output?: string;
  };
  
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: Position;
  data: NodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id?: string;
  name: string;
  description?: string;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  userId: string;
  createdAt?: string;
  updatedAt?: string;
  isPublished?: boolean;
  publishedAt?: string;
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
  executionCount?: number;
  lastExecutedAt?: string;
  tenantId?: string;
  
  // Agents SDK Integration
  useAgentsSDK?: boolean;
  enableStreaming?: boolean;
  guardrails?: {
    input?: string;
    output?: string;
  };
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  userId: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

export interface ExecutionRequest {
  input: any;
}

export interface ExecutionResponse {
  executionId: string;
  status: string;
  output?: any;
}

export interface Execution {
  id?: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input: any;
  output?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  executionTrace: ExecutionStep[];
  steps?: ExecutionStep[]; // C# service returns 'steps' instead of 'executionTrace'
}

export interface ExecutionStep {
  nodeId: string;
  nodeType: string;
  nodeLabel?: string; // Node name/label for easier debugging
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: any;
  output?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  inputSchema?: any; // Dynamically generated input schema
  outputSchema?: any; // Dynamically generated output schema
  
  // Debug information
  debugInfo?: {
    inputSchema?: any;
    outputSchema?: any;
    inputPreview?: string;
    outputPreview?: string;
    dataType?: string;
    size?: number;
  };
  
  // Agents SDK specific trace data
  agentName?: string;
  toolCalls?: Array<{
    toolName: string;
    input: any;
    output: any;
    duration?: number;
  }>;
  handoffs?: Array<{
    fromAgent: string;
    toAgent: string;
    timestamp: string;
  }>;
}

