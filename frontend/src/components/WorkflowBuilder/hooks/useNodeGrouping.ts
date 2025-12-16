/**
 * useNodeGrouping Hook
 * 
 * Generic hook for managing parent-child relationships between nodes.
 * Supports:
 * - Agent + Tools
 * - While/ForEach + Loop-Block
 * - IfElse + Branches
 * - Dynamic detection for new/unknown node types
 * 
 * When a parent node is moved, all child nodes move with it maintaining their relative positions.
 * Users can manually position child nodes, and the relative position is preserved.
 * 
 * This hook extends/replaces useAgentToolPositioning to support all node grouping types.
 */

import { useEffect, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import {
  findAllChildNodes,
  isParentNode,
} from '../../../utils/nodeGroupingUtils';

interface UseNodeGroupingProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
}

/**
 * Get or calculate relative position of a child node to its parent
 */
function getRelativePosition(childNode: Node, parentNode: Node): { x: number; y: number } {
  // Check if relative position is already stored in node data
  const storedPos = childNode.data?.parentRelativePosition;
  if (storedPos && typeof storedPos === 'object' && 'x' in storedPos && 'y' in storedPos) {
    const x = typeof storedPos.x === 'number' ? storedPos.x : 0;
    const y = typeof storedPos.y === 'number' ? storedPos.y : 0;
    return { x, y };
  }

  // Calculate relative position from current positions
  return {
    x: childNode.position.x - parentNode.position.x,
    y: childNode.position.y - parentNode.position.y,
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
      parentRelativePosition: relativePos,
    },
  };
}

/**
 * Hook to manage node grouping (parent-child relationships)
 * 
 * Features:
 * - Automatically moves children when parent is moved
 * - Preserves relative positions when children are manually moved
 * - Supports all parent types (Agent, While, ForEach, IfElse, and dynamically detected types)
 */
export function useNodeGrouping({
  nodes,
  edges,
  onNodesChange,
}: UseNodeGroupingProps) {
  // Track previous positions to detect movement
  const previousParentPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const previousChildPositionsRef = useRef<Map<string, { x: number; y: number; parentId: string }>>(new Map());

  useEffect(() => {
    // Find all parent nodes (dynamically detected)
    const parentNodes = nodes.filter(node => isParentNode(node, edges));

    // Track which parents moved
    const movedParents: Array<{ node: Node; deltaX: number; deltaY: number }> = [];

    for (const parentNode of parentNodes) {
      const previousPos = previousParentPositionsRef.current.get(parentNode.id);
      const currentPos = parentNode.position;

      if (previousPos) {
        const deltaX = currentPos.x - previousPos.x;
        const deltaY = currentPos.y - previousPos.y;

        // If parent moved (more than 1px to account for floating point precision)
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
          movedParents.push({ node: parentNode, deltaX, deltaY });
        }
      }

      // Update stored position
      previousParentPositionsRef.current.set(parentNode.id, { ...currentPos });
    }

    // Track which children moved (manually by user)
    const movedChildren: Array<{ node: Node; parentId: string }> = [];

    for (const parentNode of parentNodes) {
      const childIds = findAllChildNodes(parentNode.id, parentNode.type, edges, nodes);
      const childNodes = nodes.filter(n => childIds.includes(n.id));
      
      for (const childNode of childNodes) {
        const previousChildPos = previousChildPositionsRef.current.get(childNode.id);
        const currentChildPos = childNode.position;

        if (previousChildPos && previousChildPos.parentId === parentNode.id) {
          const deltaX = currentChildPos.x - previousChildPos.x;
          const deltaY = currentChildPos.y - previousChildPos.y;

          // If child moved (and it's not because parent moved)
          const parentMoved = movedParents.some(m => m.node.id === parentNode.id);
          if (!parentMoved && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
            movedChildren.push({ node: childNode, parentId: parentNode.id });
          }
        }

        // Update stored child position
        previousChildPositionsRef.current.set(childNode.id, {
          ...currentChildPos,
          parentId: parentNode.id,
        });
      }
    }

    // If any parents moved, update their children's positions
    if (movedParents.length > 0) {
      const updatedNodes = nodes.map(node => {
        // Check if this node is a child of a moved parent
        for (const { node: parentNode, deltaX, deltaY } of movedParents) {
          const childIds = findAllChildNodes(parentNode.id, parentNode.type, edges, nodes);
          
          if (childIds.includes(node.id)) {
            // This is a child of a moved parent - move it by the same delta
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

    // If children were moved manually, update their relative positions
    if (movedChildren.length > 0) {
      const updatedNodes = nodes.map(node => {
        const movedChild = movedChildren.find(mc => mc.node.id === node.id);
        if (movedChild) {
          const parentNode = nodes.find(n => n.id === movedChild.parentId);
          if (parentNode) {
            const relativePos = getRelativePosition(node, parentNode);
            return storeRelativePosition(node, relativePos);
          }
        }
        return node;
      });

      onNodesChange(updatedNodes);
      return; // Don't continue with other updates in this cycle
    }

    // Store relative positions for all child nodes (if not already stored)
    const nodesNeedingRelativePos = nodes.filter(node => {
      // Check if this is a child node
      for (const parentNode of parentNodes) {
        const childIds = findAllChildNodes(parentNode.id, parentNode.type, edges, nodes);
        if (childIds.includes(node.id)) {
          // Check if relative position is not stored
          return !node.data?.parentRelativePosition;
        }
      }
      return false;
    });

    if (nodesNeedingRelativePos.length > 0) {
      const updatedNodes = nodes.map(node => {
        if (nodesNeedingRelativePos.some(n => n.id === node.id)) {
          // Find the parent this child is connected to
          for (const parentNode of parentNodes) {
            const childIds = findAllChildNodes(parentNode.id, parentNode.type, edges, nodes);
            if (childIds.includes(node.id)) {
              const relativePos = getRelativePosition(node, parentNode);
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


