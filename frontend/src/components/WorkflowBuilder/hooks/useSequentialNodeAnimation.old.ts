/**
 * useSequentialNodeAnimation Hook
 * 
 * Manages sequential animation of nodes during workflow execution.
 * - Fast nodes (start, end, transform): Fixed 200ms animation
 * - Slow nodes (agent, llm, http-request): Wait for node.end SSE event
 * - Sequential flow: Animates nodes one by one in execution order
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { ExecutionStep } from '../../../types/workflow';
import type { SSEConnection } from '../../../services/sseService';
import { buildNodeOrderForDebugPanel } from '../WorkflowCanvas';
import { getNodeMetadata } from '../nodeRegistry/nodeMetadata';

const FAST_NODE_DEFAULTS = new Set(['start', 'end', 'transform']);
const SLOW_NODE_DEFAULTS = new Set(['agent', 'llm', 'http-request', 'email', 'tool']);

interface UseSequentialNodeAnimationProps {
  nodes: Node[];
  edges: Edge[];
  executionSteps: ExecutionStep[];
  sseConnection: SSEConnection | null;
  isExecuting: boolean;
  testingNodeId?: string | null; // For single node tests
}

interface AnimationState {
  currentAnimatedNodeId: string | null;
  executionOrder: Node[];
  currentIndex: number;
  waitingForEvent: boolean;
}

export function useSequentialNodeAnimation({
  nodes,
  edges,
  executionSteps: _executionSteps, // Reserved for future use
  sseConnection,
  isExecuting,
  testingNodeId = null,
}: UseSequentialNodeAnimationProps) {
  const [animationState, setAnimationState] = useState<AnimationState>({
    currentAnimatedNodeId: null,
    executionOrder: [],
    currentIndex: 0,
    waitingForEvent: false,
  });

  const waitingForEventRef = useRef<boolean>(false);
  const waitingForStartEventRef = useRef<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedRef = useRef<boolean>(false);
  const receivedNodeStartEventsRef = useRef<Set<string>>(new Set()); // Buffer for node.start events that arrived early
  
  // Memoize execution order calculation to prevent unnecessary recalculations
  const calculatedExecutionOrder = useMemo(() => {
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

  const getNodeAnimationSpeed = useCallback((nodeType?: string): 'fast' | 'slow' => {
    if (!nodeType) return 'fast';

    const metadata = getNodeMetadata(nodeType);
    if (metadata?.animationSpeed) {
      return metadata.animationSpeed;
    }

    if (metadata?.category) {
      if (['ai', 'integration', 'tools'].includes(metadata.category)) {
        return 'slow';
      }
      if (['logic', 'core', 'utility', 'data'].includes(metadata.category)) {
        return 'fast';
      }
    }

    // Fallback to defaults - http-request is in SLOW_NODE_DEFAULTS
    if (FAST_NODE_DEFAULTS.has(nodeType)) return 'fast';
    if (SLOW_NODE_DEFAULTS.has(nodeType)) return 'slow';
    
    // Default for unknown node types
    return 'fast';
  }, []);

  // Node-Type Kategorisierung derived from registry metadata
  const isFastNode = useCallback((nodeType: string): boolean => {
    return getNodeAnimationSpeed(nodeType) === 'fast';
  }, [getNodeAnimationSpeed]);

  const isSlowNode = useCallback((nodeType: string): boolean => {
    return getNodeAnimationSpeed(nodeType) === 'slow';
  }, [getNodeAnimationSpeed]);

  // Track previous isExecuting state to detect when execution starts
  const prevIsExecutingRef = useRef<boolean>(false);
  const prevTestingNodeIdRef = useRef<string | null>(null);

  // 1. Berechne Execution-Reihenfolge wenn Execution startet
  useEffect(() => {
    // console.log('[Animation] Effect triggered:', { isExecuting, nodesCount: nodes.length, edgesCount: edges.length, testingNodeId, calculatedOrderLength: calculatedExecutionOrder.length });
    
    // Detect if execution just started (transition from false to true)
    const executionJustStarted = !prevIsExecutingRef.current && isExecuting;
    const testingNodeChanged = prevTestingNodeIdRef.current !== testingNodeId;
    
    // CRITICAL: If testingNodeId changed, immediately reset everything to prevent race conditions
    if (testingNodeChanged && prevTestingNodeIdRef.current !== null) {
      // console.log('[Animation] ⚠️ testingNodeId changed - immediately resetting animation state to prevent race conditions');
      // Clear all timeouts immediately
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Reset all refs immediately
      waitingForEventRef.current = false;
      waitingForStartEventRef.current = false;
      hasStartedRef.current = false;
      receivedNodeStartEventsRef.current.clear();
      // Reset animation state immediately
      setAnimationState({
        currentAnimatedNodeId: null,
        executionOrder: [],
        currentIndex: 0,
        waitingForEvent: false,
      });
    }
    
    // Update refs
    prevIsExecutingRef.current = isExecuting;
    prevTestingNodeIdRef.current = testingNodeId || null;
    
    if (isExecuting && calculatedExecutionOrder.length > 0) {
      const nodeIds = calculatedExecutionOrder.map(n => n.id).join(',');
      
      // Always reset animation if execution just started or testing node changed
      // OR if execution order changed
      setAnimationState(prev => {
        const prevNodeIds = prev.executionOrder.map(n => n.id).join(',');
        const orderChanged = prevNodeIds !== nodeIds || prev.executionOrder.length === 0;
        
        if (!orderChanged && !executionJustStarted && !testingNodeChanged) {
          // Execution order hasn't changed AND execution didn't just start AND testing node didn't change
          // This means we're in the middle of an execution, don't reset
          // console.log('[Animation] Execution order unchanged and execution already in progress, keeping current animation state');
          return prev;
        }
        
        if (testingNodeId) {
          // console.log('[Animation] Node test detected - animating path from Start to:', testingNodeId, 'Nodes:', calculatedExecutionOrder.map(n => `${n.id} (${n.type})`));
        } else {
          // console.log('[Animation] Full workflow execution, ordered nodes:', calculatedExecutionOrder.map(n => `${n.id} (${n.type})`));
        }
        
        return {
          ...prev,
          executionOrder: calculatedExecutionOrder,
          currentIndex: 0,
          currentAnimatedNodeId: null,
          waitingForEvent: false,
        };
      });
      // Reset hasStarted so animation can start immediately
      hasStartedRef.current = false;
      waitingForEventRef.current = false;
      waitingForStartEventRef.current = false;
      receivedNodeStartEventsRef.current.clear();
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else if (!isExecuting) {
      // Reset when execution stops
      // console.log('[Animation] Execution stopped, resetting animation');
      setAnimationState({
        currentAnimatedNodeId: null,
        executionOrder: [],
        currentIndex: 0,
        waitingForEvent: false,
      });
      waitingForEventRef.current = false;
      hasStartedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isExecuting, calculatedExecutionOrder, testingNodeId]);

  // 3. Sequenzielle Animation - move to next node
  const moveToNextNode = useCallback(() => {
    setAnimationState(prev => {
      if (prev.currentIndex >= prev.executionOrder.length) {
        // Alle Nodes animiert → fertig
        // If this was a node test, stop here (don't continue to next nodes)
        if (testingNodeId) {
          // console.log('[Animation] Node test completed - stopping at tested node');
          return {
            ...prev,
            currentAnimatedNodeId: null,
            waitingForEvent: false,
          };
        }
        return {
          ...prev,
          currentAnimatedNodeId: null,
          waitingForEvent: false,
        };
      }

      const nextNode = prev.executionOrder[prev.currentIndex];
      const nextIndex = prev.currentIndex + 1;
      const isTestedNode = testingNodeId && nextNode.id === testingNodeId;

      // If we're already animating this node, don't process it again
      if (prev.currentAnimatedNodeId === nextNode.id && (waitingForEventRef.current || waitingForStartEventRef.current)) {
        // console.log('[Animation] Already animating this node, skipping:', nextNode.id);
        return prev;
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Determine animation duration based on node type
      let animationDuration: number | null = null;

      if (nextNode.type && isFastNode(nextNode.type)) {
        // Fast node: 200ms fixed duration
        animationDuration = 200;
      } else if (nextNode.type && isSlowNode(nextNode.type)) {
        // Slow node: Wait for node.start event first, then node.end event (if SSE connection available)
        if (sseConnection) {
          // SSE connection available - wait for node.start event first, then node.end
          animationDuration = null; // Signal to wait for events
          
          // Check if we're already waiting for this specific node
          // IMPORTANT: If currentAnimatedNodeId is already set to this node and we're waiting, don't change flags
          const alreadyWaitingForThisNode = prev.currentAnimatedNodeId === nextNode.id && (waitingForEventRef.current || waitingForStartEventRef.current);
          
          // CRITICAL: If we're already waiting for an event (waitingForEventRef.current = true),
          // and currentAnimatedNodeId is about to be set to this node, don't overwrite it
          // This prevents the race condition where moveToNextNode() is called multiple times
          const isAboutToWaitForEvent = waitingForEventRef.current && prev.currentAnimatedNodeId !== nextNode.id;
          
          if (alreadyWaitingForThisNode) {
            // Already waiting for this node - don't change the flags
            // console.log('[Animation] Slow node detected but already waiting for this node, keeping current state:', nextNode.id, 'waitingForEvent:', waitingForEventRef.current, 'waitingForStart:', waitingForStartEventRef.current);
          } else if (isAboutToWaitForEvent) {
            // We're about to wait for an event for this node - don't change the flags
            // This happens when moveToNextNode() is called multiple times before the state is updated
            // console.log('[Animation] Slow node detected - already waiting for event, keeping waitingForEvent = true:', nextNode.id);
          } else if (receivedNodeStartEventsRef.current.has(nextNode.id)) {
            // Check if node.start event already arrived (buffered)
            // console.log('[Animation] Slow node detected - node.start event already received, proceeding directly to node.end wait:', nextNode.id, isTestedNode ? '(tested node)' : '');
            // Event already received - skip waiting for start, go directly to waiting for end
            waitingForStartEventRef.current = false;
            waitingForEventRef.current = true;
            receivedNodeStartEventsRef.current.delete(nextNode.id); // Remove from buffer
          } else {
            // No buffered event and not already waiting - set up to wait for node.start
            // console.log('[Animation] Slow node detected - waiting for node.start event before animating:', nextNode.id, isTestedNode ? '(tested node)' : '');
            waitingForStartEventRef.current = true; // Wait for node.start first
            waitingForEventRef.current = false; // Will be set to true after node.start
          }
          
          // Set currentAnimatedNodeId to show node is waiting, and increment index
          // IMPORTANT: For tested node, we must NOT stop here - we need to wait for node.start and node.end
          return {
            ...prev,
            currentAnimatedNodeId: nextNode.id, // Mark node as waiting for start
            currentIndex: nextIndex, // Increment index so next moveToNextNode() takes next node
            waitingForEvent: waitingForEventRef.current, // Set based on whether we're waiting for start or end
          };
        } else {
          // No SSE connection - use fixed duration as fallback
          animationDuration = 1500;
          waitingForEventRef.current = false;
          waitingForStartEventRef.current = false;
        }
      } else {
        // Default: 1500ms (increased for better visibility)
        animationDuration = 1500;
      }

      // Set current animated node
      // console.log('[Animation] Animating node:', nextNode.id, 'type:', nextNode.type, 'duration:', animationDuration);
      const newState = {
        ...prev,
        currentAnimatedNodeId: nextNode.id,
        currentIndex: nextIndex,
        waitingForEvent: animationDuration === null,
      };

      // Schedule next node animation
      if (animationDuration !== null) {
        // Capture current testingNodeId to check in timeout callback
        const timeoutTestingNodeId = testingNodeId;
        timeoutRef.current = setTimeout(() => {
          // CRITICAL: Check if testingNodeId changed - if so, don't continue animation
          if (timeoutTestingNodeId !== testingNodeId) {
            // console.log('[Animation] ⚠️ testingNodeId changed during timeout, canceling animation continuation');
            return;
          }
          
          // Check if this was the tested node - if so, stop animation
          // BUT: For slow nodes (animationDuration === null), we wait for node.end event
          // which is handled in handleNodeEnd, so we don't stop here for slow nodes
          if (isTestedNode) {
            // console.log('[Animation] Node test completed - stopping at tested node (fast node)');
            setAnimationState(finalPrev => ({
              ...finalPrev,
              currentAnimatedNodeId: null,
              waitingForEvent: false,
            }));
          } else {
            moveToNextNode();
          }
        }, animationDuration);
      }
      // If animationDuration is null, we wait for node.end event (handled by useEffect above)
      // For tested slow nodes, handleNodeEnd will stop the animation after node.end is received

      return newState;
    });
  }, [isFastNode, isSlowNode, testingNodeId, sseConnection]);

  // 2. SSE Event Handler für node.start und node.end
  // Always register handlers when SSE connection is available
  useEffect(() => {
    if (!sseConnection) {
      // console.log('[Animation] No SSE connection available for SSE event handlers');
      return;
    }

    // console.log('[Animation] Setting up SSE event handlers for node.start and node.end');

    const handleNodeEnd = (event: any) => {
      // console.log('[Animation] 📥 Received node.end SSE event:', event);
      const nodeId = event.data?.node_id || event.data?.nodeId;
      
      // CRITICAL: Check if this event is still relevant for the current test
      const currentTestingNodeId = testingNodeId;
      
      setAnimationState(prev => {
        // Check if this event is still relevant for the current test
        // If testingNodeId changed, ignore events from previous tests
        const isRelevantForCurrentTest = !currentTestingNodeId || 
          (prev.executionOrder.some(n => n.id === nodeId && 
            prev.executionOrder.findIndex(n2 => n2.id === currentTestingNodeId) >= 
            prev.executionOrder.findIndex(n2 => n2.id === nodeId)));
        
        if (!isRelevantForCurrentTest) {
          // console.log('[Animation] ⚠️ Ignoring node.end event - not relevant for current test:', nodeId, 'currentTestingNodeId:', currentTestingNodeId);
          return prev;
        }
        
        // console.log('[Animation] 📥 Node ID from event:', nodeId, 'Current animated node:', prev.currentAnimatedNodeId, 'waitingForEvent:', waitingForEventRef.current, 'testingNodeId:', currentTestingNodeId);
        
        // Double-check: if testingNodeId changed since we started processing, ignore this event
        if (currentTestingNodeId !== testingNodeId) {
          // console.log('[Animation] ⚠️ testingNodeId changed during event processing, ignoring event');
          return prev;
        }
        
        if (nodeId === prev.currentAnimatedNodeId && waitingForEventRef.current) {
          // console.log('[Animation] ✅ Node matches current animated node and waiting for end event');
          // Check if this is the tested node - if so, stop animation instead of moving to next
          if (currentTestingNodeId && nodeId === currentTestingNodeId) {
            // console.log('[Animation] 🛑 Tested node completed - stopping animation');
            waitingForEventRef.current = false;
            return {
              ...prev,
              currentAnimatedNodeId: null,
              waitingForEvent: false,
            };
          } else {
            // console.log('[Animation] 🚀 Node completed, will move to next after state update');
            waitingForEventRef.current = false;
            // Schedule moveToNextNode after state update
            setTimeout(() => moveToNextNode(), 0);
            return {
              ...prev,
              waitingForEvent: false,
            };
          }
        } else {
          // console.log('[Animation] ⚠️ Node ID does not match current animated node or not waiting for event, ignoring');
        }
        return prev;
      });
    };

    // Listen for node.start to start animation for slow nodes
    const handleNodeStart = (event: any) => {
      // console.log('[Animation] 📥 Received node.start SSE event:', event);
      const nodeId = event.data?.node_id || event.data?.nodeId;
      // console.log('[Animation] 📥 node.start - nodeId:', nodeId, 'waitingForStartEvent:', waitingForStartEventRef.current, 'currentAnimatedNodeId:', animationState.currentAnimatedNodeId);
      
      // CRITICAL: Check if this event is still relevant for the current test
      const currentTestingNodeId = testingNodeId;
      const isRelevantForCurrentTest = !currentTestingNodeId || 
        calculatedExecutionOrder.some(n => n.id === nodeId && 
          calculatedExecutionOrder.findIndex(n2 => n2.id === currentTestingNodeId) >= 
          calculatedExecutionOrder.findIndex(n2 => n2.id === nodeId));
      
      if (!isRelevantForCurrentTest) {
        // console.log('[Animation] ⚠️ Ignoring node.start event - not relevant for current test:', nodeId, 'currentTestingNodeId:', currentTestingNodeId);
        return;
      }
      
      // Check if this is a slow node in our execution order
      const isSlowNodeInOrder = calculatedExecutionOrder.some(
        node => node.id === nodeId && node.type && isSlowNode(node.type)
      );
      
      // If we're waiting for a node.start event for a slow node, start animating it
      if (waitingForStartEventRef.current) {
        setAnimationState(prev => {
          // console.log('[Animation] 📥 node.start - checking match: event nodeId:', nodeId, 'currentAnimatedNodeId:', prev.currentAnimatedNodeId, 'waitingForStartEvent:', waitingForStartEventRef.current, 'testingNodeId:', currentTestingNodeId);
          
          // Double-check: if testingNodeId changed since we started processing, ignore this event
          if (currentTestingNodeId !== testingNodeId) {
            // console.log('[Animation] ⚠️ testingNodeId changed during event processing, ignoring event');
            return prev;
          }
          
          // Check if this is the current node we're waiting for
          // OR if currentAnimatedNodeId matches this node (even if we're waiting for start)
          if (prev.currentAnimatedNodeId === nodeId) {
            // console.log('[Animation] ✅ node.start received for slow node, now waiting for node.end:', nodeId);
            waitingForStartEventRef.current = false;
            waitingForEventRef.current = true; // Now wait for node.end
            
            // Node is now animating, wait for node.end
            return {
              ...prev,
              waitingForEvent: true,
            };
          } else if (prev.currentAnimatedNodeId === null && waitingForStartEventRef.current) {
            // If currentAnimatedNodeId is null but we're waiting, find the node in execution order
            const nodeInOrder = calculatedExecutionOrder.find(n => n.id === nodeId);
            if (nodeInOrder) {
              const nodeIndex = calculatedExecutionOrder.findIndex(n => n.id === nodeId);
              // console.log('[Animation] ✅ node.start received for slow node (currentAnimatedNodeId was null), now waiting for node.end:', nodeId);
              waitingForStartEventRef.current = false;
              waitingForEventRef.current = true; // Now wait for node.end
              
              // Node is now animating, wait for node.end
              return {
                ...prev,
                currentAnimatedNodeId: nodeId, // Set the node ID
                currentIndex: nodeIndex + 1, // Set index to next node
                waitingForEvent: true,
              };
            }
          } else {
            // console.log('[Animation] ⚠️ node.start received but node ID does not match current animated node:', nodeId, 'vs', prev.currentAnimatedNodeId);
          }
          return prev;
        });
      } else if (isSlowNodeInOrder) {
        // Event arrived early - buffer it for when we reach this node
        // console.log('[Animation] 📦 node.start event arrived early, buffering for node:', nodeId);
        receivedNodeStartEventsRef.current.add(nodeId);
      } else {
        // console.log('[Animation] ⚠️ node.start received but not waiting for start event and not a slow node in execution order');
      }
    };
    
    sseConnection.on('node.end', handleNodeEnd);
    sseConnection.on('node.start', handleNodeStart);
    
    // console.log('[Animation] ✅ SSE event handlers registered for node.start and node.end');
    
    return () => {
      // SSEConnection handlers are cleaned up on disconnect
      // No explicit off method needed
      // console.log('[Animation] Cleaning up SSE event handlers');
    };
  }, [sseConnection, animationState.currentAnimatedNodeId, moveToNextNode, calculatedExecutionOrder, isSlowNode]);

  // 4. Start Animation wenn Execution startet
  useEffect(() => {
    // Full workflow execution OR node test - animate all nodes sequentially
    // Start animation IMMEDIATELY when isExecuting becomes true and we have execution order
    if (
      isExecuting &&
      animationState.executionOrder.length > 0 &&
      !hasStartedRef.current
    ) {
      // console.log('[Animation] Starting full workflow animation with', animationState.executionOrder.length, 'nodes');
      hasStartedRef.current = true;
      // Start with first node immediately
      moveToNextNode();
    } else if (!isExecuting) {
      // Reset when execution stops
      // console.log('[Animation] Execution stopped, resetting animation');
      hasStartedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isExecuting, animationState.executionOrder.length, moveToNextNode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    currentAnimatedNodeId: animationState.currentAnimatedNodeId,
    isNodeAnimating: (nodeId: string) => animationState.currentAnimatedNodeId === nodeId,
    executionOrder: animationState.executionOrder,
  };
}

