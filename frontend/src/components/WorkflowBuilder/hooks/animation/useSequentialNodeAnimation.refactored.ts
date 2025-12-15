/**
 * useSequentialNodeAnimation Hook (Refactored)
 * 
 * Facade hook that combines:
 * - useAnimationStateMachine: State management
 * - useSSEAnimationEvents: Event handling
 * - useAnimationScheduler: Timing logic
 * 
 * This hook maintains backward compatibility with the original API
 * while using the new architecture internally.
 */

import { useEffect, useCallback, useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { ExecutionStep } from '../../../../types/workflow';
import type { SSEConnection } from '../../../../services/sseService';
import { buildNodeOrderForDebugPanel } from '../../WorkflowCanvas';
import { useAnimationStateMachine } from './useAnimationStateMachine';
import { useSSEAnimationEvents } from './useSSEAnimationEvents';
import { useAnimationScheduler } from './useAnimationScheduler';
import type { AnimationEventType } from './animationStateMachine';

interface UseSequentialNodeAnimationProps {
  nodes: Node[];
  edges: Edge[];
  executionSteps: ExecutionStep[];
  sseConnection: SSEConnection | null;
  isExecuting: boolean;
  testingNodeId?: string | null;
}

export function useSequentialNodeAnimation({
  nodes,
  edges,
  executionSteps: _executionSteps, // Reserved for future use
  sseConnection,
  isExecuting,
  testingNodeId = null,
}: UseSequentialNodeAnimationProps) {
  // Calculate execution order
  const executionOrder = useMemo(() => {
    if (nodes.length === 0) return [];

    if (testingNodeId) {
      // Node test - calculate path from Start to tested node
      const fullOrder = edges.length > 0
        ? buildNodeOrderForDebugPanel(nodes, edges)
        : nodes;
      const testNodeIndex = fullOrder.findIndex(n => n.id === testingNodeId);
      if (testNodeIndex >= 0) {
        return fullOrder.slice(0, testNodeIndex + 1);
      }
      return [];
    }

    // Full workflow execution
    return edges.length > 0
      ? buildNodeOrderForDebugPanel(nodes, edges)
      : nodes;
  }, [nodes, edges, testingNodeId]);

  // State machine for animation state
  const {
    state,
    dispatch,
    getCurrentAnimatedNodeId,
    isNodeAnimating,
    getContext,
  } = useAnimationStateMachine({
    executionOrder,
    testingNodeId,
    isExecuting,
  });

  // Handle state machine events
  const handleStateMachineEvent = useCallback(
    (event: AnimationEventType, payload?: any) => {
      dispatch(event, payload);
    },
    [dispatch]
  );

  // SSE event handling
  const { hasBufferedEvents, getBufferedEvents } = useSSEAnimationEvents({
    sseConnection,
    executionOrder,
    testingNodeId,
    onEvent: handleStateMachineEvent,
  });

  // Animation scheduler
  const {
    isFastNode,
    isSlowNode,
    scheduleTimeout,
    clearScheduledTimeout,
    getAnimationDuration,
  } = useAnimationScheduler({
    onTimeout: () => {
      handleStateMachineEvent('timeout');
    },
  });

  // Move to next node logic
  const moveToNextNode = useCallback(() => {
    const context = getContext();
    const { currentIndex, executionOrder: order } = context;

    // Check if we've completed all nodes
    if (currentIndex >= order.length) {
      handleStateMachineEvent('move_to_next', { completed: true });
      return;
    }

    const nextNode = order[currentIndex];
    if (!nextNode) return;

    const isTestedNode = testingNodeId && nextNode.id === testingNodeId;
    const duration = getAnimationDuration(nextNode);

    // Check for buffered events
    if (isSlowNode(nextNode.type || '')) {
      const bufferedEvents = getBufferedEvents(nextNode.id);
      if (bufferedEvents.length > 0) {
        // Process buffered events
        bufferedEvents.forEach(({ event, payload }) => {
          handleStateMachineEvent(event, payload);
        });
        return;
      }
    }

    // Dispatch move_to_next event
    handleStateMachineEvent('move_to_next', {
      nodeId: nextNode.id,
      isFastNode: isFastNode(nextNode.type || ''),
      isSlowNode: isSlowNode(nextNode.type || ''),
      isTestedNode,
    });

    // Schedule timeout for fast nodes
    if (duration !== null) {
      scheduleTimeout(nextNode, duration);
    }
  }, [
    getContext,
    getAnimationDuration,
    isFastNode,
    isSlowNode,
    getBufferedEvents,
    handleStateMachineEvent,
    scheduleTimeout,
    testingNodeId,
  ]);

  // Handle state transitions
  useEffect(() => {
    const context = getContext();
    const { type } = state;

    // Clear timeout when state changes
    clearScheduledTimeout();

    // Handle state-specific logic
    if (type === 'waiting_for_start') {
      // Check if we should start animating
      const nextNode = context.executionOrder[context.currentIndex];
      if (nextNode) {
        if (isFastNode(nextNode.type || '')) {
          // Fast node - start immediately
          moveToNextNode();
        } else if (isSlowNode(nextNode.type || '')) {
          // Slow node - wait for node.start event
          if (hasBufferedEvents(nextNode.id)) {
            // Process buffered events
            const bufferedEvents = getBufferedEvents(nextNode.id);
            bufferedEvents.forEach(({ event, payload }) => {
              handleStateMachineEvent(event, payload);
            });
          } else {
            // Wait for event
            moveToNextNode();
          }
        } else {
          // Default - start immediately
          moveToNextNode();
        }
      }
    } else if (type === 'waiting_for_end') {
      // Waiting for node.end event - nothing to do here
      // Event will be handled by useSSEAnimationEvents
    } else if (type === 'animating') {
      // Node is animating - timeout will be handled by scheduler
    } else if (type === 'completed') {
      // Animation completed - clear timeout
      clearScheduledTimeout();
    }
  }, [
    state.type,
    getContext,
    isFastNode,
    isSlowNode,
    hasBufferedEvents,
    getBufferedEvents,
    moveToNextNode,
    handleStateMachineEvent,
    clearScheduledTimeout,
  ]);

  // Start animation when execution starts
  useEffect(() => {
    if (isExecuting && executionOrder.length > 0) {
      const context = getContext();
      if (context.currentIndex === 0 && !context.currentAnimatedNodeId) {
        // Start with first node
        moveToNextNode();
      }
    }
  }, [isExecuting, executionOrder.length, getContext, moveToNextNode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearScheduledTimeout();
    };
  }, [clearScheduledTimeout]);

  return {
    currentAnimatedNodeId: getCurrentAnimatedNodeId(),
    isNodeAnimating,
    executionOrder: getContext().executionOrder,
  };
}

