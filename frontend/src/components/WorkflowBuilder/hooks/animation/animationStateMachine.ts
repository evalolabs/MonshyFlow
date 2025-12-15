/**
 * Animation State Machine
 * 
 * Manages animation state using a state machine pattern.
 * This eliminates the need for multiple refs and reduces race conditions.
 * 
 * Extension Points:
 * - Can be extended with loop/conditional/parallel states in the future
 */

import type { Node } from '@xyflow/react';

/**
 * Animation State Machine States
 */
export type AnimationStateType =
  | 'idle'
  | 'waiting_for_start' // Waiting for node.start event
  | 'animating' // Node is currently animating
  | 'waiting_for_end' // Waiting for node.end event
  | 'completed' // All nodes animated
  | 'error'; // Error state

/**
 * Animation State Machine Events
 */
export type AnimationEventType =
  | 'execution_started'
  | 'execution_stopped'
  | 'node_start_received'
  | 'node_end_received'
  | 'timeout'
  | 'testing_node_changed'
  | 'move_to_next';

/**
 * Animation State Machine Context
 */
export interface AnimationContext {
  // Current animation state
  currentAnimatedNodeId: string | null;
  executionOrder: Node[];
  currentIndex: number;
  
  // Testing context
  testingNodeId: string | null;
  
  // Timeout reference (for cleanup)
  timeoutId: ReturnType<typeof setTimeout> | null;
  
  // Extension point: Additional context for special node types
  // Can be extended for loops, conditionals, parallel execution
  extensions?: {
    loop?: {
      loopNodeId: string;
      iteration: number;
      loopBodyNodes: string[];
    };
    conditional?: {
      activeBranch: 'true' | 'false';
      branchNodes: string[];
    };
    parallel?: {
      parallelNodeIds: string[];
    };
  };
}

/**
 * Complete Animation State
 */
export interface AnimationState {
  type: AnimationStateType;
  context: AnimationContext;
}

/**
 * State Machine Transition Function
 */
export type StateTransition = (
  state: AnimationState,
  event: AnimationEventType,
  payload?: any
) => AnimationState;

/**
 * State Machine Definition
 */
export class AnimationStateMachine {
  private state: AnimationState;
  private transitions: Map<string, StateTransition> = new Map();

  constructor(initialState: AnimationState) {
    this.state = initialState;
    this.setupTransitions();
  }

  /**
   * Get current state
   */
  getState(): AnimationState {
    return this.state;
  }

  /**
   * Dispatch an event to the state machine
   */
  dispatch(event: AnimationEventType, payload?: any): AnimationState {
    const key = `${this.state.type}:${event}`;
    const transition = this.transitions.get(key);

    if (transition) {
      this.state = transition(this.state, event, payload);
      return this.state;
    }

    // No transition found - state remains unchanged
    // This is expected for some event/state combinations
    return this.state;
  }

  /**
   * Setup state transitions
   */
  private setupTransitions(): void {
    // idle -> waiting_for_start (when execution starts)
    this.transitions.set('idle:execution_started', (state, _event, payload) => {
      const { executionOrder, testingNodeId } = payload;
      if (executionOrder.length === 0) return state;

      return {
        type: 'waiting_for_start',
        context: {
          ...state.context,
          executionOrder,
          currentIndex: 0,
          currentAnimatedNodeId: null,
          testingNodeId: testingNodeId || null,
        },
      };
    });

    // waiting_for_start -> animating (when node.start received or fast node)
    this.transitions.set('waiting_for_start:node_start_received', (state, _event, payload) => {
      const { nodeId } = payload;
      if (state.context.currentAnimatedNodeId !== nodeId) return state;

      return {
        type: 'waiting_for_end',
        context: {
          ...state.context,
          currentAnimatedNodeId: nodeId,
        },
      };
    });

    this.transitions.set('waiting_for_start:move_to_next', (state, _event, payload) => {
      const { nodeId, isFastNode } = payload;
      if (isFastNode) {
        // Fast node - go directly to animating
        return {
          type: 'animating',
          context: {
            ...state.context,
            currentAnimatedNodeId: nodeId,
            currentIndex: state.context.currentIndex + 1,
          },
        };
      }
      // Slow node - wait for start event
      return {
        type: 'waiting_for_start',
        context: {
          ...state.context,
          currentAnimatedNodeId: nodeId,
          currentIndex: state.context.currentIndex + 1,
        },
      };
    });

    // waiting_for_end -> waiting_for_start (when node.end received)
    this.transitions.set('waiting_for_end:node_end_received', (state, _event, payload) => {
      const { nodeId } = payload;
      if (state.context.currentAnimatedNodeId !== nodeId) return state;

      // Check if this is the tested node
      if (state.context.testingNodeId && nodeId === state.context.testingNodeId) {
        return {
          type: 'completed',
          context: {
            ...state.context,
            currentAnimatedNodeId: null,
          },
        };
      }

      // Check if we've completed all nodes
      if (state.context.currentIndex >= state.context.executionOrder.length) {
        return {
          type: 'completed',
          context: {
            ...state.context,
            currentAnimatedNodeId: null,
          },
        };
      }

      // Move to next node
      return {
        type: 'waiting_for_start',
        context: {
          ...state.context,
          currentAnimatedNodeId: null,
        },
      };
    });

    // animating -> waiting_for_start (after timeout for fast nodes)
    this.transitions.set('animating:timeout', (state, _event, _payload) => {
      // Check if this is the tested node
      if (state.context.testingNodeId && 
          state.context.currentAnimatedNodeId === state.context.testingNodeId) {
        return {
          type: 'completed',
          context: {
            ...state.context,
            currentAnimatedNodeId: null,
          },
        };
      }

      // Check if we've completed all nodes
      if (state.context.currentIndex >= state.context.executionOrder.length) {
        return {
          type: 'completed',
          context: {
            ...state.context,
            currentAnimatedNodeId: null,
          },
        };
      }

      // Move to next node
      return {
        type: 'waiting_for_start',
        context: {
          ...state.context,
          currentAnimatedNodeId: null,
        },
      };
    });

    // Any state -> idle (when execution stops)
    this.transitions.set('*:execution_stopped', (state) => {
      // Clear timeout if exists
      if (state.context.timeoutId) {
        clearTimeout(state.context.timeoutId);
      }

      return {
        type: 'idle',
        context: {
          currentAnimatedNodeId: null,
          executionOrder: [],
          currentIndex: 0,
          testingNodeId: null,
          timeoutId: null,
        },
      };
    });

    // Any state -> idle (when testing node changes)
    this.transitions.set('*:testing_node_changed', (state) => {
      // Clear timeout if exists
      if (state.context.timeoutId) {
        clearTimeout(state.context.timeoutId);
      }

      return {
        type: 'idle',
        context: {
          currentAnimatedNodeId: null,
          executionOrder: [],
          currentIndex: 0,
          testingNodeId: null,
          timeoutId: null,
        },
      };
    });
  }
}

/**
 * Create initial animation state
 */
export function createInitialAnimationState(): AnimationState {
  return {
    type: 'idle',
    context: {
      currentAnimatedNodeId: null,
      executionOrder: [],
      currentIndex: 0,
      testingNodeId: null,
      timeoutId: null,
    },
  };
}

