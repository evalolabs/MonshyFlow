import { BaseNode } from './BaseNode';

interface EndNodeProps {
  data: {
    label?: string;
    result?: string;
  };
}

export function EndNode({ data }: EndNodeProps) {
  const safeData = data || {};
  
  return (
    <BaseNode
      label={safeData.label || 'End'}
      icon="⬛"
      category="core"
      subtitle={safeData.result || 'Workflow End'}
      hasInput={true}
      hasOutput={false}
    />
  );
}
