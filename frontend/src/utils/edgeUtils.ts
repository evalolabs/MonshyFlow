/**
 * Edge Utility Functions
 * 
 * Helper functions for edge operations in the workflow builder.
 */

import type { Edge } from '@xyflow/react';
import {
  EDGE_TYPE_BUTTON,
  EDGE_TYPE_LOOP,
  PHANTOM_EDGE_PREFIX,
  LOOP_HANDLE_IDS,
} from '../components/WorkflowBuilder/constants';

/**
 * Generate a unique edge ID from source and target
 */
export function generateEdgeId(source: string, target: string, suffix?: string): string {
  const base = `${source}-${target}`;
  return suffix ? `${base}${suffix}` : base;
}

/**
 * Check if an edge is a phantom edge
 */
export function isPhantomEdge(edge: Edge): boolean {
  return edge.id.startsWith(PHANTOM_EDGE_PREFIX);
}


/**
 * Clean up null string values from database
 */
export function cleanEdgeHandles(edge: Edge): Edge {
  return {
    ...edge,
    sourceHandle: edge.sourceHandle === 'null' || edge.sourceHandle === null ? undefined : edge.sourceHandle,
    targetHandle: edge.targetHandle === 'null' || edge.targetHandle === null ? undefined : edge.targetHandle,
  };
}

/**
 * Create a standard edge with button functionality
 */
export function createButtonEdge(
  source: string,
  target: string,
  onAddNode: (edgeId: string, source: string, target: string) => void,
  sourceHandle?: string,
  targetHandle?: string
): Edge {
  // Clean up null string values (from database or other sources)
  const cleanedSourceHandle = sourceHandle === 'null' || sourceHandle === null ? undefined : sourceHandle;
  const cleanedTargetHandle = targetHandle === 'null' || targetHandle === null ? undefined : targetHandle;
  
  return {
    id: generateEdgeId(source, target),
    source,
    target,
    sourceHandle: cleanedSourceHandle,
    targetHandle: cleanedTargetHandle,
    type: EDGE_TYPE_BUTTON,
    data: { onAddNode },
  };
}


/**
 * Create a phantom edge for a node without outputs
 */
export function createPhantomEdge(
  nodeId: string,
  onAddNode: () => void,
  _sourceHandle?: string
): Edge {
  // ✅ Phantom edges are UI-only elements (+ buttons) that don't follow normal edge rules
  // The warning about missing handles is suppressed in WorkflowCanvas's onError handler
  const edge: Edge = {
    id: `${PHANTOM_EDGE_PREFIX}${nodeId}`,
    source: nodeId,
    target: nodeId,
    sourceHandle: _sourceHandle || undefined,
    targetHandle: undefined, // Intentionally undefined - phantom edges don't connect to real handles
    type: 'phantomAddButton',
    data: { onAddNode },
    style: { opacity: 0, pointerEvents: 'none' },
  } as Edge;
  
  return edge;
}

/**
 * Find all edges connected to a node
 */
export function findConnectedEdges(edges: Edge[], nodeId: string): {
  incoming: Edge[];
  outgoing: Edge[];
} {
  return {
    incoming: edges.filter(e => e.target === nodeId),
    outgoing: edges.filter(e => e.source === nodeId),
  };
}

/**
 * Build edge lookup map for graph traversal
 */
export function buildEdgeLookup(edges: Edge[]): Map<string, string[]> {
  const lookup = new Map<string, string[]>();
  
  edges.forEach(edge => {
    if (!lookup.has(edge.source)) {
      lookup.set(edge.source, []);
    }
    lookup.get(edge.source)!.push(edge.target);
  });
  
  return lookup;
}

/**
 * Find all downstream nodes using BFS
 */
export function findDownstreamNodes(startNodeId: string, edges: Edge[]): Set<string> {
  const lookup = buildEdgeLookup(edges);
  const downstream = new Set<string>();
  const queue = [startNodeId];
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (downstream.has(nodeId)) continue;
    downstream.add(nodeId);
    
    const children = lookup.get(nodeId) || [];
    queue.push(...children);
  }
  
  return downstream;
}

/**
 * Create reconnection edges when deleting a node
 */
export function createReconnectionEdges(
  incomingEdges: Edge[],
  outgoingEdges: Edge[],
  existingEdges: Edge[],
  onAddNode: (edgeId: string, source: string, target: string) => void
): Edge[] {
  const newEdges: Edge[] = [];
  
  incomingEdges.forEach(inEdge => {
    outgoingEdges.forEach(outEdge => {
      // Check if this edge doesn't already exist
      const edgeExists = existingEdges.some(
        e => e.source === inEdge.source && e.target === outEdge.target
      );
      
      if (!edgeExists) {
        newEdges.push(
          createButtonEdge(
            inEdge.source,
            outEdge.target,
            onAddNode,
            inEdge.sourceHandle || undefined,
            outEdge.targetHandle || undefined
          )
        );
      }
    });
  });
  
  return newEdges;
}

/**
 * Create a loop edge with button functionality
 * Used for while loop connections (loop and back handles)
 */
export function createLoopEdge(
  source: string,
  target: string,
  onAddNode: (edgeId: string, source: string, target: string) => void,
  sourceHandle?: string,
  targetHandle?: string,
  loopType?: 'loop' | 'back'
): Edge {
  const cleanedSourceHandle = sourceHandle === 'null' || sourceHandle === null ? undefined : sourceHandle;
  const cleanedTargetHandle = targetHandle === 'null' || targetHandle === null ? undefined : targetHandle;
  
  // Determine loop type from handles if not provided
  const determinedLoopType = loopType || 
    (cleanedSourceHandle === LOOP_HANDLE_IDS.BACK ? 'back' : 
     cleanedSourceHandle === LOOP_HANDLE_IDS.LOOP ? 'loop' : 
     cleanedTargetHandle === LOOP_HANDLE_IDS.LOOP_BACK ? 'back' : 'loop');
  
  return {
    id: generateEdgeId(source, target, `-loop-${determinedLoopType}`),
    source,
    target,
    sourceHandle: cleanedSourceHandle,
    targetHandle: cleanedTargetHandle,
    type: EDGE_TYPE_LOOP,
    data: { 
      onAddNode,
      loopType: determinedLoopType,
    },
  };
}

/**
 * Find the while node that a loop edge connects to
 */
export function findWhileNodeForLoop(edges: Edge[], nodeId: string): string | null {
  // Find edges that connect back to a while node
  const loopBackEdges = edges.filter(e => 
    e.source === nodeId && 
    (e.targetHandle === LOOP_HANDLE_IDS.LOOP_BACK || e.sourceHandle === LOOP_HANDLE_IDS.BACK)
  );
  
  if (loopBackEdges.length > 0) {
    return loopBackEdges[0].target;
  }
  
  // Also check if we're connected to a while node via loop handle
  const whileNodeEdges = edges.filter(e => 
    e.target === nodeId && 
    e.sourceHandle === LOOP_HANDLE_IDS.LOOP
  );
  
  if (whileNodeEdges.length > 0) {
    // Find the while node by following the loop structure
    const sourceNode = whileNodeEdges[0].source;
    // Check if source is a while node
    return sourceNode;
  }
  
  return null;
}


