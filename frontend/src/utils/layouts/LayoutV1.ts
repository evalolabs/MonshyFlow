/**
 * Layout V1: Horizontal Flow (Left to Right)
 * 
 * This is the current default layout - optimized for sequential workflows.
 * Nodes are arranged horizontally from left to right, with branches distributed vertically.
 * 
 * Features:
 * - Horizontal main flow (LR direction)
 * - Intelligent branch distribution
 * - Special handling for While loops (loop body nodes positioned to the left)
 * - Agent node bottom inputs excluded from main flow
 * - Optimized spacing for parallel branches
 */

import type { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import type { LayoutStrategy, LayoutStrategyOptions, LayoutResult } from './types';

// Helper functions (same as before, but now scoped to this layout)
function isLoopBackEdge(edge: Edge): boolean {
  return edge.targetHandle === 'loop-back';
}

function isLoopExitEdge(edge: Edge): boolean {
  return edge.sourceHandle === 'loop-exit';
}

function isLoopBodyEdge(edge: Edge): boolean {
  return edge.sourceHandle === 'loop-body';
}

function isAgentBottomInputEdge(edge: Edge): boolean {
  // Check by target handle OR by edge type (toolEdge)
  return edge.type === 'toolEdge' ||
         edge.targetHandle === 'chat-model' || 
         edge.targetHandle === 'memory' || 
         edge.targetHandle === 'tool';
}

function findLoopBodyNodes(whileNodeId: string, edges: Edge[]): Set<string> {
  const loopBodyNodes = new Set<string>();
  
  const loopBodyEdge = edges.find(e => {
    if (e.source !== whileNodeId) return false;
    const hasLoopBodyHandle = isLoopBodyEdge(e);
    const isNotLoopExit = !isLoopExitEdge(e);
    const isUndefinedHandle = e.sourceHandle === undefined;
    return hasLoopBodyHandle || (isUndefinedHandle && isNotLoopExit);
  });
  
  if (!loopBodyEdge) {
    return loopBodyNodes;
  }
  
  const loopBackCandidates = edges.filter(e => e.target === whileNodeId);
  let loopBackEdge = loopBackCandidates.find(e => isLoopBackEdge(e));
  
  if (!loopBackEdge && loopBackCandidates.length > 1) {
    loopBackEdge = loopBackCandidates.find(e => e.targetHandle === undefined);
  }
  
  if (!loopBackEdge) {
    return loopBodyNodes;
  }
  
  const queue = [loopBodyEdge.target];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId) || nodeId === whileNodeId) continue;
    visited.add(nodeId);
    loopBodyNodes.add(nodeId);
    
    if (nodeId === loopBackEdge!.source) continue;
    
    edges.forEach(edge => {
      if (edge.source === nodeId && !isLoopExitEdge(edge) && !isLoopBackEdge(edge)) {
        queue.push(edge.target);
      }
    });
  }
  
  return loopBodyNodes;
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
      rankdir: 'LR',              // Left to Right (horizontal)
      ranksep: rankSep,
      nodesep: nodeSep,
      align: undefined,           // No alignment constraint for better branch distribution
      ranker: 'network-simplex',  // Better algorithm for complex graphs
      marginx: 40,                // Increased margins for better spacing
      marginy: 40,
      acyclicer: 'greedy',        // Handle cycles in graphs (for loops)
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

    // Add ONLY main flow nodes (exclude loop body nodes, tool nodes, and tools with relative positions)
    nodes.forEach((node) => {
      if (!allLoopBodyNodes.has(node.id) && !isToolNode(node) && !isToolWithRelativePosition(node, edges)) {
        dagreGraph.setNode(node.id, {
          width: nodeWidth,
          height: nodeHeight,
        });
      }
    });

    // Filter edges: exclude loop-back, loop-body edges, agent bottom inputs, edges from tools with relative positions, and edges between loop body nodes
    const mainFlowEdges = edges.filter((edge) => {
      if (isLoopBackEdge(edge)) return false;
      if (isLoopBodyEdge(edge)) return false;
      if (isAgentBottomInputEdge(edge)) return false;
      
      // Exclude tool edges and edges from tool nodes
      if (edge.type === 'toolEdge') return false;
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode && (isToolNode(sourceNode) || isToolWithRelativePosition(sourceNode, edges))) return false;
      
      if (allLoopBodyNodes.has(edge.source) && allLoopBodyNodes.has(edge.target)) return false;
      return !allLoopBodyNodes.has(edge.source) && !allLoopBodyNodes.has(edge.target);
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

      if (allLoopBodyNodes.has(node.id)) {
        // This is a loop body node - position it manually relative to its while node
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
          
          // Position loop body nodes starting BELOW the while node
          const loopBodyStartY = whileNodePosition.y + nodeHeight / 2 + 20;
          
          // Position loop body nodes FAR to the left to avoid overlap
          const x = whileNodePosition.x - nodeWidth / 2 - 400;
          const y = loopBodyStartY + (nodeIndex * (nodeHeight + 40));

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
  },
};

