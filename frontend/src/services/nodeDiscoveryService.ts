/**
 * Node Discovery Service
 * 
 * Automatically discovers and registers node types from the backend execution service.
 * This eliminates the need for manual frontend registration.
 */

import { api } from './api';
import type { NodeMetadata, NodeCategoryId } from '../components/WorkflowBuilder/nodeRegistry/nodeMetadata';

export interface DiscoveredNode {
  type: string;
  name: string;
  description: string;
  inputSchema?: any;
  outputSchema?: any;
  defaultConfig?: Record<string, any>;
}

export interface NodeDiscoveryResponse {
  nodes: DiscoveredNode[];
  count: number;
}

/**
 * Discover all node types from the backend
 */
export async function discoverNodes(): Promise<DiscoveredNode[]> {
  try {
    // Use main API (Kong Gateway) instead of direct execution service
    const response = await api.get<NodeDiscoveryResponse>('/api/schemas/nodes');
    // Response format: {nodes: [...], count: ...}
    if (response.data.nodes && Array.isArray(response.data.nodes)) {
      return response.data.nodes;
    }
    // Fallback: if response is direct array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error: any) {
    console.error('[NodeDiscoveryService] Failed to discover nodes:', error);
    return [];
  }
}

/**
 * Convert discovered node to frontend metadata format
 */
export function convertToNodeMetadata(
  discoveredNode: DiscoveredNode,
  category: NodeCategoryId = 'utility'
): Partial<NodeMetadata> {
  return {
    id: discoveredNode.type,
    name: discoveredNode.name,
    description: discoveredNode.description,
    category,
    component: () => null, // Will be set by nodeRegistry
    hasConfigForm: true,
    useAutoConfigForm: true, // Auto-generate config form from schema
    inputSchema: discoveredNode.inputSchema,
    outputSchema: discoveredNode.outputSchema,
  };
}

/**
 * Auto-categorize node based on type
 */
export function categorizeNode(node: DiscoveredNode): NodeCategoryId {
  const type = node.type.toLowerCase();
  
  // Core nodes
  if (type === 'start' || type === 'end') {
    return 'core';
  }
  
  // AI nodes
  if (type.includes('agent') || type.includes('llm') || type.includes('gpt') || type.includes('openai')) {
    return 'ai';
  }
  
  // Logic nodes
  if (type.includes('if') || type.includes('else') || type.includes('loop')) {
    return 'logic';
  }
  
  // Integration nodes
  if (type.includes('http') || type.includes('api') || type.includes('webhook') || type.includes('email')) {
    return 'integration';
  }
  
  // Data nodes
  if (type.includes('transform') || type.includes('data') || type.includes('json')) {
    return 'data';
  }
  
  // Tool nodes
  if (type.startsWith('tool-')) {
    return 'tools';
  }
  
  // Default to utility
  return 'utility';
}

