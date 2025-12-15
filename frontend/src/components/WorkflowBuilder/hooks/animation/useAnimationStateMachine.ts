/**
 * useAnimationStateMachine Hook
 * 
 * Manages animation state using the state machine pattern.
 * This hook replaces the multiple refs with a single state machine.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Node } from '@xyflow/react';
import {
  AnimationStateMachine,
  createInitialAnimationState,
  type AnimationState,
  type AnimationEventType,
} from './animationStateMachine';

interface UseAnimationStateMachineProps {
  executionOrder: Node[];
  testingNodeId: string | null;
  isExecuting: boolean;
}

export function useAnimationStateMachine({
  executionOrder,
  testingNodeId,
  isExecuting,
}: UseAnimationStateMachineProps) {
  const [state, setState] = useState<AnimationState>(createInitialAnimationState());
  const stateMachineRef = useRef<AnimationStateMachine | null>(null);

  // Initialize state machine
  useEffect(() => {
    if (!stateMachineRef.current) {
      stateMachineRef.current = new AnimationStateMachine(createInitialAnimationState());
      setState(stateMachineRef.current.getState());
    }
  }, []);

  // Handle execution start/stop
  useEffect(() => {
    if (!stateMachineRef.current) return;

    if (isExecuting && executionOrder.length > 0) {
      const newState = stateMachineRef.current.dispatch('execution_started', {
        executionOrder,
        testingNodeId,
      });
      setState(newState);
    } else if (!isExecuting) {
      const newState = stateMachineRef.current.dispatch('execution_stopped');
      setState(newState);
    }
  }, [isExecuting, executionOrder, testingNodeId]);

  // Handle testing node changes
  const prevTestingNodeIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!stateMachineRef.current) return;

    const prevTestingNodeId = prevTestingNodeIdRef.current;
    if (prevTestingNodeId !== testingNodeId && prevTestingNodeId !== null) {
      const newState = stateMachineRef.current.dispatch('testing_node_changed');
      setState(newState);
    }
    prevTestingNodeIdRef.current = testingNodeId;
  }, [testingNodeId]);

  /**
   * Dispatch an event to the state machine
   */
  const dispatch = useCallback((event: AnimationEventType, payload?: any) => {
    if (!stateMachineRef.current) return;

    const newState = stateMachineRef.current.dispatch(event, payload);
    setState(newState);
    return newState;
  }, []);

  /**
   * Get current animated node ID
   */
  const getCurrentAnimatedNodeId = useCallback((): string | null => {
    return state.context.currentAnimatedNodeId;
  }, [state.context.currentAnimatedNodeId]);

  /**
   * Check if a node is currently animating
   */
  const isNodeAnimating = useCallback(
    (nodeId: string): boolean => {
      return state.context.currentAnimatedNodeId === nodeId;
    },
    [state.context.currentAnimatedNodeId]
  );

  /**
   * Get current state type
   */
  const getStateType = useCallback((): AnimationState['type'] => {
    return state.type;
  }, [state.type]);

  /**
   * Get current context
   */
  const getContext = useCallback((): AnimationState['context'] => {
    return state.context;
  }, [state.context]);

  return {
    state,
    dispatch,
    getCurrentAnimatedNodeId,
    isNodeAnimating,
    getStateType,
    getContext,
  };
}

