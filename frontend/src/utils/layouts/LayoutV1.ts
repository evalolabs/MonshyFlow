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

// Helper functions
function isAgentBottomInputEdge(edge: Edge): boolean {
  // Check by target handle OR by edge type (toolEdge)
  return edge.type === 'toolEdge' ||
         edge.targetHandle === 'chat-model' || 
         edge.targetHandle === 'memory' || 
         edge.targetHandle === 'tool';
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

    // Add nodes (exclude tool nodes and tools with relative positions)
    nodes.forEach((node) => {
      if (!isToolNode(node) && !isToolWithRelativePosition(node, edges)) {
        dagreGraph.setNode(node.id, {
          width: nodeWidth,
          height: nodeHeight,
        });
      }
    });

    // Filter edges: exclude agent bottom inputs and edges from tools with relative positions
    const mainFlowEdges = edges.filter((edge) => {
      if (isAgentBottomInputEdge(edge)) return false;
      
      // Exclude tool edges and edges from tool nodes
      if (edge.type === 'toolEdge') return false;
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode && (isToolNode(sourceNode) || isToolWithRelativePosition(sourceNode, edges))) return false;
      
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

