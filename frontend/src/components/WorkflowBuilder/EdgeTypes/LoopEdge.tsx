import React from 'react';
import { getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

interface LoopEdgeData {
  onAddNode?: (edgeId: string, sourceNode: string, targetNode: string) => void;
}

interface LoopEdgeProps extends Omit<EdgeProps, 'data'> {
  data?: LoopEdgeData;
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
  data,
  markerEnd,
  style = {},
}) => {
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

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          stroke: '#a855f7',
          strokeWidth: 2,
          strokeDasharray: '5,5',
          ...style
        }} 
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
            className="group flex items-center justify-center w-6 h-6 bg-white border-2 border-purple-300 rounded-full shadow-md hover:shadow-lg hover:bg-purple-500 hover:border-purple-500 transition-all duration-150 hover:scale-125 cursor-pointer"
            title="Add node to loop"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-3.5 h-3.5 text-purple-500 group-hover:text-white transition-colors"
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









