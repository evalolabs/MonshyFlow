/**
 * Animation System - Public API
 * 
 * This module exports the refactored animation system.
 * The old implementation is kept for backward compatibility during migration.
 */

export { useSequentialNodeAnimation } from './useSequentialNodeAnimation.refactored';
export { AnimationStateMachine, createInitialAnimationState } from './animationStateMachine';
export { SSEAnimationEventBus, MockAnimationEventBus } from './animationEventBus';
export { animationExtensionRegistry } from './animationExtensionPoints';
export type { AnimationState, AnimationEventType, AnimationContext } from './animationStateMachine';
export type { IAnimationEventBus } from './animationEventBus';
export type { ILoopAnimationHandler, IConditionalAnimationHandler, IParallelAnimationHandler } from './animationExtensionPoints';
















