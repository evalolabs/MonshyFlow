import { useState } from 'react';
import { BaseNode } from './BaseNode';
import type { StartNodeProps } from '../../../types/startNode';
import { ENTRY_TYPE_LABELS } from '../../../types/startNode';
import { InlineExecutionMonitor } from '../InlineExecutionMonitor';

export function StartNode({ data }: StartNodeProps) {
  const safeData = data || {};
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
  const isAnimating = data?.isAnimating ?? false;
  const executionStatus = data?.executionStatus ?? 'idle';


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

