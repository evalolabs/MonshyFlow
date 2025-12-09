/**
 * Layout System Types
 * 
 * Defines the interface and types for the extensible layout system.
 * This allows us to easily add new layout strategies in the future.
 */

import type { Node, Edge } from '@xyflow/react';

/**
 * Layout result containing positioned nodes and edges
 */
export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Layout options that can be passed to layout strategies
 */
export interface LayoutStrategyOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  spacing?: {
    horizontal?: number;
    vertical?: number;
  };
  [key: string]: any; // Allow additional options for future layouts
}

/**
 * Layout Strategy Interface
 * 
 * All layout implementations must conform to this interface.
 * This allows us to easily swap and extend layouts.
 */
export interface LayoutStrategy {
  /**
   * Unique identifier for this layout strategy
   */
  id: string;
  
  /**
   * Human-readable name for this layout
   */
  name: string;
  
  /**
   * Description of what this layout does
   */
  description: string;
  
  /**
   * Apply the layout algorithm to nodes and edges
   * 
   * @param nodes - Array of nodes to position
   * @param edges - Array of edges connecting nodes
   * @param options - Optional configuration for the layout
   * @returns LayoutResult with positioned nodes and edges
   */
  apply(nodes: Node[], edges: Edge[], options?: LayoutStrategyOptions): LayoutResult;
}

/**
 * Layout version identifier
 * Used to select which layout strategy to use
 */
export type LayoutVersion = 'v1' | 'v2' | 'v3' | string;

