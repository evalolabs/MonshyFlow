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
}) => {
  // Determine loop type from handles or data
  // Priority: data.loopType > targetHandle === 'back' > sourceHandle === 'back' > sourceHandle === 'loop' > default 'loop'
  const loopType = data?.loopType || 
    (targetHandle === LOOP_HANDLE_IDS.BACK ? 'back' :  // Check targetHandle first (for loop-back edges)
     sourceHandle === LOOP_HANDLE_IDS.BACK ? 'back' : 
     sourceHandle === LOOP_HANDLE_IDS.LOOP ? 'loop' : 
     'loop');

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

  // Loop edge styling: dashed line, purple/red color
  const loopEdgeStyle = {
    ...style,
    strokeWidth: 2.5,
    stroke: loopType === 'back' ? '#ef4444' : '#a855f7', // Red for back, purple for loop
    strokeDasharray: '8,4', // Dashed line
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={loopEdgeStyle} 
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

