/**
 * IfElseNode Component
 * 
 * A conditional node that executes different paths based on a condition.
 * Features:
 * - Normal input (like all other nodes)
 * - Two output handles:
 *   - "true" handle (right, ~40%) - executed when condition is true
 *   - "false" handle (right, ~70%) - executed when condition is false
 */

import { Position } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { NodeProps, Node } from '@xyflow/react';

export function IfElseNode(props: NodeProps) {
  const { data, id, type, selected } = props;
  const label = typeof data?.label === 'string' ? data.label : 'If / Else';
  const condition = typeof data?.condition === 'string' ? data.condition : 'No condition set';

  const safeData = (data || {}) as any;
  const node: Node = {
    id: id || '',
    type: type || 'ifelse',
    data: safeData,
    position: { x: (props as any).xPos || 0, y: (props as any).yPos || 0 },
  };

  return (
    <BaseNode
      label={label}
      icon="↗️"
      category="logic"
      subtitle={`Condition: ${condition.substring(0, 30)}${condition.length > 30 ? '...' : ''}`}
      hasInput={true}
      hasOutput={false}
      node={node}
      onUpdateComment={safeData.onUpdateComment as ((nodeId: string, comment: string) => void) | undefined}
      showInfoOverlay={(safeData.showInfoOverlay as boolean | undefined) ?? true}
      secrets={(safeData.secrets as Array<{ key: string; isActive: boolean }>) || []}
      additionalHandles={[
        {
          id: 'true',
          type: 'source',
          position: Position.Right,
          label: 'True',
          style: {
            right: '-6px',
            top: '40%',
            transform: 'translateY(-50%)',
            background: '#10b981', // Green for True
          }
        },
        {
          id: 'false',
          type: 'source',
          position: Position.Right,
          label: 'False',
          style: {
            right: '-6px',
            top: '70%',
            transform: 'translateY(-50%)',
            background: '#ef4444', // Red for False
          }
        },
      ]}
      selected={selected}
    />
  );
}

