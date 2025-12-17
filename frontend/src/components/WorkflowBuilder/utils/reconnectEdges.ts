import type { Edge } from '@xyflow/react';

function isSimpleFlowEdge(edge: Edge): boolean {
  const sourceHandle = edge.sourceHandle ?? undefined;
  const targetHandle = edge.targetHandle ?? undefined;

  // Only reconnect "linear chain" edges: no special handles and not loop/tool edges.
  if (sourceHandle || targetHandle) return false;
  if (edge.type === 'loopEdge') return false;
  if (edge.type === 'default') return false; // tool edges are usually 'default' in this codebase
  return true;
}

/**
 * Compute a reconnect for a removed subgraph.
 *
 * If there is exactly one incoming external "simple flow" edge into the removed set,
 * and exactly one outgoing external "simple flow" edge out of the removed set,
 * we can reconnect source -> target to keep the linear chain intact.
 */
export function computeReconnectForRemovedSet(
  edges: Edge[],
  removedNodeIds: Set<string>
): { source: string; target: string } | null {
  const incomingExternal = edges.filter(
    e => isSimpleFlowEdge(e) && !removedNodeIds.has(e.source) && removedNodeIds.has(e.target)
  );
  const outgoingExternal = edges.filter(
    e => isSimpleFlowEdge(e) && removedNodeIds.has(e.source) && !removedNodeIds.has(e.target)
  );

  if (incomingExternal.length !== 1 || outgoingExternal.length !== 1) {
    return null;
  }

  const source = incomingExternal[0].source;
  const target = outgoingExternal[0].target;

  if (!source || !target || source === target) {
    return null;
  }

  // Avoid duplicates if edge already exists
  const alreadyExists = edges.some(e => e.source === source && e.target === target && isSimpleFlowEdge(e));
  if (alreadyExists) {
    return null;
  }

  return { source, target };
}


