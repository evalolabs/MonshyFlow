/**
 * useAgentToolPositioning Hook
 * 
 * Manages relative positioning of tool nodes to their agent node.
 * When an agent node is moved, all connected tools move with it maintaining their relative positions.
 * Users can manually position tools, and the relative position is preserved.
 */

import { useEffect, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface UseAgentToolPositioningProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
}

/**
 * Check if an edge connects to an agent's bottom input handle (tool handle)
 */
function isAgentBottomInputEdge(edge: Edge): boolean {
  return edge.targetHandle === 'tool';
}

/**
 * Find all tool nodes connected to a specific agent node
 */
function findToolNodesForAgent(agentNodeId: string, edges: Edge[], allNodes: Node[]): Node[] {
  const toolEdges = edges.filter(edge => 
    edge.target === agentNodeId && isAgentBottomInputEdge(edge)
  );

  return toolEdges
    .map(edge => allNodes.find(n => n.id === edge.source))
    .filter((node): node is Node => node !== undefined);
}

/**
 * Get or calculate relative position of a tool node to its agent
 */
function getRelativePosition(toolNode: Node, agentNode: Node): { x: number; y: number } {
  // Check if relative position is already stored in node data
  const storedPos = toolNode.data?.agentRelativePosition;
  if (storedPos && typeof storedPos === 'object' && 'x' in storedPos && 'y' in storedPos) {
    const x = typeof storedPos.x === 'number' ? storedPos.x : 0;
    const y = typeof storedPos.y === 'number' ? storedPos.y : 0;
    return { x, y };
  }

  // Calculate relative position from current positions
  return {
    x: toolNode.position.x - agentNode.position.x,
    y: toolNode.position.y - agentNode.position.y,
  };
}

/**
 * Store relative position in node data
 */
function storeRelativePosition(node: Node, relativePos: { x: number; y: number }): Node {
  return {
    ...node,
    data: {
      ...node.data,
      agentRelativePosition: relativePos,
    },
  };
}

export function useAgentToolPositioning({
  nodes,
  edges,
  onNodesChange,
}: UseAgentToolPositioningProps) {
  const previousAgentPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const previousToolPositionsRef = useRef<Map<string, { x: number; y: number; agentId: string }>>(new Map());

  useEffect(() => {
    // Find all agent nodes
    const agentNodes = nodes.filter(node => node.type === 'agent');

    // Track which agents moved
    const movedAgents: Array<{ node: Node; deltaX: number; deltaY: number }> = [];

    for (const agentNode of agentNodes) {
      const previousPos = previousAgentPositionsRef.current.get(agentNode.id);
      const currentPos = agentNode.position;

      if (previousPos) {
        const deltaX = currentPos.x - previousPos.x;
        const deltaY = currentPos.y - previousPos.y;

        // If agent moved (more than 1px to account for floating point precision)
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
          movedAgents.push({ node: agentNode, deltaX, deltaY });
        }
      }

      // Update stored position
      previousAgentPositionsRef.current.set(agentNode.id, { ...currentPos });
    }

    // Track which tools moved (manually by user)
    const movedTools: Array<{ node: Node; agentId: string }> = [];

    for (const agentNode of agentNodes) {
      const toolNodes = findToolNodesForAgent(agentNode.id, edges, nodes);
      
      for (const toolNode of toolNodes) {
        const previousToolPos = previousToolPositionsRef.current.get(toolNode.id);
        const currentToolPos = toolNode.position;

        if (previousToolPos && previousToolPos.agentId === agentNode.id) {
          const deltaX = currentToolPos.x - previousToolPos.x;
          const deltaY = currentToolPos.y - previousToolPos.y;

          // If tool moved (and it's not because agent moved)
          const agentMoved = movedAgents.some(m => m.node.id === agentNode.id);
          if (!agentMoved && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
            movedTools.push({ node: toolNode, agentId: agentNode.id });
          }
        }

        // Update stored tool position
        previousToolPositionsRef.current.set(toolNode.id, {
          ...currentToolPos,
          agentId: agentNode.id,
        });
      }
    }

    // If any agents moved, update their tool positions
    if (movedAgents.length > 0) {
      const updatedNodes = nodes.map(node => {
        // Check if this node is a tool connected to a moved agent
        for (const { node: agentNode, deltaX, deltaY } of movedAgents) {
          const toolNodes = findToolNodesForAgent(agentNode.id, edges, nodes);
          
          if (toolNodes.some(tool => tool.id === node.id)) {
            // This is a tool for a moved agent - move it by the same delta
            return {
              ...node,
              position: {
                x: node.position.x + deltaX,
                y: node.position.y + deltaY,
              },
            };
          }
        }
        return node;
      });

      onNodesChange(updatedNodes);
    }

    // If tools were moved manually, update their relative positions
    if (movedTools.length > 0) {
      const updatedNodes = nodes.map(node => {
        const movedTool = movedTools.find(mt => mt.node.id === node.id);
        if (movedTool) {
          const agentNode = nodes.find(n => n.id === movedTool.agentId);
          if (agentNode) {
            const relativePos = getRelativePosition(node, agentNode);
            return storeRelativePosition(node, relativePos);
          }
        }
        return node;
      });

      onNodesChange(updatedNodes);
      return; // Don't continue with other updates in this cycle
    }

    // Store relative positions for all tool nodes (if not already stored)
    const nodesNeedingRelativePos = nodes.filter(node => {
      // Check if this is a tool node
      const isTool = edges.some(edge => 
        edge.source === node.id && isAgentBottomInputEdge(edge)
      );
      
      if (!isTool) return false;

      // Check if relative position is not stored
      return !node.data?.agentRelativePosition;
    });

    if (nodesNeedingRelativePos.length > 0) {
      const updatedNodes = nodes.map(node => {
        if (nodesNeedingRelativePos.some(n => n.id === node.id)) {
          // Find the agent this tool is connected to
          const toolEdge = edges.find(edge => 
            edge.source === node.id && isAgentBottomInputEdge(edge)
          );
          
          if (toolEdge) {
            const agentNode = nodes.find(n => n.id === toolEdge.target);
            if (agentNode) {
              const relativePos = getRelativePosition(node, agentNode);
              return storeRelativePosition(node, relativePos);
            }
          }
        }
        return node;
      });

      onNodesChange(updatedNodes);
    }
  }, [nodes, edges, onNodesChange]);
}

