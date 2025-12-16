import { BaseNode } from './BaseNode';
import type { NodeProps } from '@xyflow/react';

export function EndNode({ data, selected }: NodeProps) {
  const safeData = (data || {}) as any;
  
  // Extract animation props (added at runtime by nodeRegistry)
  const isAnimating = safeData.isAnimating ?? false;
  const executionStatus = safeData.executionStatus ?? 'idle';
  
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
      selected={selected}
    />
  );
}
