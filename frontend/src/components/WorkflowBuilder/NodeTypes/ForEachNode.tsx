/**
 * ForEachNode Component
 * 
 * A loop node that iterates over an array and executes a block of nodes for each item.
 * Features:
 * - Normal input/output (like all other nodes)
 * - Two additional handles at the bottom:
 *   - "loop" handle (left) - continues to next item
 *   - "back" handle (right) - receives loop-back connections
 */

import { Position } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { NodeProps } from '@xyflow/react';

export function ForEachNode({ data, selected }: NodeProps) {
  const label = typeof data?.label === 'string' ? data.label : 'For Each';
  const arrayPath = typeof data?.arrayPath === 'string' ? data.arrayPath : 'No array path set';

  return (
    <BaseNode
      label={label}
      icon="🔁"
      category="logic"
      subtitle={`Array: ${arrayPath.substring(0, 25)}${arrayPath.length > 25 ? '...' : ''}`}
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
      selected={selected}
    />
  );
}

