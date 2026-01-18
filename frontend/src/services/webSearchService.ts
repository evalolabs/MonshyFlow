import { api } from './api';

export interface WebSearchHandlerSummary {
  id: string;
  name: string;
  description: string;
  defaultConfig: Record<string, any>;
  metadata: {
    requiredSecrets?: string[];
    docsUrl?: string;
    supportsAuto?: boolean;
    apiKeyUrl?: string;
    setupInstructions?: string;
  };
}

export const webSearchService = {
  async getAvailableHandlers(): Promise<WebSearchHandlerSummary[]> {
    try {
      console.log('[webSearchService] Fetching web search handlers from /api/web-search-handlers...');
      const response = await api.get<WebSearchHandlerSummary[]>('/api/web-search-handlers', {
        params: {
          _t: Date.now(),
        },
      });
      console.log('[webSearchService] Response received:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not an array',
        data: response.data,
      });
      if (!Array.isArray(response.data)) {
        console.error('[webSearchService] Response is not an array:', response.data);
        return [];
      }
      console.log('[webSearchService] Returning web search handlers array, length:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('[webSearchService] Error fetching web search handlers:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        fullError: error,
      });
      throw error;
    }
  },
};
