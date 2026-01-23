/**
 * useWorkflowAnimation Hook (Simplified - like Activepieces)
 * 
 * Status-based animation - reads status directly from executionSteps.
 * No complex state machine, no SSE event logic in the hook.
 * 
 * Like Activepieces:
 * - Status comes directly from backend (via debugSteps/executionSteps)
 * - Simple status extraction
 * - No race conditions
 * - No timing issues
 * 
 * Advantages:
 * - ~90% less code than previous system
 * - Easy to maintain
 * - Zuverlässig
 */

import { useMemo } from 'react';
import type { ExecutionStep } from '../../../types/workflow';

interface UseWorkflowAnimationProps {
  executionSteps: ExecutionStep[];
  isExecuting: boolean;
}

type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

interface WorkflowAnimationState {
  currentRunningNodeId: string | null;
  completedNodeIds: Set<string>;
  failedNodeIds: Set<string>;
  nodeStatuses: Map<string, StepStatus>;
}

export function useWorkflowAnimation({
  executionSteps,
  isExecuting,
}: UseWorkflowAnimationProps) {
  const state = useMemo<WorkflowAnimationState>(() => {
    // Initial state
    const initialState: WorkflowAnimationState = {
      currentRunningNodeId: null,
      completedNodeIds: new Set(),
      failedNodeIds: new Set(),
      nodeStatuses: new Map(),
    };

    // If not executing, return initial state
    if (!isExecuting || executionSteps.length === 0) {
      return initialState;
    }

    // Analyze executionSteps (like Activepieces - status comes directly from backend)
    // executionSteps is updated in real-time by SSE events in WorkflowCanvas
    let currentRunning: string | null = null;
    const completed = new Set<string>();
    const failed = new Set<string>();
    const statuses = new Map<string, StepStatus>();

    // Iterate through all steps and categorize them
    // IMPORTANT: executionSteps should have the statuses in the correct order
    for (const step of executionSteps) {
      const status = step.status || 'pending';
      statuses.set(step.nodeId, status as StepStatus);

      switch (status) {
        case 'running':
          // The currently running node (there should only be one)
          // Prioritize the last "running" status (newest information)
          currentRunning = step.nodeId;
          break;
        case 'completed':
          completed.add(step.nodeId);
          break;
        case 'failed':
          failed.add(step.nodeId);
          break;
        case 'pending':
        default:
          // Pending steps are not tracked
          break;
      }
    }

    return {
      currentRunningNodeId: currentRunning,
      completedNodeIds: completed,
      failedNodeIds: failed,
      nodeStatuses: statuses,
    };
  }, [executionSteps, isExecuting]);

  // Helper functions for easy use
  const isNodeRunning = (nodeId: string): boolean => {
    return state.currentRunningNodeId === nodeId;
  };

  const isNodeCompleted = (nodeId: string): boolean => {
    return state.completedNodeIds.has(nodeId);
  };

  const isNodeFailed = (nodeId: string): boolean => {
    return state.failedNodeIds.has(nodeId);
  };

  const getNodeStatus = (nodeId: string): StepStatus | undefined => {
    return state.nodeStatuses.get(nodeId);
  };

  const isNodeAnimating = (nodeId: string): boolean => {
    // A node is "animating" if it is currently running
    // Like Activepieces: Only the running node is animated
    return isNodeRunning(nodeId);
  };

  return {
    // Haupt-API (kompatibel mit altem Hook)
    currentAnimatedNodeId: state.currentRunningNodeId,
    isNodeAnimating,

    // Zusätzliche Helper-Funktionen
    isNodeRunning,
    isNodeCompleted,
    isNodeFailed,
    getNodeStatus,

    // Internal state (for debugging)
    state,
  };
}
