/**
 * LoopEdge Component
 * 
 * Special edge type for while loop connections.
 * Features:
 * - Dashed line style (different from normal edges)
 * - Purple/red color scheme (different from normal blue edges)
 * - Separate + button system (different styling)
 * - Used for "loop" and "back" handles on while nodes
 */

import React from 'react';
import { getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { LOOP_HANDLE_IDS } from '../constants';

interface LoopEdgeData {
  onAddNode?: (edgeId: string, sourceNode: string, targetNode: string) => void;
  loopType?: 'loop' | 'back'; // Type of loop connection
}

interface LoopEdgeProps extends Omit<EdgeProps, 'data'> {
  data?: LoopEdgeData;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  currentAnimatedNodeId?: string | null;
}

export const LoopEdge: React.FC<LoopEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
  sourceHandle,
  targetHandle,
  data,
  markerEnd,
  style = {},
  currentAnimatedNodeId,
}) => {
  // Determine loop type from handles or data
  // Priority: data.loopType > targetHandle === 'back' > sourceHandle === 'back' > sourceHandle === 'loop' > default 'loop'
  const loopType = data?.loopType || 
    (targetHandle === LOOP_HANDLE_IDS.BACK ? 'back' :  // Check targetHandle first (for loop-back edges)
     sourceHandle === LOOP_HANDLE_IDS.BACK ? 'back' : 
     sourceHandle === LOOP_HANDLE_IDS.LOOP ? 'loop' : 
     'loop');

  // Custom path for loop-back edges: go down from source, then left, then up to while node
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (loopType === 'back') {
    // For back edges: create a custom path that goes down, far left, then up along left side
    // This creates a visual loop that goes under the loop nodes and connects to the INPUT handle
    // Path: down -> far left -> up vertically along left side of while node -> to input handle
    // NOTE: targetX/targetY are the Back-Handle position (left side, 60% from top)
    const nodeHeight = 100; // Approximate node height
    const verticalOffset = 20; // Distance to go down from source node
    
    // Start point: bottom of source node
    const startX = sourceX;
    const startY = sourceY + nodeHeight / 2 + 10; // Bottom of source node
    
    // Waypoint 1: Go down
    const downY = startY + verticalOffset;
    
    // targetX/targetY are the Back-Handle position (left side, 60% from top)
    // Back handle is at left side of while node, 60% from top
    const backX = targetX; // Left side of while node (where back handle is)
    const backY = targetY; // 60% from top of while node
    
    // Calculate left side of while node for the far left waypoint
    const whileNodeLeftX = backX;
    
    // Go significantly further left to create a wide arc (100px+ beyond the left edge)
    const farLeftX = whileNodeLeftX - 100;
    
    // Create path: down -> far left -> up vertically along left side -> horizontal to back handle
    // Path structure: start -> down -> far left -> up vertically -> horizontal to back handle
    edgePath = `M ${startX},${startY} L ${startX},${downY} L ${farLeftX},${downY} L ${farLeftX},${backY} L ${backX},${backY}`;
    
    // Calculate label position (middle of the horizontal segment at bottom)
    labelX = (startX + farLeftX) / 2;
    labelY = downY;
  } else {
    // For regular loop edges: use standard smooth step path
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }

  const handleAddNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔘 [LoopEdge] + button clicked', {
      edgeId: id,
      source,
      target,
      sourceHandle,
      targetHandle,
      loopType,
      hasOnAddNode: !!data?.onAddNode,
      dataKeys: data ? Object.keys(data) : [],
    });
    
    if (data?.onAddNode) {
      console.log('✅ [LoopEdge] Calling onAddNode callback');
      data.onAddNode(id, source, target);
    } else {
      console.warn('❌ [LoopEdge] onAddNode callback is missing!', {
        edgeId: id,
        data,
      });
    }
  };

  // Check if this edge is connected to the currently animated node
  const isActiveEdge = currentAnimatedNodeId === source || currentAnimatedNodeId === target;
  
  // Loop edge styling: dashed line, purple/red color
  // Enhanced for active edges during execution
  const loopEdgeStyle = {
    ...style,
    strokeWidth: isActiveEdge ? 3.5 : 2.5,
    stroke: isActiveEdge 
      ? '#10b981' // Emerald for active edges
      : (loopType === 'back' ? '#ef4444' : '#a855f7'), // Red for back, purple for loop
    strokeDasharray: '8,4', // Dashed line
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    transition: 'all 0.3s ease',
  };

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={loopEdgeStyle}
        className={isActiveEdge ? 'animate-pulse' : ''}
      />
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
            className={`group flex items-center justify-center w-7 h-7 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-125 cursor-pointer ${
              loopType === 'back' 
                ? 'bg-white border-2 border-red-500 hover:bg-red-500' 
                : 'bg-white border-2 border-purple-500 hover:bg-purple-500'
            }`}
            title={`Add node in loop ${loopType === 'back' ? '(back)' : '(continue)'}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className={`w-4 h-4 transition-colors ${
                loopType === 'back' 
                  ? 'text-red-600 group-hover:text-white' 
                  : 'text-purple-600 group-hover:text-white'
              }`}
              strokeWidth={3}
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default LoopEdge;

