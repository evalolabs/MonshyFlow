import React from 'react';
import { getSmoothStepPath, EdgeLabelRenderer, BaseEdge, useReactFlow } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { isToolNodeType } from '../../../types/toolCatalog';
import { EDGE_TYPE_LOOP, isLoopHandle } from '../constants';

interface ButtonEdgeData {
  onAddNode?: (edgeId: string, sourceNode: string, targetNode: string) => void;
  onPasteBetween?: (edgeId: string, sourceNode: string, targetNode: string) => void;
  hasClipboardData?: () => boolean;
}

interface ButtonEdgeProps extends Omit<EdgeProps, 'data'> {
  data?: ButtonEdgeData;
  targetHandle?: string | null;
  currentAnimatedNodeId?: string | null;
}

/**
 * Check if an edge is a tool edge (connects to agent's bottom input handles)
 * Tool edges should not have "+" buttons as they are static connections
 */
function isToolEdge(targetHandle?: string | null): boolean {
  return targetHandle === 'tool' || 
         targetHandle === 'chat-model' || 
         targetHandle === 'memory';
}

export const ButtonEdge: React.FC<ButtonEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
  targetHandle: targetHandleProp,
  data,
  markerEnd,
  style = {},
  currentAnimatedNodeId,
}) => {
  const { getEdge, getNode } = useReactFlow();
  
  // Get the actual edge object to access targetHandle and type
  // ReactFlow may not always pass targetHandle as a prop, so we get it from the edge object
  const edge = getEdge(id);
  const targetHandle = targetHandleProp || edge?.targetHandle;
  const sourceHandle = edge?.sourceHandle;
  const edgeType = edge?.type;
  
  // CRITICAL: Also check if source node is a tool node
  // This is a fallback in case the edge type is not correctly set
  const sourceNode = source ? getNode(source) : null;
  const isSourceTool = sourceNode?.type === 'tool' || (sourceNode?.type && isToolNodeType(sourceNode.type));

  // CRITICAL: Check if this is a loop edge (handle-based detection)
  // If it's a loopEdge type, it should NEVER be rendered as ButtonEdge
  // ReactFlow should use LoopEdge instead
  const isLoopEdgeConnection = 
    edgeType === EDGE_TYPE_LOOP || 
    isLoopHandle(sourceHandle) || 
    isLoopHandle(targetHandle);
  
  if (isLoopEdgeConnection) {
    // This edge should be rendered by LoopEdge, not ButtonEdge
    if (edgeType === EDGE_TYPE_LOOP) {
      console.warn('[ButtonEdge] ERROR: ButtonEdge was called for a loopEdge! ReactFlow should use LoopEdge instead.', { 
        id, 
        edgeType, 
        sourceHandle, 
        targetHandle 
      });
    }
    return null;
  }

  // CRITICAL: Check if this is a tool edge (by type OR by target handle OR by source node type)
  // If it's a toolEdge type, it should NEVER be rendered as ButtonEdge
  // ReactFlow should use ToolEdgeComponent instead
  const isToolEdgeConnection = 
    edgeType === 'toolEdge' || 
    isToolEdge(targetHandle) || 
    (isSourceTool && isToolEdge(targetHandle));

  // If this is a tool edge, don't render anything (ToolEdgeComponent will handle it)
  // This prevents the "+" button from appearing on tool edges
  if (isToolEdgeConnection) {
    // This edge should be rendered by ToolEdgeComponent, not ButtonEdge
    // Return null to prevent any rendering (including the "+" button)
    // NOTE: If you see this log, it means ButtonEdge was called for a tool edge
    // This should NOT happen if ReactFlow is using the correct edge component
    if (edgeType === 'toolEdge') {
      console.warn('[ButtonEdge] ERROR: ButtonEdge was called for a toolEdge! ReactFlow should use ToolEdgeComponent instead.', { id, edgeType, targetHandle, sourceNodeType: sourceNode?.type });
    }
    return null;
  }
  
  // Additional safety check: if edge is undefined but targetHandle suggests it's a tool edge
  if (!edge && isToolEdge(targetHandle)) {
    return null;
  }

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleAddNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onAddNode) {
      data.onAddNode(id, source, target);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if clipboard has data and paste-between callback exists
    if (data?.hasClipboardData?.() && data?.onPasteBetween) {
      data.onPasteBetween(id, source, target);
    }
  };

  // Don't show button for tool edges (agent bottom inputs or toolEdge type)
  const showButton = !isToolEdgeConnection;

  // Check if this edge is connected to the currently animated node
  const isActiveEdge = currentAnimatedNodeId === source || currentAnimatedNodeId === target;
  
  // Enhanced style for active edges during execution
  const edgeStyle = isActiveEdge && currentAnimatedNodeId
    ? {
        ...style,
        stroke: '#10b981', // Emerald-500
        strokeWidth: 3,
        transition: 'all 0.3s ease',
      }
    : style;

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={edgeStyle}
        className={isActiveEdge ? 'animate-pulse' : ''}
      />
      {showButton && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <button
              onClick={handleAddNode}
              onContextMenu={handleContextMenu}
              className="group flex items-center justify-center w-6 h-6 bg-white border-2 border-gray-300 rounded-full shadow-md hover:shadow-lg hover:bg-blue-500 hover:border-blue-500 transition-all duration-150 hover:scale-125 cursor-pointer"
              title="Add node (Right-click to paste)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors"
                strokeWidth={3}
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default ButtonEdge;

