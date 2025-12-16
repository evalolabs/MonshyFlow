/**
 * Transform Node Component
 * 
 * Node for transforming or extracting data from previous nodes
 */

import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';

export function TransformNode({ data, selected }: NodeProps) {
  const safeData = data || {};
  const label = (safeData.label as string) || 'Transform';
  const transformMode = (safeData.transformMode || 'extract_path') as string;
  const extractPath = (safeData.extractPath || 'data') as string;

  const getSubtitle = () => {
    if (transformMode === 'extract_path' && extractPath) {
      return `Extract: ${extractPath}`;
    }
    if (transformMode === 'extract_data') {
      return 'Extract Data';
    }
    if (transformMode === 'custom') {
      return 'Custom Expression';
    }
    return 'Full NodeData';
  };

  return (
    <BaseNode
      label={label}
      icon="🔄"
      category="core"
      subtitle={getSubtitle()}
      hasInput={true}
      hasOutput={true}
      selected={selected}
    />
  );
}

