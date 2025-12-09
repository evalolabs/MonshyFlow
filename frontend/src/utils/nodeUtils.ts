/**
 * Node Utility Functions
 * 
 * Helper functions for node operations in the workflow builder.
 */

import type { Node } from '@xyflow/react';
import { NODE_TYPE_START, NODE_TYPE_END, NODE_TYPE_WHILE, RANDOM_POSITION_RANGE } from '../components/WorkflowBuilder/constants';

/**
 * Check if a node type can have multiple instances
 */
export function canHaveMultipleInstances(nodeType: string): boolean {
  return nodeType !== NODE_TYPE_START;
}

/**
 * Check if a node type can be duplicated
 */
export function canBeDuplicated(nodeType: string): boolean {
  return nodeType !== NODE_TYPE_START;
}

/**
 * Check if a node type needs output handles
 */
export function needsOutputHandles(nodeType: string): boolean {
  return nodeType !== NODE_TYPE_END;
}

/**
 * Check if a node is a While node
 */
export function isWhileNode(node: Node | undefined): boolean {
  return node?.type === NODE_TYPE_WHILE;
}

/**
 * Check if a node is a Start node
 */
export function isStartNode(node: Node | undefined): boolean {
  return node?.type === NODE_TYPE_START;
}

/**
 * Check if nodes array contains a Start node
 */
export function hasStartNode(nodes: Node[]): boolean {
  return nodes.some(node => node.type === NODE_TYPE_START);
}

/**
 * Generate a random position for a new node
 */
export function generateRandomPosition(): { x: number; y: number } {
  return {
    x: Math.random() * (RANDOM_POSITION_RANGE.x.max - RANDOM_POSITION_RANGE.x.min) + RANDOM_POSITION_RANGE.x.min,
    y: Math.random() * (RANDOM_POSITION_RANGE.y.max - RANDOM_POSITION_RANGE.y.min) + RANDOM_POSITION_RANGE.y.min,
  };
}

/**
 * Generate a unique node ID
 */
export function generateNodeId(type: string): string {
  return `${type}-${Date.now()}`;
}

/**
 * Create a new node with default properties
 */
export function createNode(type: string, position?: { x: number; y: number }, data?: any): Node {
  // Check if this is a tool node (starts with 'tool-')
  const isTool = type.startsWith('tool-');
  
  // For tool nodes, use 'tool' as the type and store the toolId in data
  const nodeType = isTool ? 'tool' : type;
  const nodeData = isTool 
    ? {
        toolId: type, // Store the full tool ID (e.g., 'tool-web-search')
        label: type.replace('tool-', '').split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        ...data,
      }
    : {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        ...data,
      };

  return {
    id: generateNodeId(nodeType),
    type: nodeType,
    position: position || generateRandomPosition(),
    data: nodeData,
  };
}

/**
 * Calculate position for a node relative to another node
 * Default direction is RIGHT (horizontal layout)
 */
export function calculateRelativePosition(
  sourceNode: Node,
  direction: 'right' | 'below' | 'left',
  spacing: number
): { x: number; y: number } {
  switch (direction) {
    case 'right':
      return {
        x: sourceNode.position.x + spacing,
        y: sourceNode.position.y,
      };
    case 'below':
      return {
        x: sourceNode.position.x,
        y: sourceNode.position.y + spacing,
      };
    case 'left':
      return {
        x: sourceNode.position.x - spacing,
        y: sourceNode.position.y,
      };
  }
}

/**
 * Calculate midpoint position between two nodes
 */
export function calculateMidpoint(sourceNode: Node, targetNode: Node): { x: number; y: number } {
  return {
    x: (sourceNode.position.x + targetNode.position.x) / 2 - 75,
    y: (sourceNode.position.y + targetNode.position.y) / 2 - 50,
  };
}

/**
 * Get the appropriate source handle for a node type
 */
export function getSourceHandle(nodeType: string | undefined): string | undefined {
  if (nodeType === NODE_TYPE_WHILE) {
    return 'loop-exit';
  }
  return undefined;
}

/**
 * Get the appropriate target handle for a node type
 */
export function getTargetHandle(nodeType: string | undefined): string | undefined {
  if (nodeType === NODE_TYPE_WHILE) {
    return 'input';
  }
  return undefined;
}

/**
 * Shift nodes vertically by a specified amount
 */
export function shiftNodesVertically(nodes: Node[], nodeIds: Set<string>, spacing: number): Node[] {
  return nodes.map(node => {
    if (nodeIds.has(node.id)) {
      return {
        ...node,
        position: {
          ...node.position,
          y: node.position.y + spacing,
        },
      };
    }
    return node;
  });
}

/**
 * Create a pre-configured HTTP Request node from an API endpoint
 */
export function createApiHttpRequestNode(
  apiId: string,
  endpointId: string,
  endpoint: any,
  apiIntegration: any,
  position?: { x: number; y: number }
): Node {
  // Build headers object
  const headers: Record<string, string> = {
    ...endpoint.headers,
  };

  // Add authentication (header or query parameter)
  if (apiIntegration.authentication) {
    const auth = apiIntegration.authentication;
    
    // Check if authentication should be in query parameter
    const useQueryAuth = auth.location === 'query' || auth.queryParamName;
    
    if (useQueryAuth) {
      // Query parameter authentication (e.g., Pipedrive: ?api_token=..., Hunter.io: ?api_key=...)
      // Will be added to URL below
    } else {
      // Header authentication (default)
      const headerValue = auth.headerFormat?.replace('{apiKey}', `{{secrets.${auth.secretKey}}}`)
        ?.replace('{accessToken}', `{{secrets.${auth.secretKey}}}`)
        ?.replace('{base64(email:apiToken)}', `{{secrets.${auth.secretKey}}}`)
        || `{{secrets.${auth.secretKey}}}`;
      headers[auth.headerName || 'Authorization'] = headerValue;
    }
  }

  // Build URL - replace placeholders with expression syntax
  let url = endpoint.urlTemplate || `${apiIntegration.baseUrl}${endpoint.path}`;
  // Replace {placeholder} with {{expression}} syntax for user input
  url = url.replace(/\{(\w+)\}/g, '{{$1}}');
  
  // Add query parameters from endpoint definition
  const queryParams: string[] = [];
  if (endpoint.queryParams) {
    for (const [key, value] of Object.entries(endpoint.queryParams)) {
      const paramValue = typeof value === 'string' ? value.replace(/\{(\w+)\}/g, '{{$1}}') : String(value);
      queryParams.push(`${key}=${paramValue}`);
    }
  }
  
  // Add query parameter authentication if needed
  // Support both new format (location: "query" + parameterName) and old format (queryParamName)
  if (apiIntegration.authentication) {
    const auth = apiIntegration.authentication;
    const useQueryAuth = auth.location === 'query' || auth.queryParamName;
    
    if (useQueryAuth) {
      // Determine parameter name: new format (parameterName) or old format (queryParamName)
      const paramName = auth.parameterName || auth.queryParamName || 'api_token';
      queryParams.push(`${paramName}={{secrets.${auth.secretKey}}}`);
      
      // Handle special cases like Pushover that also need user key as query parameter
      // Only add user key if authentication is via query parameter (not header)
      if (auth.usernameSecretKey && useQueryAuth) {
        const userParamName = auth.userParamName || 'user';
        queryParams.push(`${userParamName}={{secrets.${auth.usernameSecretKey}}}`);
      }
    }
  }
  
  // Append all query parameters to URL
  if (queryParams.length > 0) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}${queryParams.join('&')}`;
  }

  // Build body schema as a JSON string template
  let body = '';
  if (endpoint.bodySchema && (endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH')) {
    // Create a template body based on the schema
    const bodyTemplate: any = {};
    if (endpoint.bodySchema.properties) {
      Object.entries(endpoint.bodySchema.properties).forEach(([key, prop]: [string, any]) => {
        if (prop.default !== undefined) {
          bodyTemplate[key] = prop.default;
        } else if (prop.type === 'string') {
          bodyTemplate[key] = '';
        } else if (prop.type === 'number') {
          bodyTemplate[key] = 0;
        } else if (prop.type === 'array') {
          bodyTemplate[key] = [];
        } else if (prop.type === 'object') {
          bodyTemplate[key] = {};
        }
      });
    }
    body = JSON.stringify(bodyTemplate, null, 2);
  }

  return createNode('http-request', position, {
    label: `${apiIntegration.name}: ${endpoint.name}`,
    url,
    method: endpoint.method,
    sendInput: endpoint.method === 'GET' ? 'false' : 'true', // GET requests don't send body
    body: body || undefined,
    headers: JSON.stringify(headers, null, 2),
    // Store API metadata for reference
    apiId,
    endpointId,
    apiName: apiIntegration.name,
    endpointName: endpoint.name,
    // Store API color if defined (so HttpRequestNode can use it)
    apiColor: apiIntegration.color,
  });
}


