import type { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import { applyLayout as applyLayoutV1 } from './layouts';

export interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

/**
 * Identifies loop-back edges that should be excluded from layout calculation
 */
function isLoopBackEdge(edge: Edge): boolean {
  // Loop-back edges connect to the 'loop-back' handle
  return edge.targetHandle === 'loop-back';
}

/**
 * Identifies loop exit edges
 */
function isLoopExitEdge(edge: Edge): boolean {
  return edge.sourceHandle === 'loop-exit';
}

/**
 * Identifies loop body edges (from loop-body handle)
 */
function isLoopBodyEdge(edge: Edge): boolean {
  return edge.sourceHandle === 'loop-body';
}

/**
 * Identifies agent node bottom input edges (chat-model, memory, tool handles)
 * These edges connect TO the agent node from below and should be excluded from main flow layout
 */
function isAgentBottomInputEdge(edge: Edge): boolean {
  return edge.targetHandle === 'chat-model' || 
         edge.targetHandle === 'memory' || 
         edge.targetHandle === 'tool';
}

/**
 * Finds all nodes that are part of a while loop body
 */
function findLoopBodyNodes(whileNodeId: string, edges: Edge[]): Set<string> {
  const loopBodyNodes = new Set<string>();
  
  // Find the loop-body edge (from while node's bottom handle)
  const loopBodyEdge = edges.find(e => {
    if (e.source !== whileNodeId) return false;
    
    const hasLoopBodyHandle = isLoopBodyEdge(e);
    const isNotLoopExit = !isLoopExitEdge(e);
    const isUndefinedHandle = e.sourceHandle === undefined;
    
    // Match if: explicitly loop-body OR (undefined handle AND not loop-exit)
    return hasLoopBodyHandle || (isUndefinedHandle && isNotLoopExit);
  });
  
  if (!loopBodyEdge) {
    return loopBodyNodes;
  }
  
  // Find the loop-back edge (to while node's left handle)
  const loopBackCandidates = edges.filter(e => e.target === whileNodeId);
  
  // Prefer edges with explicit loop-back handle
  let loopBackEdge = loopBackCandidates.find(e => isLoopBackEdge(e));
  
  // Fallback: If no explicit loop-back handle, find edge from loop body
  if (!loopBackEdge && loopBackCandidates.length > 1) {
    // If there are multiple edges to while, the one WITHOUT targetHandle is likely loop-back
    loopBackEdge = loopBackCandidates.find(e => e.targetHandle === undefined);
  }
  
  if (!loopBackEdge) {
    return loopBodyNodes;
  }
  
  // BFS from loop-body to loop-back source
  const queue = [loopBodyEdge.target];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId) || nodeId === whileNodeId) continue;
    visited.add(nodeId);
    loopBodyNodes.add(nodeId);
    
    // If we reached the loop-back source, stop
    if (nodeId === loopBackEdge.source) continue;
    
    // Find outgoing edges (excluding loop-exit edges)
    edges.forEach(edge => {
      if (edge.source === nodeId && !isLoopExitEdge(edge) && !isLoopBackEdge(edge)) {
        queue.push(edge.target);
      }
    });
  }
  
  return loopBodyNodes;
}

/**
 * Applies automatic layout to nodes using Dagre algorithm
 * Improved to handle loops and branches better
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const {
    direction = 'TB',
    nodeWidth = 220,
    nodeHeight = 100,
    rankSep = 100,
    nodeSep = 80,
  } = options;

  // Find all while nodes and their loop body nodes
  const whileNodes = nodes.filter(n => n.type === 'while');
  const allLoopBodyNodes = new Set<string>();
  const loopBodyNodesByWhile = new Map<string, Set<string>>();
  
  whileNodes.forEach(whileNode => {
    const loopBodyNodes = findLoopBodyNodes(whileNode.id, edges);
    loopBodyNodesByWhile.set(whileNode.id, loopBodyNodes);
    loopBodyNodes.forEach(nodeId => allLoopBodyNodes.add(nodeId));
  });




  // Create a new directed graph for MAIN FLOW ONLY (excluding loop body nodes)
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure graph settings for optimal branch visualization
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
    align: undefined,           // No alignment constraint for better branch distribution
    ranker: 'network-simplex',  // Better algorithm for complex graphs (was 'tight-tree')
    marginx: 40,                // Increased margins for better spacing (was 20)
    marginy: 40,
    acyclicer: 'greedy',        // Handle cycles in graphs (for loops)
    edgesep: 10,                // Space between edges
  });

  // Add ONLY main flow nodes (exclude loop body nodes)
  nodes.forEach((node) => {
    if (!allLoopBodyNodes.has(node.id)) {
      dagreGraph.setNode(node.id, {
        width: nodeWidth,
        height: nodeHeight,
      });
    }
  });

  // Filter edges: exclude loop-back, loop-body edges, agent bottom inputs, and edges between loop body nodes
  const mainFlowEdges = edges.filter((edge) => {
    // Exclude loop-back edges
    if (isLoopBackEdge(edge)) return false;
    // Exclude loop-body edges
    if (isLoopBodyEdge(edge)) return false;
    // Exclude agent node bottom input edges (chat-model, memory, tool)
    // These are vertical connections and should not affect horizontal main flow layout
    if (isAgentBottomInputEdge(edge)) return false;
    // Exclude edges where both source and target are loop body nodes
    if (allLoopBodyNodes.has(edge.source) && allLoopBodyNodes.has(edge.target)) return false;
    // Include only edges where both nodes are in main flow
    return !allLoopBodyNodes.has(edge.source) && !allLoopBodyNodes.has(edge.target);
  });

  // Add main flow edges to graph
  mainFlowEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout for main flow
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    if (allLoopBodyNodes.has(node.id)) {
      // This is a loop body node - we'll position it manually relative to its while node
      // Find the while node it belongs to
      let whileNodeId: string | null = null;
      for (const [wId, bodyNodes] of loopBodyNodesByWhile.entries()) {
        if (bodyNodes.has(node.id)) {
          whileNodeId = wId;
          break;
        }
      }
      
      if (whileNodeId) {
        const whileNodePosition = dagreGraph.node(whileNodeId);
        const bodyNodes = Array.from(loopBodyNodesByWhile.get(whileNodeId) || []);
        const nodeIndex = bodyNodes.indexOf(node.id);
        
        // Position loop body nodes starting BELOW the while node, not centered
        // This prevents overlap with main flow nodes
        const loopBodyStartY = whileNodePosition.y + nodeHeight / 2 + 20; // Start 20px below while node
        
        // Position loop body nodes FAR to the left to avoid any overlap
        const x = whileNodePosition.x - nodeWidth / 2 - 400; // 400px to the left (was 320)
        const y = loopBodyStartY + (nodeIndex * (nodeHeight + 40)); // 40px spacing between nodes
        

        return {
          ...node,
          position: { x, y },
        };
      }
    }
    
    // Main flow node
    const nodeWithPosition = dagreGraph.node(node.id);
    const x = nodeWithPosition.x - nodeWidth / 2;
    const y = nodeWithPosition.y - nodeHeight / 2;
    
    return {
      ...node,
      position: { x, y },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
}

/**
 * FUTURE ENHANCEMENT: Branch-aware positioning
 * 
 * This function can detect branches from Parallel and IfElse nodes for
 * even smarter manual positioning in the future.
 * 
 * Currently, we rely on Dagre's network-simplex algorithm which automatically
 * distributes branches well with our optimized spacing parameters.
 * 
 * Uncomment and use when implementing manual branch positioning:
 * 
 * function findBranchNodes(sourceNodeId: string, sourceHandle: string | undefined, edges: Edge[]): Set<string> {
 *   const branchNodes = new Set<string>();
 *   const visited = new Set<string>();
 *   
 *   const startEdges = edges.filter(e => 
 *     e.source === sourceNodeId && e.sourceHandle === sourceHandle
 *   );
 *   
 *   if (startEdges.length === 0) return branchNodes;
 *   
 *   const queue = startEdges.map(e => e.target);
 *   
 *   while (queue.length > 0) {
 *     const nodeId = queue.shift()!;
 *     if (visited.has(nodeId)) continue;
 *     visited.add(nodeId);
 *     branchNodes.add(nodeId);
 *     
 *     edges.forEach(edge => {
 *       if (edge.source === nodeId && !visited.has(edge.target)) {
 *         queue.push(edge.target);
 *       }
 *     });
 *   }
 *   
 *   return branchNodes;
 * }
 */

/**
 * Applies horizontal layout (Left to Right) - DEFAULT LAYOUT
 * Professional layout optimized for workflow visualization
 * With improved handling for Parallel and IfElse nodes
 * 
 * @deprecated Use applyLayout from './layouts' instead
 * This function is kept for backward compatibility
 */
export function applyHorizontalLayout(nodes: Node[], edges: Edge[]) {
  // Use the new layout system (V1)
  return applyLayoutV1(nodes, edges, 'v1');
}

/**
 * Applies vertical layout (Top to Bottom) - Optimized spacing
 * Professional layout for loops and complex workflows
 */
export function applyVerticalLayout(nodes: Node[], edges: Edge[]) {
  return getLayoutedElements(nodes, edges, {
    direction: 'TB',
    nodeWidth: 220,     // Standard node width
    nodeHeight: 100,    // Standard node height
    rankSep: 100,       // Compact vertical spacing between levels (was 150)
    nodeSep: 120,       // Horizontal spacing between parallel nodes (was 80)
  });
}

