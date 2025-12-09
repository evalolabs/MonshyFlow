/**
 * useAutoLayout Hook
 * 
 * Handles automatic layout of nodes when new nodes are added.
 * Can be toggled on/off and manually triggered.
 * Supports multiple layout versions through the extensible layout system.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { applyLayout, type LayoutVersion } from '../../../utils/layouts';
import { layoutLogger as logger } from '../../../utils/logger';

interface UseAutoLayoutProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  initialEnabled?: boolean;
  layoutVersion?: LayoutVersion; // Layout version to use (default: 'v1')
}

export function useAutoLayout({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  initialEnabled = true,
  layoutVersion = 'v1',
}: UseAutoLayoutProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const previousNodeCountRef = useRef(nodes.length);

  // Apply layout manually
  const applyLayoutCallback = useCallback(() => {
    logger.info(`Applying manual layout (version: ${layoutVersion})`);
    try {
      const layouted = applyLayout(nodes, edges, layoutVersion);
      onNodesChange(layouted.nodes);
      onEdgesChange(layouted.edges);
      logger.info(`Manual layout (${layoutVersion}) applied successfully`);
    } catch (error) {
      logger.error('Manual layout failed', error);
    }
  }, [nodes, edges, layoutVersion, onNodesChange, onEdgesChange]);

  // Toggle auto-layout on/off
  const toggleEnabled = useCallback(() => {
    setEnabled(prev => {
      logger.info(`Auto-layout ${!prev ? 'enabled' : 'disabled'}`);
      return !prev;
    });
  }, []);

  // Auto-apply layout when nodes are added
  useEffect(() => {
    const currentNodeCount = nodes.length;
    const previousNodeCount = previousNodeCountRef.current;

    if (enabled && currentNodeCount > previousNodeCount && nodes.length > 0) {
      logger.debug(`Node added (${previousNodeCount} → ${currentNodeCount}) - applying auto-layout (${layoutVersion})`);
      
      previousNodeCountRef.current = currentNodeCount;

      try {
        const layouted = applyLayout(nodes, edges, layoutVersion);
        onNodesChange(layouted.nodes);
        onEdgesChange(layouted.edges);
        logger.info(`Auto-layout (${layoutVersion}) applied successfully`);
      } catch (error) {
        logger.error('Auto-layout failed', error);
      }
    } else if (currentNodeCount !== previousNodeCount) {
      // Just update the ref
      logger.debug(`Node count changed (${previousNodeCount} → ${currentNodeCount})`);
      previousNodeCountRef.current = currentNodeCount;
    }
  }, [nodes, edges, enabled, layoutVersion, onNodesChange, onEdgesChange]);

  return {
    enabled,
    setEnabled,
    toggleEnabled,
    applyLayout: applyLayoutCallback,
  };
}


