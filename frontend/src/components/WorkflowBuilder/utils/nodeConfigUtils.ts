/**
 * Node Config Utility Functions
 * 
 * Helper functions for node configuration management.
 */

import type { Node } from '@xyflow/react';
import { getToolDefinition } from '../../../types/toolCatalog';

const GENERIC_TOOL_LABELS = ['agent', 'tool', 'ai agent'];

/**
 * Compute the effective node type, handling tool nodes specially.
 * Tool nodes may have their type stored in toolId or data.type.
 * Also handles nodes that already have the full tool type (tool-mcp-server, tool-function, etc.)
 * 
 * IMPORTANT: This function should prioritize selectedNode.data over config to ensure
 * it reacts immediately to node changes, not waiting for config state updates.
 */
export function computeEffectiveNodeType(selectedNode: Node | null, config?: any): string | undefined {
  if (!selectedNode) {
    return undefined;
  }

  // If node type already starts with 'tool-', use it directly
  if (selectedNode.type?.startsWith('tool-')) {
    return selectedNode.type;
  }

  // Handle legacy 'tool' type nodes that have toolId in data
  if (selectedNode.type === 'tool') {
    // PRIORITY: Always check selectedNode.data first (most up-to-date)
    const nodeData = (selectedNode.data ?? {}) as Record<string, any> | string;
    const toolId =
      (typeof nodeData === 'object' ? nodeData?.toolId : undefined) ||
      (typeof nodeData === 'object' ? nodeData?.type : undefined) ||
      (typeof nodeData === 'string' ? nodeData : undefined) ||
      // Fallback to config only if nodeData doesn't have it
      config?.toolId;

    if (typeof toolId === 'string' && toolId.trim()) {
      return toolId.trim();
    }
  }

  return selectedNode.type;
}

/**
 * Normalize tool label by removing generic labels and using tool definition name if available.
 */
export function normalizeToolLabel(currentLabel: any, toolId?: string): string | undefined {
  const fallback = toolId ? getToolDefinition(toolId)?.name : undefined;
  if (typeof currentLabel === 'string') {
    const trimmed = currentLabel.trim();
    if (trimmed && !GENERIC_TOOL_LABELS.includes(trimmed.toLowerCase())) {
      return trimmed;
    }
  }
  return fallback ?? (typeof currentLabel === 'string' ? currentLabel : undefined);
}

/**
 * Check if a node type is a web search node type.
 */
export function isWebSearchNodeType(type?: string): boolean {
  return type === 'tool-web-search';
}

