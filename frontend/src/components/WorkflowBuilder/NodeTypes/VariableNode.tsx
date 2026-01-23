/**
 * Variable Node Component
 * 
 * Professional node for declaring or updating workflow variables
 * Supports complex data types: objects, arrays, primitives
 */

import type { NodeProps, Node } from '@xyflow/react';
import { BaseNode } from './BaseNode';

export function VariableNode(props: NodeProps) {
  const { data, id, type, selected } = props;
  const safeData = data || {};
  const label = (safeData.label as string) || 'Set Variable';
  const variableName = (safeData.variableName as string) || '';
  const variableValue = safeData.variableValue;
  
  const getSubtitle = () => {
    if (!variableName) {
      return 'Set Variable';
    }
    
    const variablePath = safeData.variablePath as string | undefined;
    const pathDisplay = variablePath ? `.${variablePath}` : '';
    
    // Show preview of variable value
    if (variableValue !== undefined && variableValue !== null && variableValue !== '') {
      try {
        // If it's a string that might be JSON, try to parse it
        let displayValue = variableValue;
        if (typeof variableValue === 'string' && (variableValue.startsWith('{') || variableValue.startsWith('['))) {
          try {
            displayValue = JSON.parse(variableValue);
          } catch {
            // Not valid JSON, use as string
          }
        }
        
        // Format display based on type
        if (typeof displayValue === 'string') {
          const maxLength = 20;
          return `${variableName}${pathDisplay} = "${displayValue.length > maxLength ? displayValue.substring(0, maxLength) + '...' : displayValue}"`;
        } else if (typeof displayValue === 'number' || typeof displayValue === 'boolean') {
          return `${variableName}${pathDisplay} = ${String(displayValue)}`;
        } else if (Array.isArray(displayValue)) {
          return `${variableName}${pathDisplay} = Array[${displayValue.length}]`;
        } else if (typeof displayValue === 'object') {
          const keys = Object.keys(displayValue);
          return `${variableName}${pathDisplay} = Object{${keys.length} keys}`;
        } else {
          return `${variableName}${pathDisplay} = ${String(displayValue)}`;
        }
      } catch {
        return `${variableName}${pathDisplay} = ${String(variableValue)}`;
      }
    }
    
    return `${variableName}${pathDisplay} = (read)`;
  };

  const node: Node = {
    id: id || '',
    type: type || 'variable',
    data: safeData,
    position: { x: (props as any).xPos || 0, y: (props as any).yPos || 0 },
  };

  // Extract animation props from data
  const isAnimating = (safeData as any).isAnimating || false;
  const executionStatus = (safeData as any).executionStatus || 'idle';

  return (
    <BaseNode
      label={label}
      icon="📝"
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

