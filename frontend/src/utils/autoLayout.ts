import type { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import { applyLayout as applyLayoutV1 } from './layouts';
import { EDGE_TYPE_LOOP, isLoopHandle } from '../components/WorkflowBuilder/constants';

export interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
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
 * Identifies loop edges (while loop connections)
 * These edges connect loop handles and should be excluded from main flow layout
 * to prevent cycles from disrupting the layout algorithm
 */
function isLoopEdge(edge: Edge): boolean {
  // Check by edge type OR by handle IDs
  return edge.type === EDGE_TYPE_LOOP ||
         isLoopHandle(edge.sourceHandle) ||
         isLoopHandle(edge.targetHandle);
}

/**
 * Applies automatic layout to nodes using Dagre algorithm
 * Improved to handle branches better
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

  // Create a new directed graph
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
    acyclicer: 'greedy',        // Handle cycles in graphs
    edgesep: 10,                // Space between edges
  });

  // Add all nodes
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  // Filter edges: exclude agent bottom inputs and loop edges
  const mainFlowEdges = edges.filter((edge) => {
    // Exclude agent node bottom input edges (chat-model, memory, tool)
    // These are vertical connections and should not affect horizontal main flow layout
    if (isAgentBottomInputEdge(edge)) return false;
    
    // Exclude loop edges (while loop connections)
    // These create cycles and should not affect the main flow layout
    if (isLoopEdge(edge)) return false;
    
    return true;
  });

  // Add main flow edges to graph
  mainFlowEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout for main flow
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
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
 * Professional layout for complex workflows
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

