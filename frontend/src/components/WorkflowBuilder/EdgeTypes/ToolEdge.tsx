/**
 * ToolEdge Component
 * 
 * Special edge type for Tool nodes connecting to Agent nodes.
 * No "+" button, simpler appearance, only connects tools to agents.
 */

import React from 'react';
import { BaseEdge, getSmoothStepPath } from '@xyflow/react';

interface ToolEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  style?: React.CSSProperties;
  markerEnd?: string;
  selected?: boolean;
}

export const ToolEdge: React.FC<ToolEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? '#3b82f6' : '#94a3b8',
          strokeWidth: selected ? 2.5 : 2,
          strokeDasharray: '5,5', // Dashed line to distinguish from regular edges
        }}
      />
    </>
  );
};

