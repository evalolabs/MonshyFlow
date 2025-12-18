/**
 * Node Grouping Utilities
 * 
 * Generic utilities for handling parent-child relationships between nodes.
 * Supports:
 * - Agent + Tools
 * - While/ForEach + Loop-Block
 * - IfElse + Branches
 * - Dynamic detection for new/unknown node types based on edge patterns
 * 
 * This is the foundation for copy/paste, duplicate, multi-select, and alignment features.
 */

import type { Node, Edge } from '@xyflow/react';

/**
 * Loop-pair (Loop -> End-loop): find the paired end-loop node by pairId.
 */
function findEndLoopForPair(loopNodeId: string, nodes: Node[]): string | null {
  const loopNode = nodes.find(n => n.id === loopNodeId);
  if (!loopNode) return null;
  const pairId = (loopNode.data as any)?.pairId;
  if (!pairId) return null;
  const end = nodes.find(n => n.type === 'end-loop' && (n.data as any)?.pairId === pairId);
  return end?.id ?? null;
}

/**
 * Loop-pair (Loop -> End-loop): collect all nodes reachable from loop until end-loop (exclusive).
 * This models the loop "body" between the two anchors.
 */
function findLoopPairBodyNodes(loopNodeId: string, endLoopNodeId: string, edges: Edge[]): string[] {
  const lookup = new Map<string, string[]>();
  edges.forEach(e => {
    if (!lookup.has(e.source)) lookup.set(e.source, []);
    lookup.get(e.source)!.push(e.target);
  });

  const visited = new Set<string>();
  const body = new Set<string>();
  const queue: string[] = [loopNodeId];

  while (queue.length) {
    const cur = queue.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    if (cur === endLoopNodeId) continue;
    if (cur !== loopNodeId) body.add(cur);
    const nexts = lookup.get(cur) || [];
    nexts.forEach(n => {
      if (!visited.has(n)) queue.push(n);
    });
  }

  body.delete(endLoopNodeId);
  return Array.from(body);
}

/**
 * Check if an edge connects to an agent's bottom input handle
 */
function isAgentBottomInputEdge(edge: Edge): boolean {
  return edge.targetHandle === 'tool' || 
         edge.targetHandle === 'chat-model' || 
         edge.targetHandle === 'memory';
}

/**
 * Check if an edge is a branch edge (ifelse true/false connection)
 */
function isBranchEdge(edge: Edge): boolean {
  return edge.sourceHandle === 'true' || edge.sourceHandle === 'false';
}

/**
 * Find all tool nodes connected to a specific agent node
 * 
 * @param agentNodeId - The ID of the agent node
 * @param edges - All edges in the workflow
 * @param nodes - All nodes in the workflow
 * @returns Array of tool node IDs
 */
export function findToolNodesForAgent(
  agentNodeId: string,
  edges: Edge[]
): string[] {
  const toolEdges = edges.filter(edge => 
    edge.target === agentNodeId && isAgentBottomInputEdge(edge)
  );

  return toolEdges.map(edge => edge.source);
}

/**
 * Find all nodes in a loop block (while/foreach)
 * Uses BFS to traverse from loop handle to back handle
 * 
 * @param loopNodeId - The ID of the while/foreach node
 * @param edges - All edges in the workflow
 * @param nodes - All nodes in the workflow
 * @returns Array of node IDs in the loop block
 */
export function findLoopBlockNodes(
  loopNodeId: string,
  edges: Edge[]
): string[] {
  const loopBodyNodes = new Set<string>();
  const visited = new Set<string>();
  
  // Find the edge that starts the loop (sourceHandle: 'loop')
  const loopStartEdges = edges.filter(edge => 
    edge.source === loopNodeId && edge.sourceHandle === 'loop'
  );
  
  if (loopStartEdges.length === 0) {
    return [];
  }
  
  // BFS traversal from loop start to back handle
  const queue: string[] = [];
  
  // Start with all nodes connected to the loop handle
  loopStartEdges.forEach(edge => {
    if (!visited.has(edge.target)) {
      queue.push(edge.target);
      visited.add(edge.target);
    }
  });
  
  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    loopBodyNodes.add(currentNodeId);
    
    // Find all outgoing edges from this node
    edges.forEach(edge => {
      if (edge.source === currentNodeId) {
        // If this edge goes back to the loop node, stop traversal
        if (edge.target === loopNodeId && edge.targetHandle === 'back') {
          return; // Don't add the loop node itself
        }
        
        // Continue traversal if not visited
        if (!visited.has(edge.target)) {
          queue.push(edge.target);
          visited.add(edge.target);
        }
      }
    });
  }
  
  return Array.from(loopBodyNodes);
}

/**
 * Find all nodes in a branch (ifelse true or false branch)
 * Uses BFS to traverse from branch handle to merge point or end
 * 
 * @param ifElseNodeId - The ID of the ifelse node
 * @param branchHandle - 'true' or 'false'
 * @param edges - All edges in the workflow
 * @param nodes - All nodes in the workflow
 * @returns Array of node IDs in the branch
 */
export function findBranchNodes(
  ifElseNodeId: string,
  branchHandle: 'true' | 'false',
  edges: Edge[]
): string[] {
  const branchNodes = new Set<string>();
  const visited = new Set<string>();
  
  // Find the edge that starts the branch
  const branchStartEdges = edges.filter(edge => 
    edge.source === ifElseNodeId && edge.sourceHandle === branchHandle
  );
  
  if (branchStartEdges.length === 0) {
    return [];
  }
  
  // BFS traversal from branch start
  const queue: string[] = [];
  
  branchStartEdges.forEach(edge => {
    if (!visited.has(edge.target)) {
      queue.push(edge.target);
      visited.add(edge.target);
    }
  });
  
  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    branchNodes.add(currentNodeId);
    
    // Find all outgoing edges from this node
    edges.forEach(edge => {
      if (edge.source === currentNodeId) {
        // Continue traversal if not visited
        if (!visited.has(edge.target)) {
          queue.push(edge.target);
          visited.add(edge.target);
        }
      }
    });
  }
  
  return Array.from(branchNodes);
}

/**
 * Dynamically check if a node is a parent node based on edge patterns
 * This works for both known and unknown node types
 * 
 * @param node - The node to check
 * @param edges - All edges in the workflow
 * @returns True if the node appears to be a parent node
 */
export function isParentNode(node: Node, edges: Edge[]): boolean {
  const nodeId = node.id;
  const nodeType = (node.type || '').toLowerCase();
  
  // Known parent types (hardcoded for performance)
  // loop = Loop-pair anchor (Loop -> End-loop)
  const knownParents = ['agent', 'while', 'foreach', 'ifelse', 'loop'];
  if (knownParents.includes(nodeType)) {
    return true;
  }
  
  // Dynamic detection: Check edge patterns
  // Pattern 1: Has edges with targetHandle 'tool', 'chat-model', or 'memory' (like Agent)
  const hasToolHandle = edges.some(edge => 
    edge.target === nodeId && isAgentBottomInputEdge(edge)
  );
  
  // Pattern 2: Has edges with sourceHandle 'loop' (like While/ForEach)
  const hasLoopHandle = edges.some(edge => 
    edge.source === nodeId && edge.sourceHandle === 'loop'
  );
  
  // Pattern 3: Has edges with sourceHandle 'true' or 'false' (like IfElse)
  const hasBranchHandles = edges.some(edge => 
    edge.source === nodeId && isBranchEdge(edge)
  );
  
  return hasToolHandle || hasLoopHandle || hasBranchHandles;
}

/**
 * Find all child nodes for a given parent node
 * Supports all parent types (Agent, While, ForEach, IfElse) and dynamically detects new types
 * 
 * @param parentNodeId - The ID of the parent node
 * @param parentNodeType - The type of the parent node
 * @param edges - All edges in the workflow
 * @param nodes - All nodes in the workflow
 * @returns Array of child node IDs
 */
export function findAllChildNodes(
  parentNodeId: string,
  parentNodeType: string | undefined,
  edges: Edge[],
  nodes: Node[]
): string[] {
  const childIds: string[] = [];
  const normalizedType = (parentNodeType || '').toLowerCase();
  
  // Handle known parent types
  switch (normalizedType) {
    case 'agent':
      childIds.push(...findToolNodesForAgent(parentNodeId, edges));
      break;
      
    case 'loop': {
      // Loop-pair (Loop -> End-loop): children = body nodes between + end-loop anchor
      const endLoopId = findEndLoopForPair(parentNodeId, nodes);
      if (endLoopId) {
        childIds.push(...findLoopPairBodyNodes(parentNodeId, endLoopId, edges));
        childIds.push(endLoopId);
      }
      break;
    }
      
    case 'while':
    case 'foreach':
      childIds.push(...findLoopBlockNodes(parentNodeId, edges));
      break;
      
    case 'ifelse':
      const trueBranch = findBranchNodes(parentNodeId, 'true', edges);
      const falseBranch = findBranchNodes(parentNodeId, 'false', edges);
      childIds.push(...trueBranch, ...falseBranch);
      break;
      
    default:
      // Dynamic detection for unknown node types
      // Try to detect based on edge patterns
      const parentNode = nodes.find(n => n.id === parentNodeId);
      if (parentNode && isParentNode(parentNode, edges)) {
        // Pattern 1: Tool-like (edges with targetHandle 'tool', 'chat-model', 'memory')
        const toolChildren = findToolNodesForAgent(parentNodeId, edges);
        if (toolChildren.length > 0) {
          childIds.push(...toolChildren);
        }
        
        // Pattern 2: Loop-like (edges with sourceHandle 'loop')
        const loopChildren = findLoopBlockNodes(parentNodeId, edges);
        if (loopChildren.length > 0) {
          childIds.push(...loopChildren);
        }
        
        // Pattern 3: Branch-like (edges with sourceHandle 'true'/'false')
        const trueBranch = findBranchNodes(parentNodeId, 'true', edges);
        const falseBranch = findBranchNodes(parentNodeId, 'false', edges);
        if (trueBranch.length > 0 || falseBranch.length > 0) {
          childIds.push(...trueBranch, ...falseBranch);
        }
      }
      break;
  }
  
  // Remove duplicates
  return Array.from(new Set(childIds));
}

/**
 * Get the complete node group (parent + all children)
 * 
 * @param parentNodeId - The ID of the parent node
 * @param parentNodeType - The type of the parent node
 * @param edges - All edges in the workflow
 * @param nodes - All nodes in the workflow
 * @returns Object with parent ID and array of child IDs
 */
export function getNodeGroup(
  parentNodeId: string,
  parentNodeType: string | undefined,
  edges: Edge[],
  nodes: Node[]
): {
  parentId: string;
  childIds: string[];
  allIds: string[];
} {
  const childIds = findAllChildNodes(parentNodeId, parentNodeType, edges, nodes);
  
  return {
    parentId: parentNodeId,
    childIds,
    allIds: [parentNodeId, ...childIds],
  };
}

/**
 * Check if a node is a child of another node
 * 
 * @param childNodeId - The ID of the potential child node
 * @param potentialParentId - The ID of the potential parent node
 * @param edges - All edges in the workflow
 * @param nodes - All nodes in the workflow
 * @returns True if childNodeId is a child of potentialParentId
 */
export function isChildOf(
  childNodeId: string,
  potentialParentId: string,
  edges: Edge[],
  nodes: Node[]
): boolean {
  const potentialParent = nodes.find(n => n.id === potentialParentId);
  if (!potentialParent) {
    return false;
  }
  
  const childIds = findAllChildNodes(
    potentialParentId,
    potentialParent.type,
    edges,
    nodes
  );
  
  return childIds.includes(childNodeId);
}

/**
 * Find the parent node for a given child node
 * 
 * @param childNodeId - The ID of the child node
 * @param edges - All edges in the workflow
 * @param nodes - All nodes in the workflow
 * @returns The parent node ID, or null if not found
 */
export function findParentNode(
  childNodeId: string,
  edges: Edge[],
  nodes: Node[]
): string | null {
  // Check all nodes to see if any is a parent of this child
  for (const node of nodes) {
    if (isChildOf(childNodeId, node.id, edges, nodes)) {
      return node.id;
    }
  }
  
  return null;
}

