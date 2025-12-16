/**
 * useUndoRedo Hook - Simple Implementation
 * 
 * Manages undo/redo history for workflow nodes and edges.
 * Basic functionality: track state changes and allow undo/redo.
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
  description?: string;
}

interface UseUndoRedoProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  enabled?: boolean;
  maxHistorySize?: number;
}

const DEFAULT_MAX_HISTORY_SIZE = 50;
const POSITION_DEBOUNCE_MS = 400;

export function useUndoRedo({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  enabled = true,
  maxHistorySize = DEFAULT_MAX_HISTORY_SIZE,
}: UseUndoRedoProps) {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Refs for tracking state
  const isApplyingHistoryRef = useRef(false);
  const lastSavedStateRef = useRef<HistoryState | null>(null);
  const positionDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);

  /**
   * Create a snapshot of current state
   */
  const createSnapshot = useCallback((): HistoryState => {
    return {
      nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
      edges: JSON.parse(JSON.stringify(edges)), // Deep clone
      timestamp: Date.now(),
    };
  }, [nodes, edges]);

  /**
   * Check if current state is different from last saved state
   */
  const hasChanges = useCallback((currentState: HistoryState): boolean => {
    if (!lastSavedStateRef.current) {
      return true;
    }

    const last = lastSavedStateRef.current;
    const currentStr = JSON.stringify({ nodes: currentState.nodes, edges: currentState.edges });
    const lastStr = JSON.stringify({ nodes: last.nodes, edges: last.edges });
    
    return currentStr !== lastStr;
  }, []);

  /**
   * Get simple description of change
   */
  const getChangeDescription = useCallback((currentState: HistoryState): string => {
    if (!lastSavedStateRef.current) {
      return 'Initial state';
    }

    const last = lastSavedStateRef.current;
    const currentNodeIds = new Set(currentState.nodes.map(n => n.id));
    const lastNodeIds = new Set(last.nodes.map(n => n.id));
    const currentEdgeIds = new Set(currentState.edges.map(e => e.id));
    const lastEdgeIds = new Set(last.edges.map(e => e.id));

    const addedNodes = [...currentNodeIds].filter(id => !lastNodeIds.has(id));
    const deletedNodes = [...lastNodeIds].filter(id => !currentNodeIds.has(id));
    const addedEdges = [...currentEdgeIds].filter(id => !lastEdgeIds.has(id));
    const deletedEdges = [...lastEdgeIds].filter(id => !currentEdgeIds.has(id));

    if (addedNodes.length > 0) {
      return addedNodes.length === 1 ? 'Add node' : `Add ${addedNodes.length} nodes`;
    }
    if (deletedNodes.length > 0) {
      return deletedNodes.length === 1 ? 'Delete node' : `Delete ${deletedNodes.length} nodes`;
    }
    if (addedEdges.length > 0 || deletedEdges.length > 0) {
      return 'Modify connections';
    }

    // Check for position changes
    let hasPositionChange = false;
    for (const currentNode of currentState.nodes) {
      const lastNode = last.nodes.find(n => n.id === currentNode.id);
      if (lastNode) {
        const dx = Math.abs(currentNode.position.x - lastNode.position.x);
        const dy = Math.abs(currentNode.position.y - lastNode.position.y);
        if (dx > 1 || dy > 1) {
          hasPositionChange = true;
          break;
        }
      }
    }

    if (hasPositionChange) {
      return 'Move nodes';
    }

    return 'Change workflow';
  }, []);

  /**
   * Add current state to history
   */
  const addToHistory = useCallback(() => {
    if (!enabled || isApplyingHistoryRef.current || !isInitializedRef.current) {
      return;
    }

    const snapshot = createSnapshot();

    if (!hasChanges(snapshot)) {
      return;
    }

    snapshot.description = getChangeDescription(snapshot);

    setHistory(prev => {
      const currentIndex = historyIndex;
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(snapshot);
      
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      const newIndex = newHistory.length - 1;
      setHistoryIndex(newIndex);
      lastSavedStateRef.current = snapshot;
      
      return newHistory;
    });
  }, [enabled, createSnapshot, hasChanges, getChangeDescription, historyIndex, maxHistorySize]);

  /**
   * Handle position changes with debouncing
   */
  const handlePositionChange = useCallback(() => {
    if (positionDebounceTimerRef.current) {
      clearTimeout(positionDebounceTimerRef.current);
    }

    positionDebounceTimerRef.current = setTimeout(() => {
      addToHistory();
    }, POSITION_DEBOUNCE_MS);
  }, [addToHistory]);

  /**
   * Undo last change
   */
  const undo = useCallback(() => {
    if (!canUndo || historyIndex <= 0) {
      return;
    }

    const targetIndex = historyIndex - 1;
    const targetState = history[targetIndex];
    
    if (!targetState) {
      return;
    }

    isApplyingHistoryRef.current = true;
    
    try {
      onNodesChange(targetState.nodes);
      onEdgesChange(targetState.edges);
      
      setHistoryIndex(targetIndex);
      lastSavedStateRef.current = targetState;
    } finally {
      setTimeout(() => {
        isApplyingHistoryRef.current = false;
      }, 100);
    }
  }, [canUndo, historyIndex, history, onNodesChange, onEdgesChange]);

  /**
   * Redo last undone change
   */
  const redo = useCallback(() => {
    if (!canRedo || historyIndex >= history.length - 1) {
      return;
    }

    const targetIndex = historyIndex + 1;
    const targetState = history[targetIndex];
    
    if (!targetState) {
      return;
    }

    isApplyingHistoryRef.current = true;
    
    try {
      onNodesChange(targetState.nodes);
      onEdgesChange(targetState.edges);
      
      setHistoryIndex(targetIndex);
      lastSavedStateRef.current = targetState;
    } finally {
      setTimeout(() => {
        isApplyingHistoryRef.current = false;
      }, 100);
    }
  }, [canRedo, historyIndex, history, onNodesChange, onEdgesChange]);

  /**
   * Clear history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
    lastSavedStateRef.current = null;
    isInitializedRef.current = false;
  }, []);

  /**
   * Initialize history with current state
   */
  const initializeHistory = useCallback(() => {
    if (!enabled) {
      return;
    }

    const snapshot = createSnapshot();
    snapshot.description = 'Initial state';
    
    setHistory([snapshot]);
    setHistoryIndex(0);
    lastSavedStateRef.current = snapshot;
    isInitializedRef.current = true;
  }, [enabled, createSnapshot]);

  // Update undo/redo availability
  useEffect(() => {
    const newCanUndo = enabled && history.length > 0 && historyIndex > 0;
    const newCanRedo = enabled && history.length > 0 && historyIndex < history.length - 1;
    
    setCanUndo(newCanUndo);
    setCanRedo(newCanRedo);
  }, [enabled, historyIndex, history.length]);

  // Track changes and add to history
  useEffect(() => {
    if (!enabled || isApplyingHistoryRef.current || !isInitializedRef.current) {
      return;
    }

    const snapshot = createSnapshot();

    if (!hasChanges(snapshot)) {
      return;
    }

    // Check if it's a position-only change
    const lastState = lastSavedStateRef.current;
    if (lastState) {
      let isPositionOnly = true;
      const currentNodeIds = new Set(snapshot.nodes.map(n => n.id));
      const lastNodeIds = new Set(lastState.nodes.map(n => n.id));
      const currentEdgeIds = new Set(snapshot.edges.map(e => e.id));
      const lastEdgeIds = new Set(lastState.edges.map(e => e.id));

      // Check for structural changes
      if (currentNodeIds.size !== lastNodeIds.size ||
          currentEdgeIds.size !== lastEdgeIds.size ||
          [...currentNodeIds].some(id => !lastNodeIds.has(id)) ||
          [...lastNodeIds].some(id => !currentNodeIds.has(id)) ||
          [...currentEdgeIds].some(id => !lastEdgeIds.has(id)) ||
          [...lastEdgeIds].some(id => !currentEdgeIds.has(id))) {
        isPositionOnly = false;
      }

      if (isPositionOnly) {
        // Position-only change - debounce it
        handlePositionChange();
        return;
      }
    }

    // Structural change - add immediately
    addToHistory();
  }, [nodes, edges, enabled, addToHistory, handlePositionChange, createSnapshot, hasChanges]);

  // Note: Keyboard shortcuts are now handled by useKeyboardShortcuts in WorkflowCanvas
  // This allows for centralized shortcut management

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    initializeHistory,
    historySize: history.length,
    historyIndex,
    getUndoActionDescription: () => history[historyIndex - 1]?.description || 'Undo',
    getRedoActionDescription: () => history[historyIndex + 1]?.description || 'Redo',
  };
}
