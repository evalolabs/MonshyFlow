import { useState } from 'react';
import { BaseNode } from './BaseNode';
import { ENTRY_TYPE_LABELS } from '../../../types/startNode';
import { InlineExecutionMonitor } from '../InlineExecutionMonitor';
import type { NodeProps, Node } from '@xyflow/react';

export function StartNode(props: NodeProps) {
  const { data, id, type, selected } = props;
  const safeData = (data || {}) as any;
  const [showExecutionMonitor, setShowExecutionMonitor] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  
  const getSubtitle = () => {
    if (safeData.entryType && safeData.entryType in ENTRY_TYPE_LABELS) {
      return ENTRY_TYPE_LABELS[safeData.entryType as keyof typeof ENTRY_TYPE_LABELS];
    }
    return 'Entry Point';
  };

  const getStatus = () => {
    // Show different status based on configuration completeness
    if (!safeData.endpoint || !safeData.baseUrl) {
      return 'warning'; // Incomplete configuration
    }
    return 'active'; // Ready to use
  };

  // Extract animation props (added at runtime by nodeRegistry)
  const isAnimating = safeData.isAnimating ?? false;
  const executionStatus = safeData.executionStatus ?? 'idle';

  const node: Node = {
    id: id || '',
    type: type || 'start',
    data: safeData,
    position: { x: (props as any).xPos || 0, y: (props as any).yPos || 0 },
  };

  return (
    <div className="relative">
      <BaseNode
        label={safeData.label || 'Start'}
        icon="🚀"
        category="core"
        subtitle={getSubtitle()}
        hasInput={false}
        hasOutput={true}
        status={getStatus()}
        isAnimating={isAnimating}
        executionStatus={executionStatus}
        node={node}
        onUpdateComment={safeData.onUpdateComment as ((nodeId: string, comment: string) => void) | undefined}
        showInfoOverlay={(safeData.showInfoOverlay as boolean | undefined) ?? true}
        secrets={(safeData.secrets as Array<{ key: string; isActive: boolean }>) || []}
        selected={selected}
      />
      
      {/* Inline Execution Monitor */}
      {showExecutionMonitor && currentExecutionId && (
        <div className="absolute top-full left-0 mt-2 z-50">
          <InlineExecutionMonitor
            executionId={currentExecutionId}
            onClose={() => {
              setShowExecutionMonitor(false);
              setCurrentExecutionId(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

