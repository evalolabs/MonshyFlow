/**
 * useEdgeHandling Hook
 * 
 * Handles edge operations: creation, connection, and handle management.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { Edge, Connection, Node } from '@xyflow/react';
import {
  cleanEdgeHandles,
} from '../../../utils/edgeUtils';
import { EDGE_TYPE_BUTTON, EDGE_TYPE_LOOP, isLoopNodeType, isLoopHandle, LOOP_HANDLE_IDS } from '../constants';
import { isToolNodeType } from '../../../types/toolCatalog';

const EDGE_TYPE_TOOL = 'default'; // Use default bezier curve for a more pronounced arc

interface UseEdgeHandlingProps {
  nodes: Node[];
  edges: Edge[];
  onEdgesChange: (edges: Edge[]) => void;
  onAddNodeCallback: (edgeId: string, source: string, target: string) => void;
}

export function useEdgeHandling({
  nodes,
  edges,
  onEdgesChange,
  onAddNodeCallback,
}: UseEdgeHandlingProps) {
  
  // Store callback in ref to avoid recreating edges unnecessarily
  const callbackRef = useRef(onAddNodeCallback);
  callbackRef.current = onAddNodeCallback;

  // Handle new connection
  const handleConnect = useCallback((connection: Connection) => {

    // Validation: Only tool nodes can connect to Agent Tool handles
    const targetHandle = connection.targetHandle;
    const isAgentToolHandle = targetHandle === 'tool' || targetHandle === 'chat-model' || targetHandle === 'memory';
    
    if (isAgentToolHandle && connection.source) {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const isSourceTool = sourceNode?.type === 'tool' || isToolNodeType(sourceNode?.type || '');
      
      if (!isSourceTool) {
        alert('⚠️ Only Tool nodes can be connected to Agent Tool handles.\n\nPlease use a Tool from the "Tools" tab instead of a regular node.');
        return;
      }
    }

    // Validation: Tool nodes can only connect to Agent Tool handles
    if (connection.source) {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const isSourceTool = sourceNode?.type === 'tool' || isToolNodeType(sourceNode?.type || '');
      
      if (isSourceTool && !isAgentToolHandle) {
        alert('⚠️ Tool nodes can only be connected to Agent Tool handles.\n\nPlease connect the tool to the "Tool" input handle on an Agent node.');
        return;
      }
    }

    // Validation: Prevent "shared tools" across multiple agents.
    // A tool node may only connect to ONE agent's tool handle. This avoids ambiguous ownership and edge cases
    // for delete/duplicate/drag.
    if (isAgentToolHandle && connection.source && connection.target) {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const isSourceTool = sourceNode?.type === 'tool' || isToolNodeType(sourceNode?.type || '');
      if (isSourceTool) {
        const existingAgentConnections = edges.filter(
          e =>
            e.source === connection.source &&
            (e.targetHandle === 'tool' || e.targetHandle === 'chat-model' || e.targetHandle === 'memory')
        );

        const isAlreadyConnectedToOtherAgent = existingAgentConnections.some(e => e.target !== connection.target);
        if (isAlreadyConnectedToOtherAgent) {
          alert(
            '⚠️ This Tool is already connected to another Agent.\n\nTo keep workflows predictable, each Tool node can only belong to one Agent. Please duplicate the Tool first if you want to use it with multiple Agents.'
          );
          return;
        }
      }
    }

    // Determine edge type: 
    // 1. Loop edges (based on handle IDs - ROBUST, works with any node)
    // 2. Tool edges (based on tool connections)
    // 3. Default button edges (for all other connections)
    
    const sourceHandle = connection.sourceHandle;
    const targetNode = nodes.find(n => n.id === connection.target);
    const sourceNode = nodes.find(n => n.id === connection.source);
    const isSourceTool = sourceNode?.type === 'tool' || isToolNodeType(sourceNode?.type || '');
    const isToolConnection = isSourceTool && isAgentToolHandle;
    
    // PRIORITY 1: Check for loop handles (handle-based, not node-based)
    // This ensures loop edges work even if new nodes are added via registry
    const isLoopConnection = isLoopHandle(sourceHandle) || isLoopHandle(targetHandle);
    
    // SPECIAL CASE: Auto-detect loop-back connection
    // Only create loop-back edge if:
    // 1. Connecting to 'back' handle explicitly, OR
    // 2. Connecting from a loop node (while/foreach) to another loop node
    const isConnectingToLoopNode = isLoopNodeType(targetNode?.type);
    const isConnectingFromLoopNode = isLoopNodeType(sourceNode?.type);
    // Normal output: null, undefined, or empty string (no explicit sourceHandle)
    const isNormalOutput = !sourceHandle || sourceHandle === null || sourceHandle === undefined || sourceHandle === '';
    // If connecting to 'back' handle, it's definitely a loop-back
    const isConnectingToBackHandle = targetHandle === LOOP_HANDLE_IDS.BACK;
    // Auto-create loop-back ONLY if:
    // - Connecting to 'back' handle explicitly, OR
    // - Connecting from a loop node (within a loop) to another loop node
    // NOT if connecting from a normal node to a loop node's input (that's a normal connection)
    const shouldAutoCreateLoopBack = isConnectingToLoopNode && 
      (isConnectingToBackHandle || (isConnectingFromLoopNode && isNormalOutput)) && 
      !isLoopHandle(sourceHandle);
    
    // Determine edge type with priority: Loop > Tool > Button
    // If auto-creating loop-back, use loop edge type
    const edgeType = (isLoopConnection || shouldAutoCreateLoopBack)
      ? EDGE_TYPE_LOOP 
      : isToolConnection 
        ? EDGE_TYPE_TOOL 
        : EDGE_TYPE_BUTTON;
    
    // Determine handles for auto-created loop-back
    let finalSourceHandle = connection.sourceHandle || undefined;
    let finalTargetHandle = connection.targetHandle || undefined;
    
    // CRITICAL: If connecting to 'back' handle on loop node, keep 'back' as target handle
    // Only set sourceHandle to 'back' if the source node is also a loop node (has 'back' handle)
    // This must happen BEFORE shouldAutoCreateLoopBack check, because isLoopConnection might be true
    if (isConnectingToLoopNode && isConnectingToBackHandle) {
      // Only use 'back' as sourceHandle if source node is a loop node (has 'back' handle)
      if (isConnectingFromLoopNode) {
        finalSourceHandle = finalSourceHandle || LOOP_HANDLE_IDS.BACK;
      }
      finalTargetHandle = LOOP_HANDLE_IDS.BACK; // Keep 'back' handle (the actual handle name on WhileNode)
    } else if (shouldAutoCreateLoopBack) {
      // Auto-create loop-back: use 'back' source handle and 'back' target handle
      // Only if source node is a loop node (has 'back' handle)
      if (isConnectingFromLoopNode) {
        finalSourceHandle = LOOP_HANDLE_IDS.BACK;
      }
      finalTargetHandle = LOOP_HANDLE_IDS.BACK; // 'back' is the actual handle name on WhileNode
    }
    
    // Create new edge - CRITICAL: Set type immediately so ReactFlow uses correct component
    const newEdge: Edge = {
      id: `${connection.source}-${connection.target}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: finalSourceHandle,
      targetHandle: finalTargetHandle,
      type: edgeType, // CRITICAL: Set type immediately
      data: isToolConnection ? {} : {
        onAddNode: (edgeId: string, source: string, target: string) =>
          callbackRef.current(edgeId, source, target),
        // Add loop type info for loop edges
        ...((isLoopConnection || shouldAutoCreateLoopBack) && {
          loopType: finalSourceHandle === LOOP_HANDLE_IDS.BACK || finalTargetHandle === LOOP_HANDLE_IDS.BACK 
            ? 'back' 
            : 'loop',
        }),
      },
    };

    onEdgesChange([...edges, newEdge]);
  }, [nodes, edges, onEdgesChange]);

  // CRITICAL: Ensure all edges have correct types
  // This must run on every edge change to catch any edges that need type conversion
  // Priority: Loop > Tool > Button
  useEffect(() => {
    // First, check if ANY edges need to be converted
    // This must happen IMMEDIATELY to prevent ReactFlow from using wrong edge type
    const edgesNeedingUpdate = edges.filter(
      edge => {
        // PRIORITY 1: Check for loop edges (handle-based detection)
        const sourceHandle = edge.sourceHandle;
        const targetHandle = edge.targetHandle;
        const isLoopEdge = isLoopHandle(sourceHandle) || isLoopHandle(targetHandle);
        
        if (isLoopEdge && edge.type !== EDGE_TYPE_LOOP) {
          return true; // Needs conversion to loopEdge
        }
        
        // Skip loop edges from further processing
        if (edge.type === EDGE_TYPE_LOOP) {
          return false; // Already correct
        }
        
        // PRIORITY 2: Convert old 'toolEdge' type to 'default'
        if (edge.type === 'toolEdge') {
          return true; // Always convert old toolEdge type
        }
        
        // Skip edges that are already correct
        const isAgentToolHandle = targetHandle === 'tool' || targetHandle === 'chat-model' || targetHandle === 'memory';
        const sourceNode = nodes.find(n => n.id === edge.source);
        const isSourceTool = sourceNode?.type === 'tool' || isToolNodeType(sourceNode?.type || '');
        
        if (isSourceTool && isAgentToolHandle) {
          // Should be 'default' type but isn't
          if (edge.type !== 'default') {
            return true;
          }
          return false; // Already correct
        }
        
        // Otherwise, check if it needs button functionality
        return !edge.data?.onAddNode || edge.type === undefined;
      }
    );

    // CRITICAL: Always check and convert edges, even if no other updates are needed
    // This ensures edges are NEVER rendered with wrong type
    const hasEdgesToConvert = edges.some(edge => {
      // Check for loop edges
      const sourceHandle = edge.sourceHandle;
      const targetHandle = edge.targetHandle;
      const isLoopEdge = isLoopHandle(sourceHandle) || isLoopHandle(targetHandle);
      if (isLoopEdge && edge.type !== EDGE_TYPE_LOOP) return true;
      
      // Convert old 'toolEdge' type
      if (edge.type === 'toolEdge') return true;
      
      // Check if it should be a tool edge but isn't
      if (edge.type === 'default') return false; // Already correct
      
      const isAgentToolHandle = targetHandle === 'tool' || targetHandle === 'chat-model' || targetHandle === 'memory';
      const sourceNode = nodes.find(n => n.id === edge.source);
      const isSourceTool = sourceNode?.type === 'tool' || isToolNodeType(sourceNode?.type || '');
      return isSourceTool && isAgentToolHandle;
    });

    if (edgesNeedingUpdate.length > 0 || hasEdgesToConvert) {
      const updatedEdges = edges.map(edge => {
        // PRIORITY 1: Convert loop edges (handle-based)
        const sourceHandle = edge.sourceHandle;
        const targetHandle = edge.targetHandle;
        const isLoopEdge = isLoopHandle(sourceHandle) || isLoopHandle(targetHandle);
        
        if (isLoopEdge && edge.type !== EDGE_TYPE_LOOP) {
          return {
            ...edge,
            type: EDGE_TYPE_LOOP,
            data: {
              ...edge.data,
              onAddNode: (edgeId: string, source: string, target: string) =>
                callbackRef.current(edgeId, source, target),
              loopType: sourceHandle === LOOP_HANDLE_IDS.BACK || targetHandle === LOOP_HANDLE_IDS.BACK 
                ? 'back' 
                : 'loop',
            },
          };
        }
        
        // Ensure loop edges have onAddNode callback
        if (edge.type === EDGE_TYPE_LOOP) {
          // Check if onAddNode is missing or needs update
          if (!edge.data?.onAddNode) {
            return {
              ...edge,
              data: {
                ...edge.data,
                onAddNode: (edgeId: string, source: string, target: string) =>
                  callbackRef.current(edgeId, source, target),
                loopType: edge.data?.loopType || 
                  (sourceHandle === LOOP_HANDLE_IDS.BACK || targetHandle === LOOP_HANDLE_IDS.BACK ? 'back' : 'loop'),
              },
            };
          }
          return edge;
        }
        
        // PRIORITY 2: Check if this should be a tool edge
        const isAgentToolHandle = targetHandle === 'tool' || targetHandle === 'chat-model' || targetHandle === 'memory';
        const sourceNode = nodes.find(n => n.id === edge.source);
        const isSourceTool = sourceNode?.type === 'tool' || isToolNodeType(sourceNode?.type || '');
        
        // CRITICAL: Convert old 'toolEdge' type to 'default' (for backward compatibility)
        // Also convert tool connections to use 'default' edge type (bezier curve)
        if (edge.type === 'toolEdge' || (isSourceTool && isAgentToolHandle)) {
          return {
            ...edge,
            type: 'default', // Use default bezier curve for tool edges
            data: {}, // Tool edges don't need onAddNode
          };
        }
        
        // Don't modify existing default edges that are already correct
        if (edge.type === 'default' && isSourceTool && isAgentToolHandle) {
          return edge;
        }

        // PRIORITY 3: Default button edge
        const cleaned = cleanEdgeHandles(edge);
        
        return {
          ...cleaned,
          type: edge.type || EDGE_TYPE_BUTTON,
          data: {
            ...edge.data,
            onAddNode: (edgeId: string, source: string, target: string) =>
              callbackRef.current(edgeId, source, target),
          },
        };
      });

      onEdgesChange(updatedEdges);
    }
  }, [nodes, edges, onEdgesChange]);

  return {
    handleConnect,
  };
}


