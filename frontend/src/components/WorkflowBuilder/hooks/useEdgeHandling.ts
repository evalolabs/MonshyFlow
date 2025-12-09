/**
 * useEdgeHandling Hook
 * 
 * Handles edge operations: creation, connection, and handle management.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { Edge, Connection, Node } from '@xyflow/react';
import {
  cleanEdgeHandles,
} from '../../../utils/edgeUtils';
import { EDGE_TYPE_BUTTON } from '../constants';
import { edgeLogger as logger } from '../../../utils/logger';
import { isToolNodeType } from '../../../types/toolCatalog';

const EDGE_TYPE_TOOL = 'default'; // Use default bezier curve for a more pronounced arc

interface UseEdgeHandlingProps {
  nodes: Node[];
  edges: Edge[];
  onEdgesChange: (edges: Edge[]) => void;
  onAddNodeCallback: (edgeId: string, source: string, target: string) => void;
}

export function useEdgeHandling({
  nodes,
  edges,
  onEdgesChange,
  onAddNodeCallback,
}: UseEdgeHandlingProps) {
  
  // Store callback in ref to avoid recreating edges unnecessarily
  const callbackRef = useRef(onAddNodeCallback);
  callbackRef.current = onAddNodeCallback;

  // Handle new connection
  const handleConnect = useCallback((connection: Connection) => {
    logger.info('Manual connection created', {
      source: connection.source,
      sourceHandle: connection.sourceHandle,
      target: connection.target,
      targetHandle: connection.targetHandle,
    });

    // Validation: Only tool nodes can connect to Agent Tool handles
    const targetHandle = connection.targetHandle;
    const isAgentToolHandle = targetHandle === 'tool' || targetHandle === 'chat-model' || targetHandle === 'memory';
    
    if (isAgentToolHandle && connection.source) {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const isSourceTool = sourceNode?.type === 'tool' || isToolNodeType(sourceNode?.type || '');
      
      if (!isSourceTool) {
        alert('⚠️ Only Tool nodes can be connected to Agent Tool handles.\n\nPlease use a Tool from the "Tools" tab instead of a regular node.');
        logger.warn('Prevented non-tool node from connecting to Agent Tool handle', {
          sourceNodeType: sourceNode?.type,
          targetHandle,
        });
        return;
      }
    }

    // Validation: Tool nodes can only connect to Agent Tool handles
    if (connection.source) {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const isSourceTool = sourceNode?.type === 'tool' || isToolNodeType(sourceNode?.type || '');
      
      if (isSourceTool && !isAgentToolHandle) {
        alert('⚠️ Tool nodes can only be connected to Agent Tool handles.\n\nPlease connect the tool to the "Tool" input handle on an Agent node.');
        logger.warn('Prevented tool node from connecting to non-tool handle', {
          sourceNodeType: sourceNode?.type,
          targetHandle,
        });
        return;
      }
    }

    // Determine edge type: tool edge for tool connections, button edge for regular connections
    const sourceNode = nodes.find(n => n.id === connection.source);
    const isSourceTool = sourceNode?.type === 'tool' || isToolNodeType(sourceNode?.type || '');
    const isToolConnection = isSourceTool && isAgentToolHandle;
    
    const edgeType = isToolConnection ? EDGE_TYPE_TOOL : EDGE_TYPE_BUTTON;
    
    logger.info(`Creating edge with type: ${edgeType}`, {
      isSourceTool,
      isAgentToolHandle,
      isToolConnection,
      sourceNodeType: sourceNode?.type,
      targetHandle,
    });
    
    // Create new edge - CRITICAL: Set type immediately so ReactFlow uses correct component
    const newEdge: Edge = {
      id: `${connection.source}-${connection.target}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
      type: edgeType, // CRITICAL: Set type immediately
      data: isToolConnection ? {} : {
        onAddNode: (edgeId: string, source: string, target: string) =>
          callbackRef.current(edgeId, source, target),
      },
    };

    onEdgesChange([...edges, newEdge]);
    logger.info('Edge created successfully');
  }, [nodes, edges, onEdgesChange]);

  // CRITICAL: Ensure all tool edges are immediately converted to 'default' type (bezier curve)
  // This must run on every edge change to catch any edges that should be tool edges
  // Also converts old 'toolEdge' type to 'default' for backward compatibility
  useEffect(() => {
    // First, check if ANY edges need to be converted
    // This must happen IMMEDIATELY to prevent ReactFlow from using wrong edge type
    const edgesNeedingUpdate = edges.filter(
      edge => {
        // Convert old 'toolEdge' type to 'default'
        if (edge.type === 'toolEdge') {
          return true; // Always convert old toolEdge type
        }
        
        // Skip edges that are already correct
        const targetHandle = edge.targetHandle;
        const isAgentToolHandle = targetHandle === 'tool' || targetHandle === 'chat-model' || targetHandle === 'memory';
        const sourceNode = nodes.find(n => n.id === edge.source);
        const isSourceTool = sourceNode?.type === 'tool' || isToolNodeType(sourceNode?.type || '');
        
        if (isSourceTool && isAgentToolHandle) {
          // Should be 'default' type but isn't
          if (edge.type !== 'default') {
            return true;
          }
          return false; // Already correct
        }
        
        // Otherwise, check if it needs button functionality
        return !edge.data?.onAddNode || edge.type === undefined;
      }
    );

    // CRITICAL: Always check and convert tool edges, even if no other updates are needed
    // This ensures tool edges are NEVER rendered as ButtonEdge
    const hasToolEdgesToConvert = edges.some(edge => {
      // Convert old 'toolEdge' type
      if (edge.type === 'toolEdge') return true;
      
      // Check if it should be a tool edge but isn't
      if (edge.type === 'default') return false; // Already correct
      
      const targetHandle = edge.targetHandle;
      const isAgentToolHandle = targetHandle === 'tool' || targetHandle === 'chat-model' || targetHandle === 'memory';
      const sourceNode = nodes.find(n => n.id === edge.source);
      const isSourceTool = sourceNode?.type === 'tool' || isToolNodeType(sourceNode?.type || '');
      return isSourceTool && isAgentToolHandle;
    });

    if (edgesNeedingUpdate.length > 0 || hasToolEdgesToConvert) {
      logger.debug(`Updating ${edgesNeedingUpdate.length} edges (including ${hasToolEdgesToConvert ? 'tool edge conversions' : 'no tool edges'})`);

      const updatedEdges = edges.map(edge => {
        // Check if this should be a tool edge
        const targetHandle = edge.targetHandle;
        const isAgentToolHandle = targetHandle === 'tool' || targetHandle === 'chat-model' || targetHandle === 'memory';
        const sourceNode = nodes.find(n => n.id === edge.source);
        const isSourceTool = sourceNode?.type === 'tool' || isToolNodeType(sourceNode?.type || '');
        
        // CRITICAL: Convert old 'toolEdge' type to 'default' (for backward compatibility)
        // Also convert tool connections to use 'default' edge type (bezier curve)
        if (edge.type === 'toolEdge' || (isSourceTool && isAgentToolHandle)) {
          logger.info(`Converting edge to default (bezier) type: ${edge.id}`, {
            sourceNodeType: sourceNode?.type,
            targetHandle,
            currentType: edge.type,
          });
          return {
            ...edge,
            type: 'default', // Use default bezier curve for tool edges
            data: {}, // Tool edges don't need onAddNode
          };
        }
        
        // Don't modify existing default edges that are already correct
        if (edge.type === 'default' && isSourceTool && isAgentToolHandle) {
          return edge;
        }

        const cleaned = cleanEdgeHandles(edge);
        
        return {
          ...cleaned,
          type: edge.type || EDGE_TYPE_BUTTON,
          data: {
            ...edge.data,
            onAddNode: (edgeId: string, source: string, target: string) =>
              callbackRef.current(edgeId, source, target),
          },
        };
      });

      onEdgesChange(updatedEdges);
    }
  }, [nodes, edges, onEdgesChange]);

  return {
    handleConnect,
  };
}


