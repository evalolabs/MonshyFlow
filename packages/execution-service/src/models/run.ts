/**
 * Run Model - Professional Workflow Execution
 * 
 * Represents a single workflow execution (run) with full lifecycle management.
 */

export interface WorkflowRun {
    run_id: string;
    workflow_id: string;
    workflow_version: string;
    status: RunStatus;
    input: any;
    output?: any;
    error?: RunError;
    options: RunOptions;
    metadata?: Record<string, any>;
    webhook_url?: string;
    
    // Timestamps
    created_at: Date;
    started_at?: Date;
    completed_at?: Date;
    last_event_at?: Date;
    
    // Progress & Metrics
    progress?: number; // 0.0 - 1.0
    usage?: RunUsage;
    
    // Events for streaming
    events?: RunEvent[];
    
    // Idempotency
    idempotency_key?: string;
    request_id: string;
}

export type RunStatus = 
    | 'queued'      // Waiting to start
    | 'running'     // Currently executing
    | 'completed'   // Successfully finished
    | 'failed'      // Error occurred
    | 'cancelled'   // User cancelled
    | 'timeout';    // Execution timeout

export interface RunOptions {
    stream?: boolean;       // SSE streaming
    background?: boolean;   // Async execution
    store?: boolean;        // Persist run data
    timeout_ms?: number;    // Max execution time
}

export interface RunError {
    type: string;           // 'validation', 'timeout', 'execution', etc.
    message: string;
    code?: string;
    details?: any;
}

export interface RunUsage {
    nodes: number;          // Number of nodes executed
    latency_ms: number;     // Total execution time
    tokens?: number;        // LLM tokens (if applicable)
    api_calls?: number;     // External API calls
}

export interface RunEvent {
    type: RunEventType;
    timestamp: Date;
    payload: any;
}

export type RunEventType =
    | 'run.created'
    | 'run.started'
    | 'run.completed'
    | 'run.failed'
    | 'run.cancelled'
    | 'node.start'
    | 'node.end'
    | 'message.delta'
    | 'tool.call'
    | 'tool.result'
    | 'progress';

/**
 * Request Body for POST /v1/workflows/:id/runs
 */
export interface CreateRunRequest {
    input: any;
    options?: Partial<RunOptions>;
    webhook_url?: string;
    metadata?: Record<string, any>;
    workflow_version?: string;
}

/**
 * Response for Sync Mode
 */
export interface RunResponse {
    run_id: string;
    workflow_id: string;
    workflow_version: string;
    status: RunStatus;
    output?: any;
    error?: RunError;
    usage?: RunUsage;
    created_at: string;
    completed_at?: string;
    request_id: string;
}

/**
 * Response for Background Mode
 */
export interface BackgroundRunResponse {
    run_id: string;
    workflow_id: string;
    workflow_version: string;
    status: 'queued';
    background: true;
    request_id: string;
    poll_url: string;
}

/**
 * Workflow Version with Schemas
 */
export interface WorkflowVersion {
    workflow_id: string;
    version: string;
    input_schema: any;      // JSON Schema
    output_schema: any;     // JSON Schema
    graph: any;             // Workflow nodes & edges
    created_at: Date;
    is_live: boolean;
}

