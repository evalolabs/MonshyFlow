import { api } from './api';

export interface McpHandlerSummary {
  id: string;
  name: string;
  description: string;
  defaultConfig: Record<string, any>;
  metadata: {
    requiredSecrets?: string[];
    docsUrl?: string;
    apiKeyUrl?: string;
    setupInstructions?: string;
  };
}

export const mcpService = {
  async getAvailableHandlers(): Promise<McpHandlerSummary[]> {
    try {
      console.log('[mcpService] Fetching MCP handlers from /api/execution/mcp-handlers...');
      const response = await api.get<McpHandlerSummary[]>('/api/execution/mcp-handlers', {
        params: {
          // Bust cache
          _t: Date.now(),
        },
      });
      console.log('[mcpService] Response received:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not an array',
        data: response.data,
      });
      if (!Array.isArray(response.data)) {
        console.error('[mcpService] Response is not an array:', response.data);
        return [];
      }
      console.log('[mcpService] Returning MCP handlers array, length:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('[mcpService] Error fetching MCP handlers:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        fullError: error,
      });
      throw error;
    }
  }
};

