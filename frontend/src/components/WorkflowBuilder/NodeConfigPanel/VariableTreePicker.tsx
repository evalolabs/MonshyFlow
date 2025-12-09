import type { Edge, Node } from '@xyflow/react';
import { VariableTreePopover } from '../VariableTreePopover';

interface VariableTreePickerProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  nodes: Node[];
  edges: Edge[];
  currentNodeId: string;
  debugSteps: any[];
  onPick: (path: string) => void;
  onClose: () => void;
}

export function VariableTreePicker({
  open,
  anchorEl,
  nodes,
  edges,
  currentNodeId,
  debugSteps,
  onPick,
  onClose,
}: VariableTreePickerProps) {
  if (!open) {
    return null;
  }

  return (
    <VariableTreePopover
      anchorEl={anchorEl}
      nodes={nodes as any}
      edges={edges as any}
      currentNodeId={currentNodeId}
      debugSteps={debugSteps}
      onPick={onPick}
      onClose={onClose}
    />
  );
}


