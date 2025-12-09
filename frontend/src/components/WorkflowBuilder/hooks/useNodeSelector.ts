/**
 * useNodeSelector Hook
 * 
 * Manages node selector popup for adding nodes between edges or from node outputs.
 * Handles complex logic for inserting nodes into workflows and loops.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import {
  hasStartNode,
  createNode,
  createApiHttpRequestNode,
  calculateMidpoint,
  calculateRelativePosition,
  shiftNodesVertically,
  getSourceHandle,
  getTargetHandle,
} from '../../../utils/nodeUtils';
import {
  createButtonEdge,
  findDownstreamNodes,
} from '../../../utils/edgeUtils';
import {
  VALIDATION_MESSAGES,
  VERTICAL_SPACING,
  HORIZONTAL_SPACING,
} from '../constants';
import { nodeLogger as logger } from '../../../utils/logger';
import { getApiIntegration } from '../../../config/apiIntegrations';
import type { ApiEndpoint } from '../../../types/apiIntegrations';

interface UseNodeSelectorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  autoLayoutEnabled: boolean;
}

interface NodeSelectorPopup {
  x: number;
  y: number;
  edgeId?: string;
  sourceNode: string;
  targetNode?: string;
  sourceHandle?: string; // For nodes with multiple output handles (parallel, ifelse, etc)
}

interface CombinedNodeSelectorPopup {
  x: number;
  y: number;
  popup: NodeSelectorPopup; // Store original popup state
}

export function useNodeSelector({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  autoLayoutEnabled,
}: UseNodeSelectorProps) {
  const [popup, setPopup] = useState<NodeSelectorPopup | null>(null);
  const [combinedPopup, setCombinedPopup] = useState<CombinedNodeSelectorPopup | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // Open popup for adding node between edges
  const openPopupBetweenNodes = useCallback((edgeId: string, sourceNode: string, targetNode: string) => {
    logger.info('Opening API endpoint selector between nodes', { edgeId, sourceNode, targetNode });

    const edge = edgesRef.current.find(e => e.id === edgeId);
    if (!edge) {
      logger.error('Edge not found', { edgeId });
      return;
    }

    const sourceNodeData = nodesRef.current.find(n => n.id === sourceNode);
    const targetNodeData = nodesRef.current.find(n => n.id === targetNode);

    if (!sourceNodeData || !targetNodeData) {
      logger.error('Source or target node not found');
      return;
    }

    const position = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    // Always open combined node selector modal
    setCombinedPopup({
      x: position.x,
      y: position.y,
      popup: {
        ...position,
        edgeId,
        sourceNode,
        targetNode,
      },
    });
  }, []);

  // Open popup for adding node from node output
  const openPopupFromOutput = useCallback((sourceNodeId: string, sourceHandle?: string) => {
    logger.info('Opening API endpoint selector from output', { sourceNodeId, sourceHandle });

    const position = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    // Always open combined node selector modal
    setCombinedPopup({
      x: position.x,
      y: position.y,
      popup: {
        ...position,
        sourceNode: sourceNodeId,
        sourceHandle,
      },
    });
  }, []);

  // Handle node type selection
  const selectNodeType = useCallback((nodeType: string) => {
    // Support both popup (legacy) and combinedPopup (new modal)
    const activePopup = combinedPopup?.popup || popup;
    if (!activePopup) {
      logger.warn('selectNodeType called but no popup is active', { nodeType, popup, combinedPopup });
      return;
    }

    logger.info('Node type selected', { nodeType, popup: activePopup, hasCombinedPopup: !!combinedPopup });

    // Validate Start node
    if (nodeType === 'start' && hasStartNode(nodes)) {
      alert(VALIDATION_MESSAGES.MULTIPLE_START_NODES);
      if (combinedPopup) {
        setCombinedPopup(null);
      } else {
        setPopup(null);
      }
      return;
    }

    // Case 1: Adding from node output (no target node)
    if (!activePopup.targetNode) {
      const sourceNode = nodes.find(n => n.id === activePopup.sourceNode);
      if (!sourceNode) {
        logger.warn('Source node not found', { sourceNodeId: activePopup.sourceNode });
        if (combinedPopup) {
          setCombinedPopup(null);
        } else {
          setPopup(null);
        }
        return;
      }

      // Use explicit sourceHandle from popup (for multi-output nodes like parallel, ifelse)
      // or fallback to default based on node type
      const sourceHandle = activePopup.sourceHandle || getSourceHandle(sourceNode.type);
      const targetHandle = getTargetHandle(nodeType);

      // Position new node to the right (horizontal layout)
      const position = calculateRelativePosition(sourceNode, 'right', HORIZONTAL_SPACING);

      const newNode = createNode(nodeType, position);
      onNodesChange([...nodes, newNode]);

      // Create edge
      const newEdge = createButtonEdge(
        activePopup.sourceNode,
        newNode.id,
        (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
        sourceHandle,
        targetHandle
      );

      onEdgesChange([...edges, newEdge]);

      if (combinedPopup) {
        setCombinedPopup(null);
      } else {
        setPopup(null);
      }
      return;
    }

    // Case 2: Adding between two nodes
    const { edgeId, sourceNode: sourceNodeId, targetNode: targetNodeId } = activePopup;

    if (!edgeId) return;

    const edge = edges.find(e => e.id === edgeId);
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    const targetNode = nodes.find(n => n.id === targetNodeId);

    if (!edge || !sourceNode || !targetNode) return;

    // Normal insertion between two nodes
    handleNormalInsertion(nodeType, sourceNode, targetNode, edge);
    if (combinedPopup) {
      setCombinedPopup(null);
    } else {
      setPopup(null);
    }
  }, [popup, combinedPopup, nodes, edges, onNodesChange, onEdgesChange, autoLayoutEnabled, openPopupBetweenNodes]);

  // Handle normal insertion between two nodes
  const handleNormalInsertion = useCallback((
    nodeType: string,
    sourceNode: Node,
    targetNode: Node,
    edge: Edge
  ) => {
    logger.info('Inserting node between nodes', {
      nodeType,
      source: sourceNode.id,
      target: targetNode.id,
    });

    // Determine handles
    const incomingTargetHandle = getTargetHandle(nodeType);
    const outgoingSourceHandle = getSourceHandle(nodeType);

    // Calculate position
    const position = autoLayoutEnabled
      ? { x: 400, y: 200 } // Temporary, will be repositioned by auto-layout
      : calculateMidpoint(sourceNode, targetNode);

    const newNode = createNode(nodeType, position);

    // Update nodes (with optional downstream shifting if auto-layout is disabled)
    if (!autoLayoutEnabled) {
      // Find downstream nodes to shift
      const downstreamNodes = findDownstreamNodes(targetNode.id, edges);
      const shiftedNodes = shiftNodesVertically(nodes, downstreamNodes, VERTICAL_SPACING);
      onNodesChange([...shiftedNodes, newNode]);
    } else {
      onNodesChange([...nodes, newNode]);
    }

    // Update edges
    const filteredEdges = edges.filter(e => e.id !== edge.id);

    // Preserve sourceHandle from original edge (important for multi-output nodes like ifelse, parallel)
    const preservedSourceHandle = edge.sourceHandle || undefined;
    
    // Preserve targetHandle from original edge (important for multi-input nodes)
    const preservedTargetHandle = edge.targetHandle || undefined;

    const incomingEdge = createButtonEdge(
      sourceNode.id,
      newNode.id,
      (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
      preservedSourceHandle,
      incomingTargetHandle
    );

    const outgoingEdge = createButtonEdge(
      newNode.id,
      targetNode.id,
      (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
      outgoingSourceHandle,
      preservedTargetHandle
    );

    onEdgesChange([...filteredEdges, incomingEdge, outgoingEdge]);

    logger.info('Node inserted between nodes successfully');
  }, [nodes, edges, onNodesChange, onEdgesChange, autoLayoutEnabled, openPopupBetweenNodes]);

  // Handle API endpoint selection
  const selectApiEndpoint = useCallback((apiId: string, endpointId: string, endpoint: ApiEndpoint) => {
    if (!combinedPopup) return;

    const originalPopup = combinedPopup.popup;
    const apiIntegration = getApiIntegration(apiId);
    if (!apiIntegration) {
      logger.error('API integration not found', { apiId });
      setCombinedPopup(null);
      return;
    }

    logger.info('API endpoint selected', { apiId, endpointId, endpoint });

    // Create pre-configured HTTP Request node
    const newNode = createApiHttpRequestNode(apiId, endpointId, endpoint, apiIntegration);

    // Case 1: Adding from node output (no target node)
    if (!originalPopup.targetNode) {
      const sourceNode = nodes.find(n => n.id === originalPopup.sourceNode);
      if (!sourceNode) {
        setCombinedPopup(null);
        return;
      }

      const sourceHandle = originalPopup.sourceHandle || getSourceHandle(sourceNode.type);
      const targetHandle = getTargetHandle('http-request');

      // Position new node to the right (horizontal layout)
      const position = calculateRelativePosition(sourceNode, 'right', HORIZONTAL_SPACING);
      newNode.position = position;

      onNodesChange([...nodes, newNode]);

      // Create edge
      const newEdge = createButtonEdge(
        originalPopup.sourceNode,
        newNode.id,
        (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
        sourceHandle,
        targetHandle
      );

      onEdgesChange([...edges, newEdge]);
      setCombinedPopup(null);
      return;
    }

    // Case 2: Adding between two nodes
    const { edgeId, sourceNode: sourceNodeId, targetNode: targetNodeId } = originalPopup;

    if (!edgeId) {
      setCombinedPopup(null);
      return;
    }

    const edge = edges.find(e => e.id === edgeId);
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    const targetNode = nodes.find(n => n.id === targetNodeId);

    if (!edge || !sourceNode || !targetNode) {
      setCombinedPopup(null);
      return;
    }

    // Calculate position
    const position = autoLayoutEnabled
      ? { x: 400, y: 200 } // Temporary, will be repositioned by auto-layout
      : calculateMidpoint(sourceNode, targetNode);
    newNode.position = position;

    // Update nodes
    if (!autoLayoutEnabled) {
      const downstreamNodes = findDownstreamNodes(targetNode.id, edges);
      const shiftedNodes = shiftNodesVertically(nodes, downstreamNodes, VERTICAL_SPACING);
      onNodesChange([...shiftedNodes, newNode]);
    } else {
      onNodesChange([...nodes, newNode]);
    }

    // Update edges
    const filteredEdges = edges.filter(e => e.id !== edge.id);
    const preservedSourceHandle = edge.sourceHandle || undefined;
    const preservedTargetHandle = edge.targetHandle || undefined;

    const incomingEdge = createButtonEdge(
      sourceNode.id,
      newNode.id,
      (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
      preservedSourceHandle,
      getTargetHandle('http-request')
    );

    const outgoingEdge = createButtonEdge(
      newNode.id,
      targetNode.id,
      (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
      getSourceHandle('http-request'),
      preservedTargetHandle
    );

    onEdgesChange([...filteredEdges, incomingEdge, outgoingEdge]);
    setCombinedPopup(null);
    logger.info('API HTTP Request node created successfully');
  }, [combinedPopup, nodes, edges, onNodesChange, onEdgesChange, autoLayoutEnabled, openPopupBetweenNodes]);

  // Close popup
  const closePopup = useCallback(() => {
    setPopup(null);
  }, []);

  // Close combined popup
  const closeCombinedPopup = useCallback(() => {
    setCombinedPopup(null);
  }, []);

  return {
    popup,
    combinedPopup,
    openPopupBetweenNodes,
    openPopupFromOutput,
    selectNodeType,
    selectApiEndpoint,
    closePopup,
    closeCombinedPopup,
  };
}


