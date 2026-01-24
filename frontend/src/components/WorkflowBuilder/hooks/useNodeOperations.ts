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
  findToolNodesConnectedToAgent,
  generateEdgeId,
} from '../../../utils/edgeUtils';
import { findAllChildNodes } from '../../../utils/nodeGroupingUtils';
import { VALIDATION_MESSAGES } from '../constants';
import { nodeLogger as logger } from '../../../utils/logger';
import { openaiVectorStoresService, openaiFilesService } from '../../../services/openaiFilesService';
import { useCurrentUserTenantId } from '../../../utils/permissions';

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
  const tenantId = useCurrentUserTenantId();
  
  // Helper function to cleanup resources for tool nodes when they are deleted
  const cleanupToolNodeResources = useCallback(async (node: Node | undefined) => {
    if (!node || !tenantId) return;
    
    const toolId = (node.data as any)?.toolId;
    
    // Cleanup Vector Store for File Search Tool nodes
    if (toolId === 'tool-file-search') {
      const vectorStoreId = (node.data as any)?.vectorStoreId;
      if (!vectorStoreId) {
        logger.debug(`File Search Tool node ${node.id} has no vectorStoreId, skipping cleanup`);
        return;
      }
      
      try {
        logger.info(`Cleaning up Vector Store ${vectorStoreId} for deleted File Search Tool node ${node.id}`);
        await openaiVectorStoresService.deleteVectorStore(vectorStoreId, tenantId);
        logger.info(`Successfully deleted Vector Store ${vectorStoreId}`);
      } catch (error: any) {
        logger.error(`Failed to delete Vector Store ${vectorStoreId}:`, error);
        // Don't block node deletion if Vector Store cleanup fails
        // The Vector Store will remain on OpenAI platform, but that's acceptable
      }
    }
    
    // Cleanup Files for Code Interpreter Tool nodes
    if (toolId === 'tool-code-interpreter') {
      const fileIds = (node.data as any)?.fileIds;
      logger.debug(`Code Interpreter Tool node ${node.id} - fileIds:`, fileIds);
      
      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        logger.debug(`Code Interpreter Tool node ${node.id} has no fileIds, skipping cleanup`);
        return;
      }
      
      logger.info(`Cleaning up ${fileIds.length} file(s) for deleted Code Interpreter Tool node ${node.id}`);
      logger.debug(`File IDs to delete:`, fileIds);
      
      // Delete all files from OpenAI
      const deletePromises = fileIds.map(async (fileId: string) => {
        if (!fileId || typeof fileId !== 'string') {
          logger.warn(`Invalid fileId in array:`, fileId);
          return;
        }
        
        try {
          logger.debug(`Deleting file ${fileId} from OpenAI...`);
          await openaiFilesService.deleteFile(fileId, tenantId);
          logger.info(`Successfully deleted file ${fileId} from OpenAI`);
        } catch (error: any) {
          logger.error(`Failed to delete file ${fileId} from OpenAI:`, error);
          // Continue deleting other files even if one fails
        }
      });
      
      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      logger.info(`Completed cleanup: ${successful} successful, ${failed} failed out of ${fileIds.length} file(s) for Code Interpreter Tool node ${node.id}`);
    }
  }, [tenantId]);
  
  // Add a new node
  const addNode = useCallback((type: string, position?: { x: number; y: number }, initialData?: any) => {
    logger.info(`Adding node of type: ${type}`);

    // Validate Start node
    if (type === 'start' && hasStartNode(nodes)) {
      alert(VALIDATION_MESSAGES.MULTIPLE_START_NODES);
      logger.warn('Prevented adding second Start node');
      return null;
    }

    const newNode = createNode(type, position, initialData);
    
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

      // Delete with grouping support:
      // - For loops/ifelse: delete all child nodes in the group
      // - For agent: delete ONLY tool nodes that are orphaned (connected only to this agent)
      const parentType = nodeToDelete?.type;
      let nodesToDelete = [nodeId];
      let toolNodesToDelete: string[] = [];

      if (parentType === 'agent') {
        toolNodesToDelete = findToolNodesConnectedToAgent(edges, nodeId, nodes);
        if (toolNodesToDelete.length > 0) {
          logger.info(
            `Found ${toolNodesToDelete.length} tool node(s) connected only to this agent. They will be removed as well.`
          );
          nodesToDelete = [...nodesToDelete, ...toolNodesToDelete];
        }
      } else if (parentType) {
        const childIds = findAllChildNodes(nodeId, parentType, edges, nodes);
        if (childIds.length > 0) {
          nodesToDelete = Array.from(new Set([...nodesToDelete, ...childIds]));
          logger.info(`Deleting grouped node ${nodeId} (${parentType}) with ${childIds.length} child node(s).`);
        }
      }

      // Cleanup resources for tool nodes before deletion (Vector Stores, Files, etc.)
      logger.debug(`Cleaning up resources for ${nodesToDelete.length} node(s) before deletion`);
      for (const idToDelete of nodesToDelete) {
        const nodeToCleanup = nodes.find(n => n.id === idToDelete);
        if (nodeToCleanup) {
          logger.debug(`Cleaning up resources for node ${idToDelete} (type: ${nodeToCleanup.type}, toolId: ${(nodeToCleanup.data as any)?.toolId})`);
          logger.debug(`Node data for cleanup:`, nodeToCleanup.data);
          await cleanupToolNodeResources(nodeToCleanup);
        } else {
          logger.warn(`Node ${idToDelete} not found for cleanup`);
        }
      }

      // Delete from backend if workflowId exists
      if (workflowId && deleteNodeFromBackend) {
        // Delete all nodes (agent + tools) from backend
        for (const idToDelete of nodesToDelete) {
          await deleteNodeFromBackend(workflowId, idToDelete);
        }
        logger.info(`Deleted ${nodesToDelete.length} node(s) from backend`);
      }

      // Delete from local state (remove node + group children)
      const updatedNodes = nodes.filter(node => !nodesToDelete.includes(node.id));
      onNodesChange(updatedNodes);

      // Update edges: remove edges connected to any of the deleted nodes
      const filteredEdges = edges.filter(
        edge => !nodesToDelete.includes(edge.source) && !nodesToDelete.includes(edge.target)
      );

      // Create reconnection edges (only for the main node, not for tool nodes)
      const reconnectionEdges = createReconnectionEdges(
        incoming,
        outgoing,
        filteredEdges,
        onAddNodeCallback
      );

      logger.debug(`Created ${reconnectionEdges.length} reconnection edges`);
      onEdgesChange([...filteredEdges, ...reconnectionEdges]);

      if (toolNodesToDelete.length > 0) {
        logger.info(`Node deleted successfully. Removed agent and ${toolNodesToDelete.length} connected tool node(s).`);
      } else if (nodesToDelete.length > 1) {
        logger.info(`Node deleted successfully with grouping (${nodesToDelete.length} total nodes) and automatic reconnection`);
      } else {
        logger.info('Node deleted successfully with automatic reconnection');
      }
    } catch (error) {
      logger.error('Failed to delete node', error);
      alert(VALIDATION_MESSAGES.DELETE_NODE_FAILED);
    }
  }, [nodes, edges, workflowId, onNodesChange, onEdgesChange, onAddNodeCallback, deleteNodeFromBackend, cleanupToolNodeResources]);

  // Duplicate a node
  const duplicateNode = useCallback((node: Node) => {
    logger.info(`Duplicating node: ${node.id}`);

    if (!canBeDuplicated(node.type || '')) {
      alert(VALIDATION_MESSAGES.CANNOT_DUPLICATE_START);
      logger.warn('Prevented duplicating Start node');
      return;
    }

    // Duplicate with grouping support:
    // - Duplicate the node + all children (via dynamic grouping detection)
    // - Duplicate internal edges between the duplicated nodes
    // - Preserve relative positions, apply a visual offset
    const parentId = node.id;
    const nodeType = node.type || '';

    const idsToDuplicate = new Set<string>([parentId]);
    const childIds = findAllChildNodes(parentId, nodeType, edges, nodes);
    childIds.forEach(id => idsToDuplicate.add(id));

    const nodesToDuplicate = nodes.filter(n => idsToDuplicate.has(n.id));
    const edgesToDuplicate = edges.filter(e => idsToDuplicate.has(e.source) && idsToDuplicate.has(e.target));

    const idMapping = new Map<string, string>();
    for (const n of nodesToDuplicate) {
      idMapping.set(n.id, generateNodeId(n.type || 'node'));
    }

    const offset = { x: 200, y: 100 };

    const newNodes: Node[] = nodesToDuplicate.map(n => {
      const newId = idMapping.get(n.id)!;
      return {
        ...n,
        id: newId,
        position: {
          x: n.position.x + offset.x,
          y: n.position.y + offset.y,
        },
        selected: true,
        data: {
          ...n.data,
          // Only suffix label for the duplicated "main" node; keep children unchanged
          ...(n.id === parentId && {
            label: `${(n.data as any)?.label || n.type} (Copy)`,
          }),
        },
      };
    });

    const newEdges: Edge[] = edgesToDuplicate
      .map(e => {
        const newSource = idMapping.get(e.source);
        const newTarget = idMapping.get(e.target);
        if (!newSource || !newTarget) return null;
        return {
          ...e,
          id: generateEdgeId(newSource, newTarget),
          source: newSource,
          target: newTarget,
          // data callbacks are injected/normalized by edge handling; keep minimal data
          data: {},
        } as Edge;
      })
      .filter(Boolean) as Edge[];

    // Deselect all existing nodes and add the new group
    const updatedNodes = nodes.map(n => ({ ...n, selected: false }));
    onNodesChange([...updatedNodes, ...newNodes]);
    onEdgesChange([...edges, ...newEdges]);

    logger.info(`Duplicated ${newNodes.length} node(s) and ${newEdges.length} edge(s) from ${parentId}`);
  }, [nodes, edges, onNodesChange, onEdgesChange]);

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


