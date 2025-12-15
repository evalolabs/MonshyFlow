/**
 * useWorkflowAnimation Hook (Vereinfacht - wie Activepieces)
 * 
 * Status-basierte Animation - liest Status direkt aus executionSteps.
 * Keine komplexe State Machine, keine SSE-Event-Logik im Hook.
 * 
 * Wie Activepieces:
 * - Status kommt direkt von Backend (via debugSteps/executionSteps)
 * - Einfache Status-Extraktion
 * - Keine Race Conditions
 * - Keine Timing-Probleme
 * 
 * Vorteile:
 * - ~90% weniger Code als vorheriges System
 * - Einfach zu warten
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

    // Wenn nicht ausgeführt wird, return initial state
    if (!isExecuting || executionSteps.length === 0) {
      return initialState;
    }

    // Analysiere executionSteps (wie Activepieces - Status kommt direkt von Backend)
    // executionSteps wird in Echtzeit aktualisiert durch SSE-Events in WorkflowCanvas
    let currentRunning: string | null = null;
    const completed = new Set<string>();
    const failed = new Set<string>();
    const statuses = new Map<string, StepStatus>();

    // Durchlaufe alle Steps und kategorisiere sie
    // WICHTIG: executionSteps sollte die Statuses in der richtigen Reihenfolge haben
    for (const step of executionSteps) {
      const status = step.status || 'pending';
      statuses.set(step.nodeId, status as StepStatus);

      switch (status) {
        case 'running':
          // Der aktuell laufende Node (es sollte nur einen geben)
          // Priorisiere den letzten "running" Status (neueste Information)
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
          // Pending steps werden nicht getrackt
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

  // Helper-Funktionen für einfache Verwendung
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
    // Ein Node ist "animierend", wenn er aktuell läuft
    // Wie bei Activepieces: Nur der laufende Node wird animiert
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

    // Interner State (für Debugging)
    state,
  };
}
