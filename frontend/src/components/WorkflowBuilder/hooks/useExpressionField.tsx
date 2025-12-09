/**
 * Hook for managing expression fields (with variable support)
 * 
 * Makes it easy to add ExpressionEditor to any node field.
 */

import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { ExpressionEditor } from '../ExpressionEditor';

interface UseExpressionFieldProps {
  value: string;
  onChange: (value: string) => void;
  fieldConfig: {
    type: 'expression';
    multiline?: boolean;
    rows?: number;
    placeholder?: string;
  };
  nodes: Node[];
  edges: Edge[];
  currentNodeId: string;
  previewSource?: any;
}

export function useExpressionField({
  value,
  onChange,
  fieldConfig,
  nodes,
  edges,
  currentNodeId,
  previewSource,
}: UseExpressionFieldProps) {
  const Component = useMemo(() => (
    <ExpressionEditor
      value={value || ''}
      onChange={onChange}
      placeholder={fieldConfig.placeholder}
      multiline={fieldConfig.multiline}
      rows={fieldConfig.rows}
      nodes={nodes}
      edges={edges}
      currentNodeId={currentNodeId}
      previewSource={previewSource}
    />
  ), [value, onChange, fieldConfig, nodes, edges, currentNodeId, previewSource]);

  return { Component };
}

