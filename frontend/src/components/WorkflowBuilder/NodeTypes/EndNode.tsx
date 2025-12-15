import { BaseNode } from './BaseNode';

interface EndNodeProps {
  data: {
    label?: string;
    result?: string;
    isAnimating?: boolean;
    executionStatus?: 'idle' | 'running' | 'completed' | 'failed';
  };
}

export function EndNode({ data }: EndNodeProps) {
  const safeData = data || {};
  
  // Extract animation props (added at runtime by nodeRegistry)
  const isAnimating = data?.isAnimating ?? false;
  const executionStatus = data?.executionStatus ?? 'idle';
  
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
    />
  );
}
