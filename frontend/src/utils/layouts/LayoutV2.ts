/**
 * Layout V2: Agent-Centric Tool Layout
 * 
 * This layout is optimized for workflows with Agent nodes that have tool connections.
 * It positions tool nodes (connected to agent's bottom input handles) vertically
 * below the agent node, making connections cleaner and more organized.
 * 
 * Features:
 * - Agent nodes as anchor points
 * - Tool nodes positioned directly below their agent
 * - Main workflow flow handled by Layout V1 (horizontal)
 * - Clean, non-crossing connections for tools
 */

import type { Node, Edge } from '@xyflow/react';
import type { LayoutStrategy, LayoutStrategyOptions, LayoutResult } from './types';
import { LayoutV1 } from './LayoutV1';

/**
 * Check if an edge connects to an agent's bottom input handle
 */
function isAgentBottomInputEdge(edge: Edge): boolean {
  // Check by edge type (toolEdge) OR by target handle
  return edge.type === 'toolEdge' ||
         edge.targetHandle === 'tool' || 
         edge.targetHandle === 'chat-model' || 
         edge.targetHandle === 'memory';
}

/**
 * Find all agent nodes in the workflow
 */
function findAgentNodes(nodes: Node[]): Node[] {
  return nodes.filter(node => node.type === 'agent');
}

/**
 * Find all tool nodes connected to a specific agent node
 */
function findToolNodesForAgent(agentNode: Node, edges: Edge[], nodes: Node[]): {
  chatModel?: Node;
  memory?: Node;
  tools: Node[];
} {
  const toolEdges = edges.filter(edge => 
    edge.target === agentNode.id && isAgentBottomInputEdge(edge)
  );

  const result: {
    chatModel?: Node;
    memory?: Node;
    tools: Node[];
  } = {
    tools: [],
  };

  for (const edge of toolEdges) {
    const toolNode = nodes.find(n => n.id === edge.source);
    if (!toolNode) continue;

    if (edge.targetHandle === 'chat-model') {
      result.chatModel = toolNode;
    } else if (edge.targetHandle === 'memory') {
      result.memory = toolNode;
    } else if (edge.targetHandle === 'tool') {
      result.tools.push(toolNode);
    }
  }

  return result;
}

/**
 * Layout V2 Implementation
 */
export const LayoutV2: LayoutStrategy = {
  id: 'v2',
  name: 'Agent-Centric Tools',
  description: 'Positions tool nodes vertically below agent nodes for cleaner connections',
  
  apply(nodes: Node[], edges: Edge[], options: LayoutStrategyOptions = {}): LayoutResult {
    const {
      nodeWidth = 220,
      nodeHeight = 100,
      spacing = {},
    } = options;
    
    const agentToolGap = spacing.horizontal ?? 60; // Gap between agent and tools below

    // First, apply Layout V1 to get the main workflow layout
    const v1Result = LayoutV1.apply(nodes, edges, options);
    const layoutedNodes = [...v1Result.nodes];
    const nodeMap = new Map(layoutedNodes.map(n => [n.id, n]));

    // Find all agent nodes
    const agentNodes = findAgentNodes(nodes);

    // For each agent node, position its tools below it
    for (const agentNode of agentNodes) {
      const agentPosition = nodeMap.get(agentNode.id);
      if (!agentPosition) continue;

      // Only process tools that are actual tool nodes (type === 'tool')
      const toolNodes = findToolNodesForAgent(agentNode, edges, nodes);
      
      // Filter out non-tool nodes (safety check)
      const actualToolNodes = {
        chatModel: toolNodes.chatModel?.type === 'tool' ? toolNodes.chatModel : undefined,
        memory: toolNodes.memory?.type === 'tool' ? toolNodes.memory : undefined,
        tools: toolNodes.tools.filter(tool => tool.type === 'tool'),
      };
      
      // Calculate starting Y position for tools (below agent node)
      const agentBottomY = agentPosition.position.y + nodeHeight + agentToolGap;
      const agentCenterX = agentPosition.position.x + (nodeWidth / 2);
      
      // Collect all tools to position them in a vertical column below the agent
      const allTools: Array<{ node: Node; handle: string }> = [];
      
      if (actualToolNodes.chatModel) {
        allTools.push({ node: actualToolNodes.chatModel, handle: 'chat-model' });
      }
      if (actualToolNodes.memory) {
        allTools.push({ node: actualToolNodes.memory, handle: 'memory' });
      }
      actualToolNodes.tools.forEach(tool => {
        allTools.push({ node: tool, handle: 'tool' });
      });

      // Position all tools vertically below the agent, centered
      // If multiple tools, distribute them horizontally with slight offset
      // BUT: If tool already has a relative position stored, respect it
      allTools.forEach((toolInfo, index) => {
        const toolNodeInMap = nodeMap.get(toolInfo.node.id);
        if (!toolNodeInMap) return;

        // Check if tool already has a relative position (user has positioned it manually)
        const existingRelativePos = toolNodeInMap.data?.agentRelativePosition;
        const hasRelativePosition =
          existingRelativePos &&
          typeof existingRelativePos === 'object' &&
          typeof (existingRelativePos as any).x === 'number' &&
          typeof (existingRelativePos as any).y === 'number';
        
        if (hasRelativePosition) {
          const rel = existingRelativePos as { x: number; y: number };
          // User has manually positioned this tool - maintain relative position
          toolNodeInMap.position = {
            x: agentPosition.position.x + rel.x,
            y: agentPosition.position.y + rel.y,
          };
        } else {
          // No manual positioning yet - set initial position below agent
          // Calculate horizontal offset for multiple tools
          // Center them around the agent's center X
          const totalTools = allTools.length;
          const toolWidth = nodeWidth;
          const horizontalSpacing = toolWidth + 20;
          const totalWidth = (totalTools - 1) * horizontalSpacing;
          const startX = agentCenterX - (totalWidth / 2);
          
          const toolX = startX + (index * horizontalSpacing) - (toolWidth / 2);
          const toolY = agentBottomY;

          const absolutePos = { x: toolX, y: toolY };
          const relativePos = {
            x: toolX - agentPosition.position.x,
            y: toolY - agentPosition.position.y,
          };

          toolNodeInMap.position = absolutePos;
          // Store relative position for future agent moves
          toolNodeInMap.data = {
            ...toolNodeInMap.data,
            agentRelativePosition: relativePos,
          };
        }
      });
    }

    return {
      nodes: layoutedNodes,
      edges: v1Result.edges,
    };
  },
};

