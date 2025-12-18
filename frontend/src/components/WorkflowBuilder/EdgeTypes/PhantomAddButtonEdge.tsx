import React from 'react';
import { EdgeLabelRenderer, useReactFlow } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

interface PhantomAddButtonEdgeData {
  onAddNode?: () => void;
}

interface PhantomAddButtonEdgeProps extends Omit<EdgeProps, 'data'> {
  data?: PhantomAddButtonEdgeData;
  sourceHandle?: string | null;
}

export const PhantomAddButtonEdge: React.FC<PhantomAddButtonEdgeProps> = (props) => {
  const { source, data } = props;
  const { getNode } = useReactFlow();
  
  // Get the actual node to calculate button position
  const sourceNode = getNode(source);

  if (!sourceNode) {
    return null; // Node not found, don't render
  }
  
  // Calculate button position based on node position and type
  // Use measured dimensions when available (handles pill/compact nodes correctly)
  const measuredWidth =
    sourceNode.measured?.width ?? (sourceNode.data as any)?.widthPx ?? (sourceNode as any)?.width ?? 220;
  const measuredHeight =
    sourceNode.measured?.height ?? (sourceNode.data as any)?.heightPx ?? (sourceNode as any)?.height ?? 100;

  // Prefer absolute position when available (ReactFlow internal), fallback to position
  const baseX = (sourceNode as any).positionAbsolute?.x ?? sourceNode.position.x;
  const baseY = (sourceNode as any).positionAbsolute?.y ?? sourceNode.position.y;

  // Keep the phantom "+" close to the node output (avoid drifting far right on long empty lanes)
  // Slightly larger offset helps avoid overlapping the node border/handle.
  const offsetX = 24;

  const buttonX = baseX + measuredWidth + offsetX;
  const buttonY = baseY + measuredHeight / 2;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onAddNode) {
      data.onAddNode();
    }
  };

  return (
    <>
      {/* No visible edge - just the button */}
      {/* Position button absolutely based on node position */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${buttonX}px,${buttonY}px)`,
            pointerEvents: 'all',
            zIndex: 1000, // Ensure button is visible above other elements
          }}
          className="nodrag nopan"
        >
          <button
            onClick={handleClick}
            className="flex items-center justify-center w-8 h-8 bg-white border-2 border-blue-500 rounded-full shadow-lg hover:shadow-xl hover:bg-blue-500 hover:border-blue-600 transition-all duration-200 hover:scale-125 cursor-pointer group"
            title="Add next node"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors"
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

export default PhantomAddButtonEdge;

