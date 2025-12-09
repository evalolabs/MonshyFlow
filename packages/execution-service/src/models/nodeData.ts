/**
 * Standardized data container for node input/output.
 * This ensures consistent data flow between nodes.
 */

export interface NodeData {
  /**
   * Main data payload (json is the only field)
   */
  json?: any;  // Primary field

  /**
   * Metadata about this data (always present)
   */
  metadata: NodeMetadata;

  /**
   * Optional schema information for validation
   */
  schema?: NodeSchema;

  /**
   * Optional error information
   */
  error?: NodeError;
}

export interface NodeMetadata {
  nodeId: string;
  nodeType: string;
  timestamp: string; // ISO 8601
  source: 'webhook' | 'schedule' | 'manual' | 'node' | 'merge' | 'start';
  previousNodeId?: string;
}

export interface NodeSchema {
  input?: string; // JSON Schema as string
  output?: string; // JSON Schema as string
}

export interface NodeError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Helper: Create NodeData from any object
 * Uses json as the only field
 */
export function createNodeData(
  data: any,
  nodeId: string,
  nodeType: string,
  previousNodeId?: string,
  source?: NodeMetadata['source']
): NodeData {
  return {
    json: data,  // Only field
    metadata: {
      nodeId,
      nodeType,
      timestamp: new Date().toISOString(),
      source: source || 'node',
      previousNodeId,
    },
  };
}

/**
 * Helper: Extract typed data from NodeData
 * Uses json field
 */
export function extractData<T>(nodeData: NodeData | null | undefined): T | null {
  if (!nodeData) return null;
  // Use json field
  const data = nodeData.json;
  if (data === undefined || data === null) return null;
  return data as T;
}

/**
 * Helper: Get main data field (json)
 * This is the primary way to access node data
 */
export function getNodeDataValue(nodeData: NodeData | null | undefined): any {
  if (!nodeData) return null;
  return nodeData.json ?? null;
}

/**
 * Helper: Create error NodeData
 */
export function createErrorNodeData(
  error: string,
  nodeId: string,
  nodeType: string,
  code?: string,
  details?: any
): NodeData {
  return {
    json: null,
    metadata: {
      nodeId,
      nodeType,
      timestamp: new Date().toISOString(),
      source: 'node',
    },
    error: {
      message: error,
      code,
      details,
    },
  };
}

