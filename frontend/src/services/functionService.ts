import { api } from './api';

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: any;
  metadata?: {
    requiredSecrets?: string[];
    docsUrl?: string;
    apiKeyUrl?: string;
    setupInstructions?: string;
  };
}

export const functionService = {
  async getAvailableFunctions(): Promise<FunctionDefinition[]> {
    try {
      console.log('[functionService] Fetching functions from /api/functions...');
      const response = await api.get<FunctionDefinition[]>('/api/functions', {
        params: {
          _t: Date.now(),
        },
      });
      console.log('[functionService] Response received:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not an array',
        data: response.data,
      });
      const { data } = response;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data) as FunctionDefinition[];
          console.log('[functionService] Parsed string response, length:', parsed.length);
          return parsed;
        } catch (error) {
          console.error('[functionService] Failed to parse string response from /api/functions', error);
          throw error;
        }
      }
      if (!Array.isArray(data)) {
        console.error('[functionService] Response is not an array:', data);
        return [];
      }
      console.log('[functionService] Returning functions array, length:', data.length);
      return data;
    } catch (error: any) {
      console.error('[functionService] Error fetching functions:', {
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


