/**
 * AddNodeButton Component
 * 
 * Floating button that appears next to nodes without outgoing connections.
 * Allows users to quickly add the next node in the workflow.
 */

import React from 'react';
import { useReactFlow, useViewport } from '@xyflow/react';

interface AddNodeButtonProps {
  nodeId: string;
  sourceHandle?: string;
  onClick: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}

export const AddNodeButton: React.FC<AddNodeButtonProps> = ({ nodeId, sourceHandle, onClick, onContextMenu }) => {
  const { getNode } = useReactFlow();
  const { x: viewportX, y: viewportY, zoom } = useViewport();
  
  const sourceNode = getNode(nodeId);
  
  if (!sourceNode) {
    return null;
  }
  
  // Get actual node dimensions from ReactFlow (measured after render)
  const nodeWidth =
    sourceNode.measured?.width ?? (sourceNode.data as any)?.widthPx ?? (sourceNode as any)?.width ?? 220;
  const nodeHeight =
    sourceNode.measured?.height ?? (sourceNode.data as any)?.heightPx ?? (sourceNode as any)?.height ?? 100;

  // Prefer absolute position when available (important for grouped/parented nodes)
  const baseX = (sourceNode as any).positionAbsolute?.x ?? sourceNode.position.x;
  const baseY = (sourceNode as any).positionAbsolute?.y ?? sourceNode.position.y;
  
  let nodeRelativeX, nodeRelativeY;
  
  // Parallel Node - Multiple outputs at different positions
  if (sourceHandle?.startsWith('output-')) {
    nodeRelativeX = baseX + nodeWidth + 25;
    
    if (sourceHandle === 'output-1') {
      nodeRelativeY = baseY + nodeHeight * 0.25; // 25% from top
    } else if (sourceHandle === 'output-2') {
      nodeRelativeY = baseY + nodeHeight * 0.50; // 50% from top (middle)
    } else if (sourceHandle === 'output-3') {
      nodeRelativeY = baseY + nodeHeight * 0.75; // 75% from top
    } else if (sourceHandle === 'output-bottom') {
      nodeRelativeX = baseX + nodeWidth / 2;
      nodeRelativeY = baseY + nodeHeight + 25; // Below node
    } else {
      nodeRelativeY = baseY + nodeHeight / 2;
    }
  }
  // IfElse Node - true/false handles
  // Both handles are on the right side, at 40% and 70% from top
  else if (sourceHandle === 'true') {
    nodeRelativeX = baseX + nodeWidth + 25; // Right side
    nodeRelativeY = baseY + nodeHeight * 0.40; // 40% from top (matches handle position)
  }
  else if (sourceHandle === 'false') {
    nodeRelativeX = baseX + nodeWidth + 25; // Right side
    nodeRelativeY = baseY + nodeHeight * 0.70; // 70% from top (matches handle position)
  }
  // While Node - loop and back handles (bottom)
  else if (sourceHandle === 'loop' || sourceHandle === 'back') {
    nodeRelativeX = baseX + nodeWidth * (sourceHandle === 'loop' ? 0.35 : 0.65);
    nodeRelativeY = baseY + nodeHeight + 25; // Below node
  }
  // Normal nodes - default center position
  else {
    nodeRelativeX = baseX + nodeWidth + 25;
    nodeRelativeY = baseY + nodeHeight / 2; // true vertical center for any node height
  }
  
  // Apply ReactFlow viewport transformation
  const buttonX = nodeRelativeX * zoom + viewportX;
  const buttonY = nodeRelativeY * zoom + viewportY;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e);
    }
  };
  
  // Determine button styling based on handle type
  const isLoopHandle = sourceHandle === 'loop' || sourceHandle === 'back';
  const isIfElseHandle = sourceHandle === 'true' || sourceHandle === 'false';
  
  let buttonClasses: string;
  let iconClasses: string;
  let buttonTitle: string;
  
  if (isLoopHandle) {
    buttonClasses = sourceHandle === 'back'
      ? 'flex items-center justify-center w-8 h-8 bg-white border-2 border-red-500 rounded-full shadow-lg hover:shadow-xl hover:bg-red-500 hover:border-red-600 transition-all duration-200 hover:scale-125 cursor-pointer group'
      : 'flex items-center justify-center w-8 h-8 bg-white border-2 border-purple-500 rounded-full shadow-lg hover:shadow-xl hover:bg-purple-500 hover:border-purple-600 transition-all duration-200 hover:scale-125 cursor-pointer group';
    iconClasses = sourceHandle === 'back'
      ? 'w-4 h-4 text-red-600 group-hover:text-white transition-colors'
      : 'w-4 h-4 text-purple-600 group-hover:text-white transition-colors';
    buttonTitle = sourceHandle === 'back'
      ? 'Add node in loop (back)'
      : 'Add node in loop (continue)';
  } else if (isIfElseHandle) {
    // If-Else handles: green for true, red for false
    buttonClasses = sourceHandle === 'true'
      ? 'flex items-center justify-center w-8 h-8 bg-white border-2 border-green-500 rounded-full shadow-lg hover:shadow-xl hover:bg-green-500 hover:border-green-600 transition-all duration-200 hover:scale-125 cursor-pointer group'
      : 'flex items-center justify-center w-8 h-8 bg-white border-2 border-red-500 rounded-full shadow-lg hover:shadow-xl hover:bg-red-500 hover:border-red-600 transition-all duration-200 hover:scale-125 cursor-pointer group';
    iconClasses = sourceHandle === 'true'
      ? 'w-4 h-4 text-green-600 group-hover:text-white transition-colors'
      : 'w-4 h-4 text-red-600 group-hover:text-white transition-colors';
    buttonTitle = sourceHandle === 'true'
      ? 'Add node (True branch)'
      : 'Add node (False branch)';
  } else {
    // Default: blue for normal nodes
    buttonClasses = 'flex items-center justify-center w-8 h-8 bg-white border-2 border-blue-500 rounded-full shadow-lg hover:shadow-xl hover:bg-blue-500 hover:border-blue-600 transition-all duration-200 hover:scale-125 cursor-pointer group';
    iconClasses = 'w-4 h-4 text-blue-600 group-hover:text-white transition-colors';
    buttonTitle = 'Add next node';
  }
  
  return (
    <div
      style={{
        position: 'absolute',
        left: buttonX,
        top: buttonY,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'all',
        zIndex: 1000,
      }}
      className="nodrag nopan"
    >
      <button
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={buttonClasses}
        title={buttonTitle}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className={iconClasses}
          strokeWidth={3}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
};

