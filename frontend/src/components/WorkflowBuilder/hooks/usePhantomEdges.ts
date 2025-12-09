/**
 * usePhantomEdges Hook
 * 
 * Creates phantom edges for nodes without outputs.
 * These phantom edges show + buttons to add next nodes.
 */

import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { createPhantomEdge } from '../../../utils/edgeUtils';
import { NODE_TYPE_END } from '../constants';

interface UsePhantomEdgesProps {
  nodes: Node[];
  edges: Edge[];
  onAddNode: (sourceNodeId: string) => void;
}

export function usePhantomEdges({ nodes, edges, onAddNode }: UsePhantomEdgesProps) {
  // Calculate phantom edges
  const phantomEdges = useMemo(() => {
    const result: Edge[] = [];

    // Find nodes without outgoing edges (excluding End nodes)
    const nodesWithoutOutput = nodes.filter(node => {
      if (node.type === NODE_TYPE_END) return false;
      
      const hasOutgoingEdge = edges.some(
        e => e.source === node.id && !e.id.startsWith('phantom-')
      );
      
      return !hasOutgoingEdge;
    });

    // Create phantom edges for nodes without output
    nodesWithoutOutput.forEach(node => {
      result.push(
        createPhantomEdge(node.id, () => onAddNode(node.id))
      );
    });

    return result;
  }, [nodes, edges, onAddNode]);

  return phantomEdges;
}


