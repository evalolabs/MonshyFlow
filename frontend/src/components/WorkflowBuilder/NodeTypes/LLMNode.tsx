import { BaseNode } from './BaseNode';
import type { NodeProps, Node } from '@xyflow/react';

export function LLMNode(props: NodeProps) {
  const { data, id, type, selected } = props;
  const safeData = (data || {}) as any;
  
  const getSubtitle = () => {
    if (safeData.model) return safeData.model;
    return 'Language Model';
  };

  const node: Node = {
    id: id || '',
    type: type || 'llm',
    data: safeData,
    position: { x: (props as any).xPos || 0, y: (props as any).yPos || 0 },
  };

  return (
    <BaseNode
      label={safeData.label || 'LLM'}
      icon="🤖"
      category="ai"
      subtitle={getSubtitle()}
      hasInput={true}
      hasOutput={true}
      node={node}
      onUpdateComment={safeData.onUpdateComment as ((nodeId: string, comment: string) => void) | undefined}
      showInfoOverlay={(safeData.showInfoOverlay as boolean | undefined) ?? true}
      secrets={(safeData.secrets as Array<{ key: string; isActive: boolean }>) || []}
      selected={selected}
    />
  );
}
