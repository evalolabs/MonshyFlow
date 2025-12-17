/**
 * Layout System - Main Export
 * 
 * This is the main entry point for the layout system.
 * Use this module to apply layouts to your workflow.
 */

import type { Node, Edge } from '@xyflow/react';
import type { LayoutStrategy, LayoutStrategyOptions, LayoutVersion, LayoutResult } from './types';
import { getLayout, getDefaultLayout, registerLayout, getAllLayouts, hasLayout } from './LayoutRegistry';
import { mergeLayoutWithLockedPositions } from '../layoutLock';

/**
 * Apply a layout to nodes and edges
 * 
 * @param nodes - Array of nodes to position
 * @param edges - Array of edges connecting nodes
 * @param version - Layout version to use (default: 'v1')
 * @param options - Optional configuration for the layout
 * @returns LayoutResult with positioned nodes and edges
 */
export function applyLayout(
  nodes: Node[],
  edges: Edge[],
  version: LayoutVersion = 'v1',
  options?: LayoutStrategyOptions
): LayoutResult {
  const layout = getLayout(version) || getDefaultLayout();
  const result = layout.apply(nodes, edges, options);
  return {
    ...result,
    nodes: mergeLayoutWithLockedPositions(nodes, result.nodes, edges),
  };
}

/**
 * Get information about all available layouts
 * 
 * @returns Array of layout metadata
 */
export function getAvailableLayouts() {
  return getAllLayouts().map(layout => ({
    id: layout.id,
    name: layout.name,
    description: layout.description,
  }));
}

// Re-export types and registry functions for advanced usage
export type { LayoutStrategy, LayoutStrategyOptions, LayoutResult, LayoutVersion };
export { getLayout, getDefaultLayout, registerLayout, getAllLayouts, hasLayout };

// Re-export individual layouts for direct access if needed
export { LayoutV1 } from './LayoutV1';
export { LayoutV2 } from './LayoutV2';

