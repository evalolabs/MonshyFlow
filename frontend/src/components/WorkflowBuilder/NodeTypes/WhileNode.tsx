/**
 * WhileNode Component
 * 
 * A loop node that executes a block of nodes repeatedly while a condition is true.
 * Features:
 * - Normal input/output (like all other nodes)
 * - Two additional handles at the bottom:
 *   - "loop" handle (left) - continues the loop
 *   - "back" handle (right) - receives loop-back connections
 */

import { Position } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { NodeProps } from '@xyflow/react';

export function WhileNode({ data }: NodeProps) {
  const label = typeof data?.label === 'string' ? data.label : 'While Loop';
  const condition = typeof data?.condition === 'string' ? data.condition : 'No condition set';
  const maxIterations = typeof data?.maxIterations === 'number' ? data.maxIterations : 100;

  return (
    <BaseNode
      label={label}
      icon="🔄"
      category="logic"
      subtitle={`While: ${condition.substring(0, 25)}${condition.length > 25 ? '...' : ''}`}
      badge={`Max: ${maxIterations.toString()}`}
      hasInput={true}
      hasOutput={true}
      additionalHandles={[
        {
          id: 'loop',
          type: 'source',
          position: Position.Bottom,
          label: 'Loop',
          style: { 
            bottom: '-6px', 
            left: '35%', 
            transform: 'translateX(-50%)',
            background: '#a855f7', // Purple for loop
          }
        },
        {
          id: 'back',
          type: 'target',
          position: Position.Left,
          label: 'Back',
          style: { 
            left: '-6px', 
            top: '60%', 
            transform: 'translateY(-50%)',
            background: '#ef4444', // Red for back
          }
        },
      ]}
    />
  );
}

