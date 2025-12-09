import { BaseNode } from './BaseNode';

interface LLMNodeProps {
  data: {
    label?: string;
    model?: string;
    prompt?: string;
    temperature?: number;
  };
}

export function LLMNode({ data }: LLMNodeProps) {
  const safeData = data || {};
  
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
    />
  );
}
