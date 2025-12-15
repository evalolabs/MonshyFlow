/**
 * Animation Extension Points
 * 
 * Defines interfaces and types for extending animation behavior
 * for special node types (loops, conditionals, parallel execution).
 * 
 * These are placeholders for future implementation.
 */

import type { Node } from '@xyflow/react';
import type { AnimationState, AnimationContext } from './animationStateMachine';

/**
 * Extension Point: Loop Animation Handler
 * 
 * Handles animation for loop nodes (foreach, while).
 * Can be implemented later to animate loop body nodes multiple times.
 */
export interface ILoopAnimationHandler {
  /**
   * Check if a node is a loop node
   */
  isLoopNode(node: Node): boolean;

  /**
   * Handle loop node animation start
   */
  onLoopStart(
    state: AnimationState,
    loopNode: Node,
    context: AnimationContext
  ): AnimationState;

  /**
   * Handle loop iteration
   */
  onLoopIteration(
    state: AnimationState,
    loopNode: Node,
    iteration: number,
    context: AnimationContext
  ): AnimationState;

  /**
   * Handle loop end
   */
  onLoopEnd(
    state: AnimationState,
    loopNode: Node,
    context: AnimationContext
  ): AnimationState;
}

/**
 * Extension Point: Conditional Animation Handler
 * 
 * Handles animation for conditional nodes (ifelse).
 * Can be implemented later to only animate the active branch.
 */
export interface IConditionalAnimationHandler {
  /**
   * Check if a node is a conditional node
   */
  isConditionalNode(node: Node): boolean;

  /**
   * Determine which branch should be animated
   */
  getActiveBranch(
    state: AnimationState,
    conditionalNode: Node,
    context: AnimationContext
  ): 'true' | 'false' | null;

  /**
   * Filter execution order to only include active branch
   */
  filterExecutionOrder(
    executionOrder: Node[],
    conditionalNode: Node,
    activeBranch: 'true' | 'false'
  ): Node[];
}

/**
 * Extension Point: Parallel Animation Handler
 * 
 * Handles animation for parallel execution.
 * Can be implemented later to animate multiple nodes simultaneously.
 */
export interface IParallelAnimationHandler {
  /**
   * Check if nodes should be animated in parallel
   */
  shouldAnimateInParallel(nodes: Node[]): boolean;

  /**
   * Handle parallel animation start
   */
  onParallelStart(
    state: AnimationState,
    parallelNodes: Node[],
    context: AnimationContext
  ): AnimationState;

  /**
   * Handle parallel animation end
   */
  onParallelEnd(
    state: AnimationState,
    parallelNodes: Node[],
    context: AnimationContext
  ): AnimationState;
}

/**
 * Extension Registry
 * 
 * Registry for animation extensions.
 * Can be populated later with implementations.
 */
export class AnimationExtensionRegistry {
  private loopHandler: ILoopAnimationHandler | null = null;
  private conditionalHandler: IConditionalAnimationHandler | null = null;
  private parallelHandler: IParallelAnimationHandler | null = null;

  /**
   * Register loop animation handler
   */
  registerLoopHandler(handler: ILoopAnimationHandler): void {
    this.loopHandler = handler;
  }

  /**
   * Register conditional animation handler
   */
  registerConditionalHandler(handler: IConditionalAnimationHandler): void {
    this.conditionalHandler = handler;
  }

  /**
   * Register parallel animation handler
   */
  registerParallelHandler(handler: IParallelAnimationHandler): void {
    this.parallelHandler = handler;
  }

  /**
   * Get loop handler
   */
  getLoopHandler(): ILoopAnimationHandler | null {
    return this.loopHandler;
  }

  /**
   * Get conditional handler
   */
  getConditionalHandler(): IConditionalAnimationHandler | null {
    return this.conditionalHandler;
  }

  /**
   * Get parallel handler
   */
  getParallelHandler(): IParallelAnimationHandler | null {
    return this.parallelHandler;
  }
}

/**
 * Global extension registry instance
 */
export const animationExtensionRegistry = new AnimationExtensionRegistry();


