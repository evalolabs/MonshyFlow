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
}

export const AddNodeButton: React.FC<AddNodeButtonProps> = ({ nodeId, sourceHandle, onClick }) => {
  const { getNode } = useReactFlow();
  const { x: viewportX, y: viewportY, zoom } = useViewport();
  
  const sourceNode = getNode(nodeId);
  
  if (!sourceNode) {
    return null;
  }
  
  // Get actual node dimensions from ReactFlow (measured after render)
  const nodeWidth = sourceNode.width || 220;
  const nodeHeight = sourceNode.height || 100;
  
  let nodeRelativeX, nodeRelativeY;
  
  // Parallel Node - Multiple outputs at different positions
  if (sourceHandle?.startsWith('output-')) {
    nodeRelativeX = sourceNode.position.x + nodeWidth + 25;
    
    if (sourceHandle === 'output-1') {
      nodeRelativeY = sourceNode.position.y + nodeHeight * 0.25; // 25% from top
    } else if (sourceHandle === 'output-2') {
      nodeRelativeY = sourceNode.position.y + nodeHeight * 0.50; // 50% from top (middle)
    } else if (sourceHandle === 'output-3') {
      nodeRelativeY = sourceNode.position.y + nodeHeight * 0.75; // 75% from top
    } else if (sourceHandle === 'output-bottom') {
      nodeRelativeX = sourceNode.position.x + nodeWidth / 2;
      nodeRelativeY = sourceNode.position.y + nodeHeight + 25; // Below node
    } else {
      nodeRelativeY = sourceNode.position.y + nodeHeight / 2;
    }
  }
  // IfElse Node - true/false handles
  else if (sourceHandle === 'true') {
    nodeRelativeX = sourceNode.position.x + nodeWidth + 25;
    nodeRelativeY = sourceNode.position.y + nodeHeight * 0.35; // 35% from top
  }
  else if (sourceHandle === 'false') {
    nodeRelativeX = sourceNode.position.x + nodeWidth / 2;
    nodeRelativeY = sourceNode.position.y + nodeHeight + 25; // Below node
  }
  // While Node - loop and back handles (bottom)
  else if (sourceHandle === 'loop' || sourceHandle === 'back') {
    nodeRelativeX = sourceNode.position.x + nodeWidth * (sourceHandle === 'loop' ? 0.35 : 0.65);
    nodeRelativeY = sourceNode.position.y + nodeHeight + 25; // Below node
  }
  // Normal nodes - default center position
  else {
    nodeRelativeX = sourceNode.position.x + nodeWidth + 25;
    nodeRelativeY = sourceNode.position.y + 50; // Exact center (50px for 100px height nodes)
  }
  
  // Apply ReactFlow viewport transformation
  const buttonX = nodeRelativeX * zoom + viewportX;
  const buttonY = nodeRelativeY * zoom + viewportY;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };
  
  // Determine button styling based on handle type
  const isLoopHandle = sourceHandle === 'loop' || sourceHandle === 'back';
  const buttonClasses = isLoopHandle
    ? sourceHandle === 'back'
      ? 'flex items-center justify-center w-8 h-8 bg-white border-2 border-red-500 rounded-full shadow-lg hover:shadow-xl hover:bg-red-500 hover:border-red-600 transition-all duration-200 hover:scale-125 cursor-pointer group'
      : 'flex items-center justify-center w-8 h-8 bg-white border-2 border-purple-500 rounded-full shadow-lg hover:shadow-xl hover:bg-purple-500 hover:border-purple-600 transition-all duration-200 hover:scale-125 cursor-pointer group'
    : 'flex items-center justify-center w-8 h-8 bg-white border-2 border-blue-500 rounded-full shadow-lg hover:shadow-xl hover:bg-blue-500 hover:border-blue-600 transition-all duration-200 hover:scale-125 cursor-pointer group';
  
  const iconClasses = isLoopHandle
    ? sourceHandle === 'back'
      ? 'w-4 h-4 text-red-600 group-hover:text-white transition-colors'
      : 'w-4 h-4 text-purple-600 group-hover:text-white transition-colors'
    : 'w-4 h-4 text-blue-600 group-hover:text-white transition-colors';
  
  const buttonTitle = isLoopHandle
    ? sourceHandle === 'back'
      ? 'Add node in loop (back)'
      : 'Add node in loop (continue)'
    : 'Add next node';
  
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

