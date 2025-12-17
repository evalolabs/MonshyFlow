import { BaseNode } from './BaseNode';
import type { NodeProps, Node } from '@xyflow/react';

export function EndNode(props: NodeProps) {
  const { data, id, type, selected } = props;
  const safeData = (data || {}) as any;
  
  // Extract animation props (added at runtime by nodeRegistry)
  const isAnimating = safeData.isAnimating ?? false;
  const executionStatus = safeData.executionStatus ?? 'idle';

  const node: Node = {
    id: id || '',
    type: type || 'end',
    data: safeData,
    position: { x: (props as any).xPos || 0, y: (props as any).yPos || 0 },
  };
  
  return (
    <BaseNode
      label={safeData.label || 'End'}
      icon="⬛"
      category="core"
      subtitle={safeData.result || 'Workflow End'}
      hasInput={true}
      hasOutput={false}
      isAnimating={isAnimating}
      executionStatus={executionStatus}
      node={node}
      onUpdateComment={safeData.onUpdateComment as ((nodeId: string, comment: string) => void) | undefined}
      showInfoOverlay={(safeData.showInfoOverlay as boolean | undefined) ?? true}
      secrets={(safeData.secrets as Array<{ key: string; isActive: boolean }>) || []}
      selected={selected}
    />
  );
}
