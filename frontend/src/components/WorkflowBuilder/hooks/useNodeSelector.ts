/**
 * useNodeSelector Hook
 * 
 * Manages node selector popup for adding nodes between edges or from node outputs.
 * Handles complex logic for inserting nodes into workflows.
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
  createLoopEdge,
  findDownstreamNodes,
} from '../../../utils/edgeUtils';
import {
  VALIDATION_MESSAGES,
  VERTICAL_SPACING,
  HORIZONTAL_SPACING,
  EDGE_TYPE_LOOP,
  NODE_TYPE_WHILE,
  isLoopHandle,
  LOOP_HANDLE_IDS,
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

      // Use explicit sourceHandle from popup (for multi-output nodes like parallel, ifelse, while)
      // or fallback to default based on node type
      // CRITICAL: Check for undefined/null explicitly, not just falsy, to preserve 'loop' handle
      const sourceHandle = activePopup.sourceHandle !== undefined && activePopup.sourceHandle !== null 
        ? activePopup.sourceHandle 
        : getSourceHandle(sourceNode.type);
      const targetHandle = getTargetHandle(nodeType);

      // Check if this is a loop handle
      const isLoopHandleConnection = isLoopHandle(sourceHandle);
      
      logger.info('🔄 [CASE 1] Adding node from output', {
        sourceNodeId: activePopup.sourceNode,
        sourceNodeType: sourceNode.type,
        activePopupSourceHandle: activePopup.sourceHandle,
        sourceHandle,
        nodeType,
        isLoopHandleConnection,
        isLoopHandle: isLoopHandle(sourceHandle),
        combinedPopupExists: !!combinedPopup,
        popupExists: !!popup,
      });

      // Position new node to the right (horizontal layout)
      const position = calculateRelativePosition(sourceNode, 'right', HORIZONTAL_SPACING);

      const newNode = createNode(nodeType, position);
      onNodesChange([...nodes, newNode]);

      // Create edge - use loop edge if source handle is loop handle
      let newEdge: Edge;
      const newEdges: Edge[] = [];
      
      if (isLoopHandleConnection) {
        logger.info('🔄 [CASE 1] Creating loop edge from loop handle', {
          sourceHandle,
          sourceNodeType: sourceNode.type,
          sourceNodeId: activePopup.sourceNode,
          newNodeId: newNode.id,
          isWhileNode: sourceNode.type === NODE_TYPE_WHILE,
        });
        
        // Create edge from while node to new node
        newEdge = createLoopEdge(
          activePopup.sourceNode,
          newNode.id,
          (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
          sourceHandle,
          targetHandle,
          sourceHandle === LOOP_HANDLE_IDS.BACK ? 'back' : 'loop'
        );
        newEdges.push(newEdge);
        
        logger.info('🔄 [CASE 1] Created loop edge', {
          edgeId: newEdge.id,
          source: newEdge.source,
          target: newEdge.target,
          sourceHandle: newEdge.sourceHandle,
          targetHandle: newEdge.targetHandle,
          edgeType: newEdge.type,
        });
        
        // CRITICAL: If adding from 'loop' handle of while node, automatically create loop-back edge
        // Only While nodes have a 'back' handle; other nodes use normal output (undefined)
        if (sourceNode.type === NODE_TYPE_WHILE && sourceHandle === LOOP_HANDLE_IDS.LOOP) {
          const loopBackSourceHandle = newNode.type === NODE_TYPE_WHILE 
            ? LOOP_HANDLE_IDS.BACK  // While nodes have 'back' handle
            : undefined;             // Other nodes use normal output
          
          logger.info('✅ [CASE 1] Source is while node with loop handle - creating automatic loop-back edge', {
            sourceNodeId: activePopup.sourceNode,
            newNodeId: newNode.id,
            newNodeType: newNode.type,
            loopBackSourceHandle,
            loopBackHandle: LOOP_HANDLE_IDS.BACK,
          });
          
          const loopBackEdge = createLoopEdge(
            newNode.id,
            activePopup.sourceNode,
            (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
            loopBackSourceHandle, // 'back' handle for while nodes, undefined for others
            LOOP_HANDLE_IDS.BACK, // 'back' target handle on while node (receives loop-back)
            'back'
          );
          newEdges.push(loopBackEdge);
          
          logger.info('✅ [CASE 1] Created automatic loop-back edge', {
            edgeId: loopBackEdge.id,
            from: newNode.id,
            to: activePopup.sourceNode,
            sourceHandle: loopBackEdge.sourceHandle,
            targetHandle: loopBackEdge.targetHandle,
            edgeType: loopBackEdge.type,
            loopType: loopBackEdge.data?.loopType,
          });
        }
      } else {
        newEdge = createButtonEdge(
          activePopup.sourceNode,
          newNode.id,
          (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
          sourceHandle,
          targetHandle
        );
        newEdges.push(newEdge);
      }

      onEdgesChange([...edges, ...newEdges]);

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
    // Check if we're inserting into a loop edge
    const isLoopEdge = edge.type === EDGE_TYPE_LOOP || 
                       isLoopHandle(edge.sourceHandle) || 
                       isLoopHandle(edge.targetHandle);
    
    logger.info('Inserting node between nodes', {
      nodeType,
      source: sourceNode.id,
      target: targetNode.id,
      edgeType: edge.type,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      isLoopEdge,
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
    const newEdges: Edge[] = [];

    // Preserve handles from original edge
    const preservedSourceHandle = edge.sourceHandle || undefined;
    const preservedTargetHandle = edge.targetHandle || undefined;

    if (isLoopEdge) {
      // LOOP EDGE INSERTION: Maintain loop structure
      logger.info('🔄 [LOOP EDGE] Inserting node into loop edge', {
        preservedSourceHandle,
        preservedTargetHandle,
        targetNodeType: targetNode.type,
        targetNodeId: targetNode.id,
        NODE_TYPE_WHILE,
        isWhileNode: targetNode.type === NODE_TYPE_WHILE,
        LOOP_HANDLE_IDS,
      });

      // Incoming edge: preserve loop handle
      const incomingLoopEdge = createLoopEdge(
        sourceNode.id,
        newNode.id,
        (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
        preservedSourceHandle, // Preserve 'loop' handle
        incomingTargetHandle,
        preservedSourceHandle === LOOP_HANDLE_IDS.LOOP ? 'loop' : 'back'
      );
      newEdges.push(incomingLoopEdge);
      logger.info('🔄 [LOOP EDGE] Created incoming loop edge', {
        edgeId: incomingLoopEdge.id,
        source: incomingLoopEdge.source,
        target: incomingLoopEdge.target,
        sourceHandle: incomingLoopEdge.sourceHandle,
        targetHandle: incomingLoopEdge.targetHandle,
      });

      // Outgoing edge: check if target is while node
      logger.info('🔄 [LOOP EDGE] Checking if target is while node', {
        targetNodeType: targetNode.type,
        targetNodeId: targetNode.id,
        NODE_TYPE_WHILE,
        comparison: `${targetNode.type} === ${NODE_TYPE_WHILE}`,
        result: targetNode.type === NODE_TYPE_WHILE,
      });
      
      if (targetNode.type === NODE_TYPE_WHILE) {
        // Target is while node → create loop-back edge
        // Only While nodes have a 'back' handle; other nodes use normal output (undefined)
        const loopBackSourceHandle = newNode.type === NODE_TYPE_WHILE 
          ? LOOP_HANDLE_IDS.BACK  // While nodes have 'back' handle
          : undefined;             // Other nodes use normal output
        
        logger.info('✅ [LOOP EDGE] Target IS while node - creating loop-back edge', {
          newNodeId: newNode.id,
          newNodeType: newNode.type,
          targetNodeId: targetNode.id,
          loopBackSourceHandle,
          loopBackHandle: LOOP_HANDLE_IDS.BACK,
        });
        
        const loopBackEdge = createLoopEdge(
          newNode.id,
          targetNode.id,
          (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
          loopBackSourceHandle, // 'back' handle for while nodes, undefined for others
          LOOP_HANDLE_IDS.BACK, // 'back' target handle on while node (receives loop-back)
          'back'
        );
        newEdges.push(loopBackEdge);
        
        logger.info('✅ [LOOP EDGE] Created loop-back edge automatically', {
          edgeId: loopBackEdge.id,
          from: newNode.id,
          to: targetNode.id,
          sourceHandle: loopBackEdge.sourceHandle,
          targetHandle: loopBackEdge.targetHandle,
          edgeType: loopBackEdge.type,
        });
      } else {
        // Target is not while node → continue loop
        logger.info('⚠️ [LOOP EDGE] Target is NOT while node - continuing loop', {
          targetNodeType: targetNode.type,
          targetNodeId: targetNode.id,
          expectedType: NODE_TYPE_WHILE,
        });
        
        const outgoingLoopEdge = createLoopEdge(
          newNode.id,
          targetNode.id,
          (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
          outgoingSourceHandle,
          preservedTargetHandle, // Preserve target handle
          preservedSourceHandle === LOOP_HANDLE_IDS.LOOP ? 'loop' : 'back'
        );
        newEdges.push(outgoingLoopEdge);
        logger.info('🔄 [LOOP EDGE] Created outgoing loop edge (continue)', {
          edgeId: outgoingLoopEdge.id,
          source: outgoingLoopEdge.source,
          target: outgoingLoopEdge.target,
        });
      }
    } else {
      // NORMAL EDGE INSERTION: Standard behavior
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

      newEdges.push(incomingEdge, outgoingEdge);
    }

    logger.info('🔄 [LOOP EDGE] Final edges to create', {
      totalEdges: newEdges.length,
      edges: newEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: e.type,
      })),
    });

    onEdgesChange([...filteredEdges, ...newEdges]);

    logger.info('✅ Node inserted between nodes successfully', {
      isLoopEdge,
      edgesCreated: newEdges.length,
      newNodeId: newNode.id,
    });
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

      // Use explicit sourceHandle from popup (for multi-output nodes like parallel, ifelse, while)
      // or fallback to default based on node type
      // CRITICAL: Check for undefined/null explicitly, not just falsy, to preserve 'loop' handle
      const sourceHandle = originalPopup.sourceHandle !== undefined && originalPopup.sourceHandle !== null 
        ? originalPopup.sourceHandle 
        : getSourceHandle(sourceNode.type);
      const targetHandle = getTargetHandle('http-request');

      // Check if this is a loop handle
      const isLoopHandleConnection = isLoopHandle(sourceHandle);

      logger.info('🔄 [API ENDPOINT - CASE 1] Adding HTTP Request node from output', {
        sourceNodeId: originalPopup.sourceNode,
        sourceNodeType: sourceNode.type,
        activePopupSourceHandle: originalPopup.sourceHandle,
        sourceHandle,
        isLoopHandleConnection,
        isLoopHandle: isLoopHandle(sourceHandle),
      });

      // Position new node to the right (horizontal layout)
      const position = calculateRelativePosition(sourceNode, 'right', HORIZONTAL_SPACING);
      newNode.position = position;

      onNodesChange([...nodes, newNode]);

      // Create edge - use loop edge if source handle is loop handle
      const newEdges: Edge[] = [];
      
      if (isLoopHandleConnection) {
        logger.info('🔄 [API ENDPOINT - CASE 1] Creating loop edge from loop handle', {
          sourceHandle,
          sourceNodeType: sourceNode.type,
          sourceNodeId: originalPopup.sourceNode,
          newNodeId: newNode.id,
          isWhileNode: sourceNode.type === NODE_TYPE_WHILE,
        });
        
        // Create edge from while node to new node
        const newEdge = createLoopEdge(
          originalPopup.sourceNode,
          newNode.id,
          (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
          sourceHandle,
          targetHandle,
          sourceHandle === LOOP_HANDLE_IDS.BACK ? 'back' : 'loop'
        );
        newEdges.push(newEdge);
        
        logger.info('🔄 [API ENDPOINT - CASE 1] Created loop edge', {
          edgeId: newEdge.id,
          source: newEdge.source,
          target: newEdge.target,
          sourceHandle: newEdge.sourceHandle,
          targetHandle: newEdge.targetHandle,
          edgeType: newEdge.type,
        });
        
        // CRITICAL: If adding from 'loop' handle of while node, automatically create loop-back edge
        // Note: The new node (HTTP Request) doesn't have a 'back' handle, so we use undefined (normal output)
        if (sourceNode.type === NODE_TYPE_WHILE && sourceHandle === LOOP_HANDLE_IDS.LOOP) {
          logger.info('✅ [API ENDPOINT - CASE 1] Source is while node with loop handle - creating automatic loop-back edge', {
            sourceNodeId: originalPopup.sourceNode,
            newNodeId: newNode.id,
            newNodeType: newNode.type,
            loopBackHandle: LOOP_HANDLE_IDS.BACK,
            note: 'Using undefined sourceHandle (normal output) since HTTP Request nodes don\'t have loop handles',
          });
          
          const loopBackEdge = createLoopEdge(
            newNode.id,
            originalPopup.sourceNode,
            (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
            undefined, // Normal output (HTTP Request nodes don't have 'back' handle)
            LOOP_HANDLE_IDS.BACK, // 'back' target handle on while node (receives loop-back)
            'back'
          );
          newEdges.push(loopBackEdge);
          
          logger.info('✅ [API ENDPOINT - CASE 1] Created automatic loop-back edge', {
            edgeId: loopBackEdge.id,
            from: newNode.id,
            to: originalPopup.sourceNode,
            sourceHandle: loopBackEdge.sourceHandle,
            targetHandle: loopBackEdge.targetHandle,
            edgeType: loopBackEdge.type,
            loopType: loopBackEdge.data?.loopType,
          });
        }
      } else {
        const newEdge = createButtonEdge(
          originalPopup.sourceNode,
          newNode.id,
          (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
          sourceHandle,
          targetHandle
        );
        newEdges.push(newEdge);
      }

      onEdgesChange([...edges, ...newEdges]);
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

    // Check if we're inserting into a loop edge
    const isLoopEdge = edge.type === EDGE_TYPE_LOOP || 
                       isLoopHandle(edge.sourceHandle) || 
                       isLoopHandle(edge.targetHandle);

    logger.info('🔄 [API ENDPOINT - CASE 2] Inserting HTTP Request node between nodes', {
      source: sourceNode.id,
      target: targetNode.id,
      edgeType: edge.type,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      isLoopEdge,
    });

    const newEdges: Edge[] = [];

    if (isLoopEdge) {
      // LOOP EDGE INSERTION: Maintain loop structure
      logger.info('🔄 [API ENDPOINT - CASE 2] Inserting into loop edge', {
        preservedSourceHandle,
        preservedTargetHandle,
        targetNodeType: targetNode.type,
        targetNodeId: targetNode.id,
        NODE_TYPE_WHILE,
        isWhileNode: targetNode.type === NODE_TYPE_WHILE,
      });

      // Incoming edge: preserve loop handle
      const incomingLoopEdge = createLoopEdge(
        sourceNode.id,
        newNode.id,
        (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
        preservedSourceHandle, // Preserve 'loop' handle
        getTargetHandle('http-request'),
        preservedSourceHandle === LOOP_HANDLE_IDS.LOOP ? 'loop' : 'back'
      );
      newEdges.push(incomingLoopEdge);

      // Outgoing edge: check if target is while node
      if (targetNode.type === NODE_TYPE_WHILE) {
        // Target is while node → create loop-back edge
        // HTTP Request nodes don't have a 'back' handle, so use undefined (normal output)
        const loopBackSourceHandle = undefined; // HTTP Request nodes use normal output
        
        logger.info('✅ [API ENDPOINT - CASE 2] Target IS while node - creating loop-back edge', {
          newNodeId: newNode.id,
          newNodeType: newNode.type,
          targetNodeId: targetNode.id,
          loopBackSourceHandle,
          loopBackHandle: LOOP_HANDLE_IDS.BACK,
        });
        
        const loopBackEdge = createLoopEdge(
          newNode.id,
          targetNode.id,
          (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
          loopBackSourceHandle, // undefined for HTTP Request nodes (normal output)
          LOOP_HANDLE_IDS.BACK, // 'back' target handle on while node (receives loop-back)
          'back'
        );
        newEdges.push(loopBackEdge);
      } else {
        // Target is not while node → continue loop
        const outgoingLoopEdge = createLoopEdge(
          newNode.id,
          targetNode.id,
          (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
          getSourceHandle('http-request'),
          preservedTargetHandle, // Preserve target handle
          preservedSourceHandle === LOOP_HANDLE_IDS.LOOP ? 'loop' : 'back'
        );
        newEdges.push(outgoingLoopEdge);
      }
    } else {
      // Normal edge insertion
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

      newEdges.push(incomingEdge, outgoingEdge);
    }

    onEdgesChange([...filteredEdges, ...newEdges]);
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


