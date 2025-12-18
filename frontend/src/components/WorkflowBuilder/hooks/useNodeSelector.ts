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
  isLoopNodeType,
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

    // SPECIAL: Loop (Pair) macro — creates Loop + End Loop nodes with shared pairId
    if (nodeType === 'loop-pair') {
      const pairId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Case 1: Adding from node output (no target node)
      if (!activePopup.targetNode) {
        const sourceNode = nodes.find(n => n.id === activePopup.sourceNode);
        if (!sourceNode) {
          logger.warn('Source node not found', { sourceNodeId: activePopup.sourceNode });
          if (combinedPopup) setCombinedPopup(null);
          else setPopup(null);
          return;
        }

        const sourceHandle =
          activePopup.sourceHandle !== undefined && activePopup.sourceHandle !== null
            ? activePopup.sourceHandle
            : getSourceHandle(sourceNode.type);

        const loopPos = calculateRelativePosition(sourceNode, 'right', HORIZONTAL_SPACING);
        const loopNode = createNode('loop', loopPos, { pairId });
        const endLoopNode = createNode(
          'end-loop',
          { x: loopPos.x + HORIZONTAL_SPACING, y: loopPos.y },
          { pairId }
        );

        onNodesChange([...nodes, loopNode, endLoopNode]);

        const newEdges: Edge[] = [];
        // Source -> Loop
        newEdges.push(
          createButtonEdge(
            sourceNode.id,
            loopNode.id,
            (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
            sourceHandle,
            getTargetHandle('loop')
          )
        );
        // Loop -> EndLoop (body insertion edge)
        newEdges.push(
          createButtonEdge(
            loopNode.id,
            endLoopNode.id,
            (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
            getSourceHandle('loop'),
            getTargetHandle('end-loop')
          )
        );

        onEdgesChange([...edges, ...newEdges]);

        if (combinedPopup) setCombinedPopup(null);
        else setPopup(null);
        return;
      }

      // Case 2: Adding between two nodes
      const { edgeId, sourceNode: sourceNodeId, targetNode: targetNodeId } = activePopup;
      if (!edgeId) return;

      const edge = edges.find(e => e.id === edgeId);
      const sourceNode = nodes.find(n => n.id === sourceNodeId);
      const targetNode = nodes.find(n => n.id === targetNodeId);
      if (!edge || !sourceNode || !targetNode) return;

      const basePos = autoLayoutEnabled ? { x: 400, y: 200 } : calculateMidpoint(sourceNode, targetNode);

      const loopNode = createNode('loop', basePos, { pairId });
      const endLoopNode = createNode(
        'end-loop',
        { x: basePos.x + HORIZONTAL_SPACING, y: basePos.y },
        { pairId }
      );

      // Update nodes (with optional downstream shifting if auto-layout is disabled)
      if (!autoLayoutEnabled) {
        const downstreamNodes = findDownstreamNodes(targetNode.id, edges);
        const shiftedNodes = shiftNodesVertically(nodes, downstreamNodes, VERTICAL_SPACING);
        onNodesChange([...shiftedNodes, loopNode, endLoopNode]);
      } else {
        onNodesChange([...nodes, loopNode, endLoopNode]);
      }

      // Preserve handles from original edge
      const preservedSourceHandle = edge.sourceHandle || undefined;
      const preservedTargetHandle = edge.targetHandle || undefined;

      // Replace old edge with: source->loop, loop->end-loop, end-loop->target
      const filteredEdges = edges.filter(e => e.id !== edge.id);
      const newEdges: Edge[] = [];

      newEdges.push(
        createButtonEdge(
          sourceNode.id,
          loopNode.id,
          (edgeId2, src, tgt) => openPopupBetweenNodes(edgeId2, src, tgt),
          preservedSourceHandle,
          getTargetHandle('loop')
        )
      );

      newEdges.push(
        createButtonEdge(
          loopNode.id,
          endLoopNode.id,
          (edgeId2, src, tgt) => openPopupBetweenNodes(edgeId2, src, tgt),
          getSourceHandle('loop'),
          getTargetHandle('end-loop')
        )
      );

      newEdges.push(
        createButtonEdge(
          endLoopNode.id,
          targetNode.id,
          (edgeId2, src, tgt) => openPopupBetweenNodes(edgeId2, src, tgt),
          getSourceHandle('end-loop'),
          preservedTargetHandle
        )
      );

      onEdgesChange([...filteredEdges, ...newEdges]);

      if (combinedPopup) setCombinedPopup(null);
      else setPopup(null);
      return;
    }

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
              isLoopNode: isLoopNodeType(sourceNode.type),
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
        
        // CRITICAL: If adding from 'loop' handle of loop node (while/foreach), automatically create loop-back edge
        // Only loop nodes (while/foreach) have a 'back' handle; other nodes use normal output (undefined)
        if (isLoopNodeType(sourceNode.type) && sourceHandle === LOOP_HANDLE_IDS.LOOP) {
          const loopBackSourceHandle = isLoopNodeType(newNode.type)
            ? LOOP_HANDLE_IDS.BACK  // Loop nodes have 'back' handle
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

      // Determine if incoming edge should be normal or loop
      // If original edge was loop-back (targetHandle === 'back'), incoming should be NORMAL
      // (because it's between nodes in the loop, not going back to the loop node)
      // If original edge was loop (sourceHandle === 'loop'), incoming should be LOOP
      // If both handles are undefined, it's also a normal edge between nodes
      const shouldCreateNormalIncomingEdge = 
        preservedTargetHandle === LOOP_HANDLE_IDS.BACK ||  // Loop-back edge → normal incoming
        (preservedSourceHandle === undefined && preservedTargetHandle === undefined); // Both undefined → normal
      
      if (shouldCreateNormalIncomingEdge && preservedSourceHandle !== LOOP_HANDLE_IDS.LOOP) {
        // Normal edge between nodes in loop (gray)
        const incomingEdge = createButtonEdge(
          sourceNode.id,
          newNode.id,
          (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
          undefined,
          incomingTargetHandle
        );
        newEdges.push(incomingEdge);
      } else {
        // Has loop handles → create loop edge
        const incomingLoopEdge = createLoopEdge(
          sourceNode.id,
          newNode.id,
          (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
          preservedSourceHandle,
          incomingTargetHandle,
          preservedSourceHandle === LOOP_HANDLE_IDS.LOOP ? 'loop' : 'back'
        );
        newEdges.push(incomingLoopEdge);
      }

      // Outgoing edge: check if target is loop node
      if (isLoopNodeType(targetNode.type)) {
        // Target is loop node (while/foreach) → create loop-back edge
        // Only loop nodes have a 'back' handle; other nodes use normal output (undefined)
        const loopBackSourceHandle = isLoopNodeType(newNode.type)
          ? LOOP_HANDLE_IDS.BACK  // Loop nodes have 'back' handle
          : undefined;             // Other nodes use normal output
        
        const loopBackEdge = createLoopEdge(
          newNode.id,
          targetNode.id,
          (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
          loopBackSourceHandle, // 'back' handle for while nodes, undefined for others
          LOOP_HANDLE_IDS.BACK, // 'back' target handle on while node (receives loop-back)
          'back'
        );
        newEdges.push(loopBackEdge);
      } else {
        // Target is not loop node → continue loop
        // If both handles are undefined, this is a normal edge between nodes in the loop
        if (outgoingSourceHandle === undefined && preservedTargetHandle === undefined) {
          // Normal edge between nodes in loop (gray)
          const outgoingEdge = createButtonEdge(
            newNode.id,
            targetNode.id,
            (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
            undefined,
            preservedTargetHandle
          );
          newEdges.push(outgoingEdge);
        } else {
          // Has loop handles → create loop edge
          const outgoingLoopEdge = createLoopEdge(
            newNode.id,
            targetNode.id,
            (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
            outgoingSourceHandle,
            preservedTargetHandle,
            preservedSourceHandle === LOOP_HANDLE_IDS.LOOP ? 'loop' : 'back'
          );
          newEdges.push(outgoingLoopEdge);
        }
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


    onEdgesChange([...filteredEdges, ...newEdges]);

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
          isLoopNode: isLoopNodeType(sourceNode.type),
        });
        
        // Create edge from loop node to new node
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
        
        // CRITICAL: If adding from 'loop' handle of loop node, automatically create loop-back edge
        // Note: The new node (HTTP Request) doesn't have a 'back' handle, so we use undefined (normal output)
        if (isLoopNodeType(sourceNode.type) && sourceHandle === LOOP_HANDLE_IDS.LOOP) {
          logger.info('✅ [API ENDPOINT - CASE 1] Source is loop node with loop handle - creating automatic loop-back edge', {
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


    const newEdges: Edge[] = [];

    if (isLoopEdge) {
      // LOOP EDGE INSERTION: Maintain loop structure
      // Determine if incoming edge should be normal or loop
      // If original edge was loop-back (targetHandle === 'back'), incoming should be NORMAL
      // (because it's between nodes in the loop, not going back to the loop node)
      // If original edge was loop (sourceHandle === 'loop'), incoming should be LOOP
      // If both handles are undefined, it's also a normal edge between nodes
      const shouldCreateNormalIncomingEdge = 
        preservedTargetHandle === LOOP_HANDLE_IDS.BACK ||  // Loop-back edge → normal incoming
        (preservedSourceHandle === undefined && preservedTargetHandle === undefined); // Both undefined → normal
      
      if (shouldCreateNormalIncomingEdge && preservedSourceHandle !== LOOP_HANDLE_IDS.LOOP) {
        // Normal edge between nodes in loop (gray)
        const incomingEdge = createButtonEdge(
          sourceNode.id,
          newNode.id,
          (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
          undefined,
          getTargetHandle('http-request')
        );
        newEdges.push(incomingEdge);
      } else {
        // Has loop handles → create loop edge
        const incomingLoopEdge = createLoopEdge(
          sourceNode.id,
          newNode.id,
          (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
          preservedSourceHandle,
          getTargetHandle('http-request'),
          preservedSourceHandle === LOOP_HANDLE_IDS.LOOP ? 'loop' : 'back'
        );
        newEdges.push(incomingLoopEdge);
      }

      // Outgoing edge: check if target is loop node
      if (isLoopNodeType(targetNode.type)) {
        // Target is loop node (while/foreach) → create loop-back edge
        // HTTP Request nodes don't have a 'back' handle, so use undefined (normal output)
        const loopBackSourceHandle = undefined; // HTTP Request nodes use normal output
        
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
        // Target is not loop node → continue loop
        const outgoingSourceHandle = getSourceHandle('http-request');
        
        // If both handles are undefined, this is a normal edge between nodes in the loop
        if (outgoingSourceHandle === undefined && preservedTargetHandle === undefined) {
          // Normal edge between nodes in loop (gray)
          const outgoingEdge = createButtonEdge(
            newNode.id,
            targetNode.id,
            (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
            undefined,
            preservedTargetHandle
          );
          newEdges.push(outgoingEdge);
        } else {
          // Has loop handles → create loop edge
          const outgoingLoopEdge = createLoopEdge(
            newNode.id,
            targetNode.id,
            (edgeId, src, tgt) => openPopupBetweenNodes(edgeId, src, tgt),
            outgoingSourceHandle,
            preservedTargetHandle,
            preservedSourceHandle === LOOP_HANDLE_IDS.LOOP ? 'loop' : 'back'
          );
          newEdges.push(outgoingLoopEdge);
        }
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


