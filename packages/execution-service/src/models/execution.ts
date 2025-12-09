export interface ToolCall {
    toolName: string;
    input: any;
    output: any;
}

export interface TraceEntry {
    nodeId: any;
    type: any;
    input: any;
    output: any;
    timestamp: Date;
    duration: number;
    inputSchema?: any;
    outputSchema?: any;
    error?: string;
    toolCalls?: ToolCall[];
    response?: any;
    agentName?: string;
}

export interface Execution {
    id?: string;
    workflowId: string;
    status: 'running' | 'completed' | 'failed';
    input: any;
    output?: any;
    error?: string;
    trace: TraceEntry[];
    startedAt: Date;
    completedAt?: Date;
}

export interface ExecutionRequest {
    input: any;
}

export interface ExecutionResponse {
    executionId: string;
    status: string;
    output?: any;
}

