/**
 * useAutoSave Hook
 * 
 * Handles automatic saving of workflow with debouncing.
 * Prevents saving during initial load and provides manual save trigger.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { AUTO_SAVE_DELAY, MIN_TIME_BEFORE_AUTO_SAVE } from '../constants';
import { autoSaveLogger as logger } from '../../../utils/logger';

interface UseAutoSaveProps {
  workflowId?: string;
  nodes: Node[];
  edges: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void>;
  enabled?: boolean;
}

export function useAutoSave({ workflowId, nodes, edges, onSave, enabled = true }: UseAutoSaveProps) {
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRenderRef = useRef(true);
  const componentMountTimeRef = useRef<number>(Date.now());
  const lastSavedRef = useRef<string>(''); // Track last saved state as JSON string
  const nodesRef = useRef<Node[]>(nodes);
  const edgesRef = useRef<Edge[]>(edges);

  // Update refs when nodes/edges change (without triggering re-renders)
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  // Helper to compare if nodes/edges actually changed (deep comparison)
  const hasChanges = useCallback((currentNodes: Node[], currentEdges: Edge[]): boolean => {
    const currentState = JSON.stringify({ nodes: currentNodes, edges: currentEdges });
    return currentState !== lastSavedRef.current;
  }, []);

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!workflowId || !onSave || !enabled) return;

    // Prevent auto-save within first few seconds of component mount
    const timeSinceMount = Date.now() - componentMountTimeRef.current;
    if (timeSinceMount < MIN_TIME_BEFORE_AUTO_SAVE) {
      logger.debug(`Skipping auto-save - component just mounted ${timeSinceMount}ms ago`);
      return;
    }

    // Use refs to get current state (avoid stale closures)
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    // IMPORTANT: Save ALL nodes including tool nodes, as they are part of the Agent node
    // and need to be stored for the execution-service (Node.js) to use with OpenAI SDK
    const nodesToSave = currentNodes;
    const edgesToSave = currentEdges;

    // Check if anything actually changed
    if (!hasChanges(nodesToSave, edgesToSave)) {
      logger.debug('Skipping auto-save - no changes detected');
      return;
    }

    setAutoSaving(true);
    try {
      await onSave(nodesToSave, edgesToSave);
      
      // Mark as saved after successful save
      lastSavedRef.current = JSON.stringify({ nodes: nodesToSave, edges: edgesToSave });
      
      // logger.info('Auto-saved workflow');
    } catch (error) {
      logger.error('Auto-save failed', error);
    } finally {
      setAutoSaving(false);
    }
  }, [workflowId, onSave, enabled, hasChanges]);

  // Manual save function
  const manualSave = useCallback(async () => {
    if (!onSave) {
      logger.warn('No onSave function provided');
      return;
    }

    logger.info('Manual save initiated');
    try {
      // IMPORTANT: Save ALL nodes including tool nodes, as they are part of the Agent node
      // and need to be stored for the execution-service (Node.js) to use with OpenAI SDK
      await onSave(nodes, edges);
      logger.info('Manual save completed');
    } catch (error) {
      logger.error('Manual save failed', error);
      throw error;
    }
  }, [nodes, edges, onSave]);

  // Trigger auto-save after a short delay (for immediate saves after operations)
  const triggerImmediateSave = useCallback(() => {
    logger.debug('Triggering immediate save');
    setTimeout(() => {
      autoSave();
    }, 100);
  }, [autoSave]);

  // Initialize lastSavedRef on first render (after nodes/edges are loaded)
  useEffect(() => {
    if (isFirstRenderRef.current && nodes.length > 0) {
      lastSavedRef.current = JSON.stringify({ nodes, edges });
      isFirstRenderRef.current = false;
      logger.debug('Initialized lastSavedRef with initial workflow state');
    }
  }, [nodes.length, edges.length]); // Only depend on length to avoid re-running on every change

  // Debounced auto-save effect
  useEffect(() => {
    // Skip auto-save on first render or if not initialized yet
    if (isFirstRenderRef.current || lastSavedRef.current === '') {
      logger.debug('Skipping auto-save - first render or not initialized');
      return;
    }

    if (!enabled) return;

    // Check if anything actually changed before setting timeout
    if (!hasChanges(nodes, edges)) {
      logger.debug('Skipping auto-save - no changes detected');
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, AUTO_SAVE_DELAY);

    // Cleanup
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [nodes, edges, autoSave, enabled, hasChanges]);

  return {
    autoSaving,
    autoSave,
    manualSave,
    triggerImmediateSave,
  };
}


