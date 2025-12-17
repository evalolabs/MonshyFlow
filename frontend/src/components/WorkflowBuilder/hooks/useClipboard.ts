/**
 * useClipboard Hook
 * 
 * Handles copy/paste functionality for nodes and edges.
 * Supports:
 * - Copy selected nodes (including children via grouping)
 * - Paste nodes at position (Canvas or between nodes)
 * - ID mapping for pasted nodes
 * - Edge connections preservation
 * - Dynamic grouping detection
 */

import { useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { findAllChildNodes } from '../../../utils/nodeGroupingUtils';
import { generateNodeId } from '../../../utils/nodeUtils';
import { generateEdgeId } from '../../../utils/edgeUtils';

/**
 * Find entry and exit nodes for paste between operation
 * Returns { entryNode, exitNode } where:
 * - entryNode: The node that should receive the incoming edge (usually a central node like Agent, or first in chain)
 * - exitNode: The node that should send the outgoing edge (usually the same as entryNode for groups, or last in chain)
 */
function findEntryAndExitNodes(nodes: Node[], edges: Edge[]): { entryNode: Node; exitNode: Node } | null {
  if (nodes.length === 0) return null;
  if (nodes.length === 1) {
    return { entryNode: nodes[0], exitNode: nodes[0] };
  }

  const nodeIds = new Set(nodes.map(n => n.id));
  
  console.log('[findEntryAndExitNodes] Input nodes:', nodes.map(n => ({ id: n.id, type: n.type })));
  console.log('[findEntryAndExitNodes] Input edges:', edges.map(e => ({ source: e.source, target: e.target })));
  
  // Count incoming edges for each node (from other nodes in the set)
  const incomingCounts = new Map<string, number>();
  const outgoingCounts = new Map<string, number>();
  
  nodes.forEach(node => {
    incomingCounts.set(node.id, 0);
    outgoingCounts.set(node.id, 0);
  });
  
  edges.forEach(edge => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      incomingCounts.set(edge.target, (incomingCounts.get(edge.target) || 0) + 1);
      outgoingCounts.set(edge.source, (outgoingCounts.get(edge.source) || 0) + 1);
    }
  });
  
  console.log('[findEntryAndExitNodes] Incoming counts:', Array.from(incomingCounts.entries()).map(([id, count]) => ({ id, count })));
  console.log('[findEntryAndExitNodes] Outgoing counts:', Array.from(outgoingCounts.entries()).map(([id, count]) => ({ id, count })));
  
  // Find central node (node with most incoming edges) - this is typically the Agent in Agent+Tools scenario
  let maxIncoming = 0;
  let centralNode: Node | null = null;
  
  for (const [nodeId, count] of incomingCounts.entries()) {
    if (count > maxIncoming) {
      maxIncoming = count;
      const foundNode = nodes.find(n => n.id === nodeId);
      if (foundNode) {
        centralNode = foundNode;
      }
    }
  }
  
  // If we have a central node (multiple incoming edges), use it as both entry and exit
  if (centralNode && maxIncoming > 1) {
    console.log('[findEntryAndExitNodes] Found central node:', { id: centralNode.id, type: centralNode.type, incomingCount: maxIncoming });
    return { entryNode: centralNode, exitNode: centralNode };
  }
  
  // Check for loop structure (Foreach/While with loop block)
  // Loop nodes have edges with sourceHandle='loop' and targetHandle='back'
  const loopNode = nodes.find(node => {
    if (node.type !== 'foreach' && node.type !== 'while') {
      return false;
    }
    // Check if this node has loop edges (sourceHandle='loop' and incoming edge with targetHandle='back')
    const hasLoopOutgoing = edges.some(edge => 
      edge.source === node.id && edge.sourceHandle === 'loop' && nodeIds.has(edge.target)
    );
    const hasLoopBack = edges.some(edge => 
      edge.target === node.id && edge.targetHandle === 'back' && nodeIds.has(edge.source)
    );
    return hasLoopOutgoing && hasLoopBack;
  });

  if (loopNode) {
    console.log('[findEntryAndExitNodes] Found loop node (foreach/while):', { id: loopNode.id, type: loopNode.type });
    // For loop structures, the loop node itself is both entry and exit
    return { entryNode: loopNode, exitNode: loopNode };
  }
  
  // Otherwise, find linear chain: first node (no incoming) -> ... -> last node (no outgoing)
  const firstNode = nodes.find(node => {
    return !edges.some(edge => 
      edge.target === node.id && nodeIds.has(edge.source)
    );
  });

  if (!firstNode) {
    // If no clear first node, use first node in array as fallback
    console.log('[findEntryAndExitNodes] No clear first node, using first in array');
    return { entryNode: nodes[0], exitNode: nodes[nodes.length - 1] };
  }

  // Find last node (no outgoing edges to other nodes in set)
  const lastNode = nodes.find(node => {
    return !edges.some(edge => 
      edge.source === node.id && nodeIds.has(edge.target)
    );
  }) || firstNode; // Fallback to first if no clear last node

  console.log('[findEntryAndExitNodes] Linear chain - First:', { id: firstNode.id, type: firstNode.type });
  console.log('[findEntryAndExitNodes] Linear chain - Last:', { id: lastNode.id, type: lastNode.type });
  
  return { entryNode: firstNode, exitNode: lastNode };
}

interface ClipboardData {
  nodes: Node[];
  edges: Edge[];
  offset: { x: number; y: number };
}

interface UseClipboardProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
}

export function useClipboard({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}: UseClipboardProps) {
  const clipboardRef = useRef<ClipboardData | null>(null);

  /**
   * Copy selected nodes (including all children via grouping)
   */
  const copyNodes = useCallback((selectedNodeIds: string[]) => {
    if (selectedNodeIds.length === 0) {
      return;
    }

    // LOG: Workflow state before copy
    console.log('=== [CLIPBOARD DEBUG] WORKFLOW BEFORE COPY ===');
    console.log('Nodes:', JSON.stringify(nodes.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: { label: n.data?.label || '' }
    })), null, 2));
    console.log('Edges:', JSON.stringify(edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle
    })), null, 2));
    console.log('Selected Node IDs:', selectedNodeIds);
    console.log('==============================================');

    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    
    // Find all child nodes for parent nodes (using dynamic grouping detection)
    const allNodeIds = new Set<string>(selectedNodeIds);
    for (const node of selectedNodes) {
      // Use findAllChildNodes which supports all parent types dynamically
      const childIds = findAllChildNodes(node.id, node.type, edges, nodes);
      childIds.forEach(id => allNodeIds.add(id));
    }

    const nodesToCopy = nodes.filter(n => allNodeIds.has(n.id));
    
    // Find all edges between copied nodes (internal edges only)
    const edgesToCopy = edges.filter(e => 
      allNodeIds.has(e.source) && allNodeIds.has(e.target)
    );

    // Calculate offset (position of top-left node for relative positioning)
    if (nodesToCopy.length === 0) {
      return;
    }

    const minX = Math.min(...nodesToCopy.map(n => n.position.x));
    const minY = Math.min(...nodesToCopy.map(n => n.position.y));
    const offset = { x: minX, y: minY };

    clipboardRef.current = {
      nodes: nodesToCopy,
      edges: edgesToCopy,
      offset,
    };

    // LOG: Workflow state after copy
    console.log('=== [CLIPBOARD DEBUG] COPIED DATA ===');
    console.log('Copied Nodes:', JSON.stringify(nodesToCopy.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: { label: n.data?.label || '' }
    })), null, 2));
    console.log('Copied Edges:', JSON.stringify(edgesToCopy.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle
    })), null, 2));
    console.log('Offset:', offset);
    console.log('=====================================');
    console.log(`[Clipboard] Copied ${nodesToCopy.length} nodes and ${edgesToCopy.length} edges`);
  }, [nodes, edges]);

  /**
   * Paste nodes at a specific position (Canvas paste)
   */
  const pasteNodes = useCallback((pastePosition: { x: number; y: number }) => {
    if (!clipboardRef.current) {
      return;
    }

    const { nodes: nodesToPaste, edges: edgesToPaste, offset } = clipboardRef.current;

    // Create ID mapping for new nodes
    const idMapping = new Map<string, string>();
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Calculate delta between original offset and paste position
    const deltaX = pastePosition.x - offset.x;
    const deltaY = pastePosition.y - offset.y;
    const visualOffset = 50; // Small offset so pasted nodes don't overlap exactly

    // Create new nodes with new IDs
    for (const node of nodesToPaste) {
      const newNodeId = generateNodeId(node.type || 'node');
      idMapping.set(node.id, newNodeId);

      const newNode: Node = {
        ...node,
        id: newNodeId,
        position: {
          x: node.position.x + deltaX + visualOffset,
          y: node.position.y + deltaY + visualOffset,
        },
        selected: true, // Select pasted nodes
        data: {
          ...node.data,
          // Don't modify label - keep original
        },
      };

      newNodes.push(newNode);
    }

    // Create new edges with new IDs
    for (const edge of edgesToPaste) {
      const newSourceId = idMapping.get(edge.source);
      const newTargetId = idMapping.get(edge.target);

      if (newSourceId && newTargetId) {
        newEdges.push({
          ...edge,
          id: generateEdgeId(newSourceId, newTargetId),
          source: newSourceId,
          target: newTargetId,
        });
      }
    }

    // Deselect all existing nodes
    const updatedNodes = nodes.map(n => ({ ...n, selected: false }));
    
    // Add new nodes
    onNodesChange([...updatedNodes, ...newNodes]);
    onEdgesChange([...edges, ...newEdges]);

    console.log(`[Clipboard] Pasted ${newNodes.length} nodes and ${newEdges.length} edges`);
  }, [nodes, edges, onNodesChange, onEdgesChange]);

  /**
   * Paste nodes between two existing nodes (Edge paste)
   * Inserts pasted nodes into the edge connection
   */
  const pasteNodesBetween = useCallback((
    sourceNodeId: string,
    targetNodeId: string,
    edgeId: string
  ) => {
    if (!clipboardRef.current) {
      return;
    }

    const { nodes: nodesToPaste, edges: edgesToPaste } = clipboardRef.current;

    if (nodesToPaste.length === 0) {
      return;
    }

    // Find source and target nodes
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    const targetNode = nodes.find(n => n.id === targetNodeId);
    const edge = edges.find(e => e.id === edgeId);

    if (!sourceNode || !targetNode || !edge) {
      return;
    }

    // LOG: Before sorting
    console.log('=== [CLIPBOARD DEBUG] PASTE BETWEEN NODES ===');
    console.log('Source Node:', { id: sourceNode.id, type: sourceNode.type, position: sourceNode.position });
    console.log('Target Node:', { id: targetNode.id, type: targetNode.type, position: targetNode.position });
    console.log('Edge:', { id: edge.id, source: edge.source, target: edge.target });
    console.log('Nodes to paste (ORIGINAL ORDER):', JSON.stringify(nodesToPaste.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: { label: n.data?.label || '' }
    })), null, 2));
    console.log('Edges to paste:', JSON.stringify(edgesToPaste.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target
    })), null, 2));

    // Find entry and exit nodes for paste between operation
    const entryExit = findEntryAndExitNodes(nodesToPaste, edgesToPaste);
    
    if (!entryExit) {
      console.error('[pasteNodesBetween] Could not determine entry/exit nodes');
      return;
    }
    
    const { entryNode: firstPastedNode, exitNode: lastPastedNode } = entryExit;

    console.log('Entry Node (First):', { id: firstPastedNode.id, type: firstPastedNode.type });
    console.log('Exit Node (Last):', { id: lastPastedNode.id, type: lastPastedNode.type });

    // Create ID mapping for new nodes
    const idMapping = new Map<string, string>();
    const newNodes: Node[] = [];

    // Calculate position (midpoint between source and target)
    const midpointX = (sourceNode.position.x + targetNode.position.x) / 2;
    const midpointY = (sourceNode.position.y + targetNode.position.y) / 2;

    // Create new nodes with new IDs
    // Position them in a chain from source to target
    const nodeCount = nodesToPaste.length;
    const spacing = 200; // Horizontal spacing between nodes
    const startX = midpointX - ((nodeCount - 1) * spacing) / 2;

    nodesToPaste.forEach((node, index) => {
      const newNodeId = generateNodeId(node.type || 'node');
      idMapping.set(node.id, newNodeId);

      const newNode: Node = {
        ...node,
        id: newNodeId,
        position: {
          x: startX + index * spacing,
          y: midpointY,
        },
        selected: true,
        data: {
          ...node.data,
        },
      };

      newNodes.push(newNode);
    });

    // Create new edges
    const newEdges: Edge[] = [];

    // 1. Source → First pasted node
    const firstNewNodeId = idMapping.get(firstPastedNode.id)!;
    newEdges.push({
      id: generateEdgeId(sourceNodeId, firstNewNodeId),
      source: sourceNodeId,
      target: firstNewNodeId,
      sourceHandle: edge.sourceHandle,
      targetHandle: undefined, // Will be determined by node type
      type: edge.type === 'loopEdge' ? 'loopEdge' : 'buttonEdge',
      data: edge.data,
    });

    // 2. Internal edges between pasted nodes
    const createdEdgeIds = new Set<string>(); // Track created edge IDs to avoid duplicates
    for (const edgeToPaste of edgesToPaste) {
      const newSourceId = idMapping.get(edgeToPaste.source);
      const newTargetId = idMapping.get(edgeToPaste.target);

      if (newSourceId && newTargetId) {
        // Generate edge ID - if it already exists, add a suffix to make it unique
        let newEdgeId = generateEdgeId(newSourceId, newTargetId);
        let counter = 0;
        while (createdEdgeIds.has(newEdgeId)) {
          counter++;
          newEdgeId = `${generateEdgeId(newSourceId, newTargetId)}-${counter}`;
        }
        
        createdEdgeIds.add(newEdgeId);
        newEdges.push({
          ...edgeToPaste,
          id: newEdgeId,
          source: newSourceId,
          target: newTargetId,
        });
      }
    }

    // 3. Last pasted node → Target
    const lastNewNodeId = idMapping.get(lastPastedNode.id)!;
    newEdges.push({
      id: generateEdgeId(lastNewNodeId, targetNodeId),
      source: lastNewNodeId,
      target: targetNodeId,
      sourceHandle: undefined, // Will be determined by node type
      targetHandle: edge.targetHandle,
      type: edge.type === 'loopEdge' ? 'loopEdge' : 'buttonEdge',
      data: edge.data,
    });

    // Remove original edge
    const filteredEdges = edges.filter(e => e.id !== edgeId);

    // Deselect all existing nodes
    const updatedNodes = nodes.map(n => ({ ...n, selected: false }));

    // LOG: New edges that will be created
    console.log('New Edges to be created:');
    console.log('1. Source → First:', {
      source: sourceNodeId,
      target: idMapping.get(firstPastedNode.id),
      edgeId: newEdges[0]?.id
    });
    console.log('2. Internal edges:', newEdges.slice(1, -1).map(e => ({
      id: e.id,
      source: e.source,
      target: e.target
    })));
    console.log('3. Last → Target:', {
      source: idMapping.get(lastPastedNode.id),
      target: targetNodeId,
      edgeId: newEdges[newEdges.length - 1]?.id
    });
    console.log('All new edges:', JSON.stringify(newEdges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle
    })), null, 2));
    console.log('==============================================');

    // Add new nodes and edges
    onNodesChange([...updatedNodes, ...newNodes]);
    onEdgesChange([...filteredEdges, ...newEdges]);

    console.log(`[Clipboard] Pasted ${newNodes.length} nodes between ${sourceNodeId} and ${targetNodeId}`);
  }, [nodes, edges, onNodesChange, onEdgesChange]);

  /**
   * Check if clipboard has data
   */
  const hasClipboardData = useCallback(() => {
    return clipboardRef.current !== null;
  }, []);

  /**
   * Clear clipboard
   */
  const clearClipboard = useCallback(() => {
    clipboardRef.current = null;
  }, []);

  return {
    copyNodes,
    pasteNodes,
    pasteNodesBetween,
    hasClipboardData,
    clearClipboard,
  };
}

