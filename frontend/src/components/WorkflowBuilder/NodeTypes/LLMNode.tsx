import { BaseNode } from './BaseNode';
import type { NodeProps } from '@xyflow/react';

export function LLMNode({ data, selected }: NodeProps) {
  const safeData = (data || {}) as any;
  
  const getSubtitle = () => {
    if (safeData.model) return safeData.model;
    return 'Language Model';
  };

  return (
    <BaseNode
      label={safeData.label || 'LLM'}
      icon="🤖"
      category="ai"
      subtitle={getSubtitle()}
      hasInput={true}
      hasOutput={true}
      selected={selected}
    />
  );
}
