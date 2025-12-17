/**
 * Transform Node Component
 * 
 * Node for transforming or extracting data from previous nodes
 */

import type { NodeProps, Node } from '@xyflow/react';
import { BaseNode } from './BaseNode';

export function TransformNode(props: NodeProps) {
  const { data, id, type, selected } = props;
  const safeData = data || {};
  const label = (safeData.label as string) || 'Transform';
  const transformMode = (safeData.transformMode || 'extract_path') as string;
  const extractPath = (safeData.extractPath || 'data') as string;

  const getSubtitle = () => {
    if (transformMode === 'extract_path' && extractPath) {
      return `Extract: ${extractPath}`;
    }
    if (transformMode === 'extract_data') {
      return 'Extract Data';
    }
    if (transformMode === 'custom') {
      return 'Custom Expression';
    }
    return 'Full NodeData';
  };

  const node: Node = {
    id: id || '',
    type: type || 'transform',
    data: safeData,
    position: { x: (props as any).xPos || 0, y: (props as any).yPos || 0 },
  };

  return (
    <BaseNode
      label={label}
      icon="🔄"
      category="core"
      subtitle={getSubtitle()}
      hasInput={true}
      hasOutput={true}
      node={node}
      onUpdateComment={(safeData as any).onUpdateComment as ((nodeId: string, comment: string) => void) | undefined}
      showInfoOverlay={((safeData as any).showInfoOverlay as boolean | undefined) ?? true}
      secrets={((safeData as any).secrets as Array<{ key: string; isActive: boolean }>) || []}
      selected={selected}
    />
  );
}

