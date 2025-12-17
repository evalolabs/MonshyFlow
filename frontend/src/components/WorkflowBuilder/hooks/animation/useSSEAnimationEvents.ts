/**
 * useSSEAnimationEvents Hook
 * 
 * Handles SSE events and converts them to state machine events.
 * Abstracts SSE connection details from the animation logic.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { SSEConnection } from '../../../../services/sseService';
import type { Node } from '@xyflow/react';
import {
  SSEAnimationEventBus,
  type IAnimationEventBus,
} from './animationEventBus';
import type { AnimationEventType } from './animationStateMachine';

interface UseSSEAnimationEventsProps {
  sseConnection: SSEConnection | null;
  executionOrder: Node[];
  testingNodeId: string | null;
  onEvent: (event: AnimationEventType, payload?: any) => void;
}

export function useSSEAnimationEvents({
  sseConnection,
  executionOrder,
  testingNodeId,
  onEvent,
}: UseSSEAnimationEventsProps) {
  const eventBusRef = useRef<IAnimationEventBus | null>(null);

  // Initialize event bus
  useEffect(() => {
    if (sseConnection) {
      eventBusRef.current = new SSEAnimationEventBus(sseConnection);
    } else {
      eventBusRef.current = null;
    }

    return () => {
      if (eventBusRef.current) {
        eventBusRef.current.disconnect();
      }
    };
  }, [sseConnection]);

  // Register event handlers
  useEffect(() => {
    const eventBus = eventBusRef.current;
    if (!eventBus) return;

    // Handle node.start events
    const handleNodeStart = (payload: any) => {
      const { nodeId } = payload;

      // Check if event is relevant for current test
      if (testingNodeId) {
        const nodeIndex = executionOrder.findIndex(n => n.id === nodeId);
        const testNodeIndex = executionOrder.findIndex(n => n.id === testingNodeId);
        if (nodeIndex === -1 || nodeIndex > testNodeIndex) {
          return; // Event not relevant
        }
      }

      onEvent('node_start_received', { nodeId });
    };

    // Handle node.end events
    const handleNodeEnd = (payload: any) => {
      const { nodeId } = payload;

      // Check if event is relevant for current test
      if (testingNodeId) {
        const nodeIndex = executionOrder.findIndex(n => n.id === nodeId);
        const testNodeIndex = executionOrder.findIndex(n => n.id === testingNodeId);
        if (nodeIndex === -1 || nodeIndex > testNodeIndex) {
          return; // Event not relevant
        }
      }

      onEvent('node_end_received', { nodeId });
    };

    eventBus.on('node_start_received', handleNodeStart);
    eventBus.on('node_end_received', handleNodeEnd);

    return () => {
      if (eventBus) {
        eventBus.off('node_start_received', handleNodeStart);
        eventBus.off('node_end_received', handleNodeEnd);
      }
    };
  }, [eventBusRef.current, executionOrder, testingNodeId, onEvent]);

  /**
   * Check if event bus has buffered events for a node
   */
  const hasBufferedEvents = useCallback(
    (nodeId: string): boolean => {
      const eventBus = eventBusRef.current;
      if (!eventBus || !(eventBus instanceof SSEAnimationEventBus)) {
        return false;
      }
      return eventBus.hasBufferedEvents(nodeId);
    },
    []
  );

  /**
   * Get buffered events for a node
   */
  const getBufferedEvents = useCallback(
    (nodeId: string) => {
      const eventBus = eventBusRef.current;
      if (!eventBus || !(eventBus instanceof SSEAnimationEventBus)) {
        return [];
      }
      return eventBus.getBufferedEvents(nodeId);
    },
    []
  );

  return {
    hasBufferedEvents,
    getBufferedEvents,
    isConnected: eventBusRef.current?.isConnected() || false,
  };
}












