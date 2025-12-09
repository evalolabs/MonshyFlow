/**
 * useNodeOperations Hook
 * 
 * Handles all node operations: add, delete, duplicate, update.
 * Includes validation and confirmation dialogs.
 */

import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import {
  hasStartNode,
  isStartNode,
  canBeDuplicated,
  createNode,
  generateNodeId,
} from '../../../utils/nodeUtils';
import {
  findConnectedEdges,
  createReconnectionEdges,
} from '../../../utils/edgeUtils';
import { VALIDATION_MESSAGES } from '../constants';
import { nodeLogger as logger } from '../../../utils/logger';

interface UseNodeOperationsProps {
  nodes: Node[];
  edges: Edge[];
  workflowId?: string;
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onAddNodeCallback: (edgeId: string, source: string, target: string) => void;
  deleteNodeFromBackend?: (workflowId: string, nodeId: string) => Promise<void>;
}

export function useNodeOperations({
  nodes,
  edges,
  workflowId,
  onNodesChange,
  onEdgesChange,
  onAddNodeCallback,
  deleteNodeFromBackend,
}: UseNodeOperationsProps) {
  
  // Add a new node
  const addNode = useCallback((type: string, position?: { x: number; y: number }) => {
    logger.info(`Adding node of type: ${type}`);

    // Validate Start node
    if (type === 'start' && hasStartNode(nodes)) {
      alert(VALIDATION_MESSAGES.MULTIPLE_START_NODES);
      logger.warn('Prevented adding second Start node');
      return null;
    }

    const newNode = createNode(type, position);
    
    onNodesChange([...nodes, newNode]);
    logger.info(`Node added: ${newNode.id}`);

    return newNode;
  }, [nodes, edges, onNodesChange, onEdgesChange]);

  // Delete a node
  const deleteNode = useCallback(async (nodeId: string) => {
    logger.info(`Deleting node: ${nodeId}`);

    const nodeToDelete = nodes.find(n => n.id === nodeId);

    // Confirm deletion of Start node
    if (isStartNode(nodeToDelete)) {
      const confirmed = window.confirm(VALIDATION_MESSAGES.CONFIRM_DELETE_START);
      if (!confirmed) {
        logger.info('Start node deletion cancelled by user');
        return;
      }
    }

    try {
      // Find connected edges
      const { incoming, outgoing } = findConnectedEdges(edges, nodeId);
      
      logger.debug(`Node has ${incoming.length} incoming and ${outgoing.length} outgoing edges`);

      // Delete from backend if workflowId exists
      if (workflowId && deleteNodeFromBackend) {
        await deleteNodeFromBackend(workflowId, nodeId);
        logger.info('Node deleted from backend');
      }

      // Delete from local state
      const updatedNodes = nodes.filter(node => node.id !== nodeId);
      onNodesChange(updatedNodes);

      // Update edges: remove old ones and create reconnections
      const filteredEdges = edges.filter(
        edge => edge.source !== nodeId && edge.target !== nodeId
      );

      // Create reconnection edges
      const reconnectionEdges = createReconnectionEdges(
        incoming,
        outgoing,
        filteredEdges,
        onAddNodeCallback
      );

      logger.debug(`Created ${reconnectionEdges.length} reconnection edges`);
      onEdgesChange([...filteredEdges, ...reconnectionEdges]);

      logger.info('Node deleted successfully with automatic reconnection');
    } catch (error) {
      logger.error('Failed to delete node', error);
      alert(VALIDATION_MESSAGES.DELETE_NODE_FAILED);
    }
  }, [nodes, edges, workflowId, onNodesChange, onEdgesChange, onAddNodeCallback, deleteNodeFromBackend]);

  // Duplicate a node
  const duplicateNode = useCallback((node: Node) => {
    logger.info(`Duplicating node: ${node.id}`);

    if (!canBeDuplicated(node.type || '')) {
      alert(VALIDATION_MESSAGES.CANNOT_DUPLICATE_START);
      logger.warn('Prevented duplicating Start node');
      return;
    }

    const newNode: Node = {
      ...node,
      id: generateNodeId(node.type || 'node'),
      position: {
        x: node.position.x + 200,
        y: node.position.y + 100,
      },
      selected: true,
      data: {
        ...node.data,
        label: `${node.data?.label || node.type} (Copy)`,
      },
    };

    // Deselect all other nodes and add the new one
    const updatedNodes = nodes.map(n => ({ ...n, selected: false }));
    onNodesChange([...updatedNodes, newNode]);

    logger.info(`Node duplicated: ${newNode.id}`);
  }, [nodes, onNodesChange]);

  // Update node data
  const updateNode = useCallback((nodeId: string, data: any) => {
    logger.debug(`Updating node: ${nodeId}`);
    
    const updatedNodes = nodes.map(node =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    );
    
    onNodesChange(updatedNodes);
  }, [nodes, onNodesChange]);

  return {
    addNode,
    deleteNode,
    duplicateNode,
    updateNode,
  };
}


