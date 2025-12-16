/**
 * useAnimationScheduler Hook
 * 
 * Manages timing for animations (timeouts for fast nodes).
 * Separates timing logic from state management.
 */

import { useRef, useCallback } from 'react';
import type { Node } from '@xyflow/react';
import { getNodeMetadata } from '../../nodeRegistry/nodeMetadata';

const FAST_NODE_DEFAULTS = new Set(['start', 'end', 'transform']);
const SLOW_NODE_DEFAULTS = new Set(['agent', 'llm', 'http-request', 'email', 'tool']);

/**
 * Get animation speed for a node type
 */
function getNodeAnimationSpeed(nodeType?: string): 'fast' | 'slow' {
  if (!nodeType) return 'fast';

  const metadata = getNodeMetadata(nodeType);
  if (metadata?.animationSpeed) {
    return metadata.animationSpeed;
  }

  if (metadata?.category) {
    if (['ai', 'integration', 'tools'].includes(metadata.category)) {
      return 'slow';
    }
    if (['logic', 'core', 'utility', 'data'].includes(metadata.category)) {
      return 'fast';
    }
  }

  if (FAST_NODE_DEFAULTS.has(nodeType)) return 'fast';
  if (SLOW_NODE_DEFAULTS.has(nodeType)) return 'slow';

  return 'fast';
}

interface UseAnimationSchedulerProps {
  onTimeout: () => void;
}

export function useAnimationScheduler({ onTimeout }: UseAnimationSchedulerProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Check if a node is a fast node
   */
  const isFastNode = useCallback((nodeType: string): boolean => {
    return getNodeAnimationSpeed(nodeType) === 'fast';
  }, []);

  /**
   * Check if a node is a slow node
   */
  const isSlowNode = useCallback((nodeType: string): boolean => {
    return getNodeAnimationSpeed(nodeType) === 'slow';
  }, []);

  /**
   * Schedule animation timeout for a fast node
   */
  const scheduleTimeout = useCallback(
    (_node: Node, duration: number = 200) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Schedule new timeout
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        onTimeout();
      }, duration);
    },
    [onTimeout]
  );

  /**
   * Clear scheduled timeout
   */
  const clearScheduledTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Get animation duration for a node
   */
  const getAnimationDuration = useCallback((node: Node): number | null => {
    if (!node.type) return 1500; // Default

    if (isFastNode(node.type)) {
      return 200; // Fast nodes: 200ms
    }

    if (isSlowNode(node.type)) {
      return null; // Slow nodes: wait for SSE events
    }

    return 1500; // Default: 1500ms
  }, [isFastNode, isSlowNode]);

  return {
    isFastNode,
    isSlowNode,
    scheduleTimeout,
    clearScheduledTimeout,
    getAnimationDuration,
  };
}

