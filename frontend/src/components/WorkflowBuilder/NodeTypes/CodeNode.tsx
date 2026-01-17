/**
 * Code Node Component
 * 
 * Node for executing custom JavaScript code in workflows
 */

import type { NodeProps, Node } from '@xyflow/react';
import { BaseNode } from './BaseNode';

export function CodeNode(props: NodeProps) {
  const { data, id, type, selected } = props;
  const safeData = data || {};
  const label = (safeData.label as string) || 'Code';
  const codeMode = (safeData.codeMode || 'allItems') as string;

  // IMPORTANT: Use the same nodeId extraction logic as nodeRegistry.ts
  // This ensures the nodeId matches what's used in executionSteps
  const nodeId = safeData.id || id || '';

  const getSubtitle = () => {
    if (codeMode === 'allItems') {
      return 'Run Once for All Items';
    }
    if (codeMode === 'eachItem') {
      return 'Run Once for Each Item';
    }
    return 'Code';
  };

  const node: Node = {
    id: nodeId,
    type: type || 'code',
    data: safeData,
    position: { x: (props as any).xPos || 0, y: (props as any).yPos || 0 },
  };

  // Extract animation props from data (passed by nodeRegistry.ts)
  const isAnimating = (safeData as any).isAnimating || false;
  const executionStatus = (safeData as any).executionStatus || 'idle';

  return (
    <BaseNode
      label={label}
      icon="💻"
      category="core"
      subtitle={getSubtitle()}
      hasInput={true}
      hasOutput={true}
      node={node}
      isAnimating={isAnimating}
      executionStatus={executionStatus}
      onUpdateComment={(safeData as any).onUpdateComment as ((nodeId: string, comment: string) => void) | undefined}
      showInfoOverlay={((safeData as any).showInfoOverlay as boolean | undefined) ?? true}
      secrets={((safeData as any).secrets as Array<{ key: string; isActive: boolean }>) || []}
      selected={selected}
    />
  );
}

