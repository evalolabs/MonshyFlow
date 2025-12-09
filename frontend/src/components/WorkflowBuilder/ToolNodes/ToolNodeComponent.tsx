/**
 * ToolNodeComponent
 * 
 * Completely separate component for Tool nodes.
 * NOT a regular workflow node - tools are a different entity type.
 * Tools can only connect to Agent Tool handles.
 */

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { getToolDefinition } from '../../../types/toolCatalog';

interface ToolNodeData {
  label?: string;
  toolId?: string; // e.g., 'tool-web-search'
  [key: string]: any;
}

interface ToolNodeProps extends NodeProps {
  data: ToolNodeData;
}

const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
  purple: { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white' },
  blue: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  pink: { bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-white' },
  green: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' },
  indigo: { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-white' },
  amber: { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-white' },
  teal: { bg: 'bg-teal-500', border: 'border-teal-600', text: 'text-white' },
  yellow: { bg: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-white' },
};

export function ToolNodeComponent({ data, selected }: ToolNodeProps) {
  const safeData = data || {};
  const toolId = safeData.toolId || safeData.type || '';
  
  // Get tool definition
  const toolDef = getToolDefinition(toolId);
  const fallbackName = toolDef?.name || 'Tool';
  const rawLabel = typeof safeData.label === 'string' ? safeData.label.trim() : '';
  const genericLabels = new Set(['agent', 'tool', 'ai agent']);
  const toolName = rawLabel && !genericLabels.has(rawLabel.toLowerCase()) ? rawLabel : fallbackName;
  const toolIcon = toolDef?.icon || '🔧';
  const toolColor = toolDef?.color || 'gray';
  const colorClass = colorClasses[toolColor] || colorClasses.blue;

  // Tool nodes are circular (80x80) - completely different from rectangular nodes
  const size = 80;

  return (
    <div className="relative">
      {/* Output Handle - Top side (ONLY connects to Agent Tool input) */}
      <Handle
        type="source"
        position={Position.Top}
        id="tool-output"
        className={`w-3 h-3 ${colorClass.bg} border-2 border-white shadow-md`}
        style={{
          top: -6,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />

      {/* Circular Tool Node - Completely different visual style */}
      <div
        className={`
          relative rounded-full ${colorClass.bg} ${colorClass.border} border-2
          flex flex-col items-center justify-center
          shadow-lg hover:shadow-xl transition-all duration-200
          ${selected ? 'ring-4 ring-blue-400 ring-offset-2' : ''}
        `}
        style={{
          width: size,
          height: size,
        }}
        title={toolName}
      >
        {/* Tool Icon */}
        <div className="text-2xl mb-1">{toolIcon}</div>
        
        {/* Tool Label (truncated if too long) */}
        <div className={`text-[10px] font-semibold ${colorClass.text} text-center px-1 max-w-full truncate`}>
          {toolName}
        </div>
      </div>
    </div>
  );
}

