export interface StartNodeConfig {
  label?: string;
  entryType?: 'webhook' | 'schedule' | 'manual';
  endpoint?: string;
  baseUrl?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description?: string;
  executionMode?: 'sync' | 'stream' | 'background';
  timeout?: number;
  webhookUrl?: string;
  inputSchema?: any; // JSON Schema for input validation
  scheduleConfig?: {
    cronExpression: string;
    timezone: string;
    enabled: boolean;
  };
}

export interface StartNodeProps {
  data: (StartNodeConfig & {
    isAnimating?: boolean;
    executionStatus?: 'idle' | 'running' | 'completed' | 'failed';
  }) | null;
}

export interface StartNodeUpdateRequest {
  workflowId: string;
  nodeId: string;
  label?: string;
  entryType?: 'webhook' | 'schedule' | 'manual';
  endpoint?: string;
  baseUrl?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description?: string;
  executionMode?: 'sync' | 'stream' | 'background';
  timeout?: number;
  webhookUrl?: string;
  inputSchema?: any; // JSON Schema for input validation
  scheduleConfig?: {
    cronExpression: string;
    timezone: string;
    enabled: boolean;
  };
}

export interface StartNodeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Default schema for simple prompt-based workflows
export const DEFAULT_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    userPrompt: {
      type: 'string',
      description: 'User message or prompt'
    }
  },
  required: ['userPrompt'],
  additionalProperties: false
};

export const DEFAULT_START_NODE_CONFIG: StartNodeConfig = {
  label: 'Start',
  entryType: 'webhook',
  method: 'POST',
  baseUrl: 'https://yourapp.com',
  endpoint: '/webhook/start',
  description: '',
  executionMode: 'sync',
  timeout: 120000,
  webhookUrl: '',
  inputSchema: DEFAULT_INPUT_SCHEMA
};

export const ENTRY_TYPE_LABELS = {
  webhook: 'Webhook Trigger',
  schedule: 'Scheduled',
  manual: 'Manual Start'
} as const;

export const EXECUTION_MODE_LABELS = {
  sync: '⚡ Synchronous (Wait for result)',
  stream: '🔄 Streaming (Real-time updates)',
  background: '🕐 Background (Queue & poll)'
} as const;

export const EXECUTION_MODE_DESCRIPTIONS = {
  sync: 'Blocking execution - returns result immediately (< 30s workflows)',
  stream: 'Server-Sent Events - real-time updates for long workflows',
  background: 'Fire-and-forget - queued for background processing'
} as const;
