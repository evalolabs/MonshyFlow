import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const EXECUTION_API_URL = import.meta.env.VITE_EXECUTION_API_URL || 'http://localhost:5002';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Separate API client for execution service
export const executionApi = axios.create({
  baseURL: EXECUTION_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to sanitize workflow nodes (ensure data is always an object, not a string)
const sanitizeWorkflowNodes = (nodes: any[]): any[] => {
  if (!nodes || !Array.isArray(nodes)) return nodes;
  
  return nodes.map(node => {
    if (!node) return node;
    
    let nodeData = node.data;
    if (typeof nodeData === 'string') {
      try {
        nodeData = JSON.parse(nodeData);
        console.log(`[api.ts] Sanitized node ${node.id}: parsed string to object`);
      } catch (e) {
        console.error(`[api.ts] Failed to parse node.data string for node ${node.id}:`, e);
        nodeData = {};
      }
    }
    
    return {
      ...node,
      data: nodeData,
    };
  });
};

// Add request interceptor for debugging and authentication
const requestInterceptor = (config: any) => {
  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // CRITICAL: Sanitize workflow update requests to ensure node.data is always an object
  if (config.method === 'put' && config.url?.includes('/api/workflows/') && config.data) {
    if (config.data.nodes && Array.isArray(config.data.nodes)) {
      const beforeSanitization = config.data.nodes.map((n: any) => ({
        id: n.id,
        dataType: typeof n.data,
        isString: typeof n.data === 'string',
      }));
      
      config.data.nodes = sanitizeWorkflowNodes(config.data.nodes);
      
      const afterSanitization = config.data.nodes.map((n: any) => ({
        id: n.id,
        dataType: typeof n.data,
        isObject: typeof n.data === 'object' && !Array.isArray(n.data),
      }));
      
      // Only log if there were string data that needed sanitization
      const hadStringData = beforeSanitization.some((nodeInfo: { isString: boolean }) => nodeInfo.isString);
      if (hadStringData) {
        console.log('[api.ts] Sanitized workflow nodes (converted strings to objects):', {
          before: beforeSanitization,
          after: afterSanitization,
        });
      }
    }
  }
  
  // Only log in development mode
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG === 'true') {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
  }
  return config;
};

const errorInterceptor = (error: any) => {
  return Promise.reject(error);
};

const responseInterceptor = (response: any) => {
  return response;
};

const errorResponseInterceptor = (error: any) => {
  // Only log errors (keep these for debugging actual problems)
  if (import.meta.env.DEV) {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
  }
  
  // Handle 401 Unauthorized - redirect to login
  if (error.response?.status === 401) {
    // Clear auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    // Redirect to login if not already there
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
  }
  
  return Promise.reject(error);
};

// Apply interceptors to both API clients
api.interceptors.request.use(requestInterceptor, errorInterceptor);
api.interceptors.response.use(responseInterceptor, errorResponseInterceptor);

executionApi.interceptors.request.use(requestInterceptor, errorInterceptor);
executionApi.interceptors.response.use(responseInterceptor, errorResponseInterceptor);

