/**
 * Layout V1: Horizontal Flow (Left to Right)
 * 
 * This is the current default layout - optimized for sequential workflows.
 * Nodes are arranged horizontally from left to right, with branches distributed vertically.
 * 
 * Features:
 * - Horizontal main flow (LR direction)
 * - Intelligent branch distribution
 * - Agent node bottom inputs excluded from main flow
 * - Optimized spacing for parallel branches
 */

import type { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import type { LayoutStrategy, LayoutStrategyOptions, LayoutResult } from './types';
import { EDGE_TYPE_LOOP, isLoopHandle, NODE_TYPE_WHILE, LOOP_HANDLE_IDS } from '../../components/WorkflowBuilder/constants';

// Helper functions
function isAgentBottomInputEdge(edge: Edge): boolean {
  // Check by target handle OR by edge type (toolEdge)
  return edge.type === 'toolEdge' ||
         edge.targetHandle === 'chat-model' || 
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
 * Find all nodes that are inside a while loop
 * Returns a map: whileNodeId -> Array of nodeIds inside that loop (in order)
 * Uses BFS to find all nodes connected via loop edges
 */
function findLoopNodes(nodes: Node[], edges: Edge[]): Map<string, string[]> {
  const loopMap = new Map<string, string[]>();
  
  // Find all while nodes
  const whileNodes = nodes.filter(node => node.type === NODE_TYPE_WHILE);
  
  for (const whileNode of whileNodes) {
    const loopNodes: string[] = [];
    const visited = new Set<string>();
    const queue: string[] = [];
    
    // Find nodes connected via 'loop' handle (forward direction)
    const loopEdges = edges.filter(edge => 
      edge.source === whileNode.id && 
      edge.sourceHandle === LOOP_HANDLE_IDS.LOOP
    );
    
    // Start BFS from nodes connected to the loop handle
    for (const loopEdge of loopEdges) {
      if (!visited.has(loopEdge.target)) {
        queue.push(loopEdge.target);
        visited.add(loopEdge.target);
        loopNodes.push(loopEdge.target);
      }
    }
    
    // BFS to find all nodes in the loop
    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      
      // Find outgoing edges from this node
      const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
      
      for (const edge of outgoingEdges) {
        // If this edge loops back to the while node, skip it
        if (edge.target === whileNode.id && 
            (edge.targetHandle === LOOP_HANDLE_IDS.BACK || isLoopHandle(edge.targetHandle))) {
          continue;
        }
        
        // If it's a loop edge or a normal edge within the loop, add the target
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          loopNodes.push(edge.target);
          queue.push(edge.target);
        }
      }
    }
    
    if (loopNodes.length > 0) {
      loopMap.set(whileNode.id, loopNodes);
    }
  }
  
  return loopMap;
}

/**
 * Layout V1 Implementation
 */
export const LayoutV1: LayoutStrategy = {
  id: 'v1',
  name: 'Horizontal Flow',
  description: 'Sequential workflow layout from left to right with intelligent branch distribution',
  
  apply(nodes: Node[], edges: Edge[], options: LayoutStrategyOptions = {}): LayoutResult {
    const {
      nodeWidth = 220,
      nodeHeight = 100,
      spacing = {},
    } = options;
    
    const rankSep = spacing.horizontal ?? 180;  // Horizontal spacing between levels
    const nodeSep = spacing.vertical ?? 120;   // Vertical spacing between parallel nodes

    // Create a new directed graph
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Configure graph settings for optimal branch visualization
    dagreGraph.setGraph({
      rankdir: 'LR',              // Left to Right (horizontal)
      ranksep: rankSep,
      nodesep: nodeSep,
      align: undefined,           // No alignment constraint for better branch distribution
      ranker: 'network-simplex',  // Better algorithm for complex graphs
      marginx: 40,                // Increased margins for better spacing
      marginy: 40,
      acyclicer: 'greedy',        // Handle cycles in graphs
      edgesep: 10,                // Space between edges
    });

    // Helper: Check if node is a tool node (should be excluded from dagre layout)
    function isToolNode(node: Node): boolean {
      return node.type === 'tool';
    }

    // Helper: Check if node is a tool with relative position (should be excluded from dagre layout)
    function isToolWithRelativePosition(node: Node, edges: Edge[]): boolean {
      return !!node.data?.agentRelativePosition && edges.some(edge => 
        edge.source === node.id && 
        (edge.type === 'toolEdge' || edge.targetHandle === 'tool' || edge.targetHandle === 'chat-model' || edge.targetHandle === 'memory')
      );
    }

    // Find all nodes inside loops (to exclude them from main layout)
    const loopMap = findLoopNodes(nodes, edges);
    const loopNodeSet = new Set<string>();
    for (const loopNodes of loopMap.values()) {
      loopNodes.forEach(nodeId => loopNodeSet.add(nodeId));
    }

    // Add nodes (exclude tool nodes, tools with relative positions, and loop nodes)
    // Loop nodes will be positioned separately after main layout
    nodes.forEach((node) => {
      if (!isToolNode(node) && 
          !isToolWithRelativePosition(node, edges) &&
          !loopNodeSet.has(node.id)) {
        dagreGraph.setNode(node.id, {
          width: nodeWidth,
          height: nodeHeight,
        });
      }
    });

    // Filter edges: exclude agent bottom inputs, tool edges, and loop edges
    const mainFlowEdges = edges.filter((edge) => {
      if (isAgentBottomInputEdge(edge)) return false;
      
      // Exclude tool edges and edges from tool nodes
      if (edge.type === 'toolEdge') return false;
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode && (isToolNode(sourceNode) || isToolWithRelativePosition(sourceNode, edges))) return false;
      
      // Exclude loop edges (while loop connections)
      // These create cycles and should not affect the main flow layout
      if (isLoopEdge(edge)) return false;
      
      // Exclude edges that connect to or from loop nodes
      if (loopNodeSet.has(edge.source) || loopNodeSet.has(edge.target)) return false;
      
      return true;
    });

    // Add main flow edges to graph
    mainFlowEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate layout for main flow
    dagre.layout(dagreGraph);

    // Helper: Get tool relative position info (for positioning after dagre layout)
    function getToolRelativeInfo(node: Node, edges: Edge[]): { agentId: string; relativePos: { x: number; y: number } } | null {
      const relativePos = node.data?.agentRelativePosition;
      if (!relativePos || typeof relativePos !== 'object') return null;
      const relX = (relativePos as any).x;
      const relY = (relativePos as any).y;
      if (typeof relX !== 'number' || typeof relY !== 'number') {
        return null;
      }

      // Find the agent this tool is connected to
      const toolEdge = edges.find(edge => 
        edge.source === node.id && 
        (edge.targetHandle === 'tool' || edge.targetHandle === 'chat-model' || edge.targetHandle === 'memory')
      );
      
      if (toolEdge) {
        return { agentId: toolEdge.target, relativePos: { x: relX, y: relY } };
      }
      
      return null;
    }

    // Apply calculated positions to nodes
    const layoutedNodes = nodes.map((node) => {
      // CRITICAL: Preserve ALL tool nodes' positions - they should NEVER be moved by auto-layout
      if (isToolNode(node) || isToolWithRelativePosition(node, edges)) {
        // Tool nodes are completely excluded from auto-layout - keep their current position
        return node; // Return unchanged - preserve exact position
      }
      
      // Check if this is a tool node with relative position - preserve it
      const toolRelativeInfo = getToolRelativeInfo(node, edges);
      if (toolRelativeInfo) {
        // Find the agent node's position from dagre layout
        const agentNodePosition = dagreGraph.node(toolRelativeInfo.agentId);
        if (agentNodePosition) {
          // Calculate absolute position based on agent position + relative position
          const x = agentNodePosition.x - nodeWidth / 2 + toolRelativeInfo.relativePos.x;
          const y = agentNodePosition.y - nodeHeight / 2 + toolRelativeInfo.relativePos.y;
          
          return {
            ...node,
            position: { x, y },
          };
        }
      }

      // Check if this node is inside a loop - position it relative to the while node
      let whileNodeId: string | null = null;
      for (const [wId, loopNodes] of loopMap.entries()) {
        if (loopNodes.includes(node.id)) {
          whileNodeId = wId;
          break;
        }
      }
      
      if (whileNodeId) {
        // This is a loop node - position it relative to the while node
        const whileNodePosition = dagreGraph.node(whileNodeId);
        if (whileNodePosition) {
          const loopNodes = loopMap.get(whileNodeId) || [];
          const nodeIndex = loopNodes.indexOf(node.id);
          
          // Position loop nodes in a stair-step layout (diagonal down-right)
          // This prevents overlapping when multiple loops exist
          // Each node is positioned slightly to the right and down from the previous one
          const x = whileNodePosition.x + (nodeIndex * (nodeWidth + 50)); // Horizontal spacing
          const y = whileNodePosition.y + nodeHeight + 150 + (nodeIndex * 60); // Stair-step: each node goes further down
          
          return {
            ...node,
            position: { 
              x: x - nodeWidth / 2, 
              y: y - nodeHeight / 2 
            },
          };
        }
      }

      // Main flow node
      const nodeWithPosition = dagreGraph.node(node.id);
      if (!nodeWithPosition) {
        // Node not in graph (shouldn't happen, but fallback)
        return node;
      }
      
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
  },
};

