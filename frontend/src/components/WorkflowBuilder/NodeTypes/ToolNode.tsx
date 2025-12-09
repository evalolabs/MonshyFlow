/**
 * ToolNode Component
 * 
 * Circular tool nodes that can only be connected to Agent Tool handles.
 * These are visually distinct from regular workflow nodes (round instead of rectangular).
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

export function ToolNode({ data, selected }: ToolNodeProps) {
  const safeData = data || {};
  const toolId = safeData.toolId || safeData.type || '';
  const isAnimating = safeData.isAnimating || false;
  const executionStatus = safeData.executionStatus || 'idle';
  
  // Get tool definition
  const toolDef = getToolDefinition(toolId);
  const fallbackName = toolDef?.name || 'Tool';
  const rawLabel = typeof safeData.label === 'string' ? safeData.label.trim() : '';
  const genericLabels = new Set(['agent', 'tool', 'ai agent']);
  const toolName = rawLabel && !genericLabels.has(rawLabel.toLowerCase()) ? rawLabel : fallbackName;
  const toolIcon = toolDef?.icon || '🔧';
  const toolColor = toolDef?.color || 'gray';
  const colorClass = colorClasses[toolColor] || colorClasses.blue;

  // Determine border color based on execution status
  const getBorderColor = () => {
    if (executionStatus === 'running' && isAnimating) {
      return 'border-blue-500 animate-pulse';
    }
    if (executionStatus === 'completed') {
      return 'border-green-500';
    }
    if (executionStatus === 'failed') {
      return 'border-red-500';
    }
    return colorClass.border;
  };

  // Tool nodes are circular (80x80)
  const size = 80;

  return (
    <div className="relative">
      {/* Output Handle - Right side (connects to Agent Tool input) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className={`w-3 h-3 ${colorClass.bg} border-2 border-white shadow-md`}
        style={{
          right: -6,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />

      {/* Circular Tool Node */}
      <div
        className={`
          relative rounded-full ${colorClass.bg} ${getBorderColor()} border-2
          flex flex-col items-center justify-center
          shadow-lg hover:shadow-xl transition-all duration-200
          ${selected ? 'ring-4 ring-blue-400 ring-offset-2' : ''}
          ${isAnimating && executionStatus === 'running' ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
        `}
        style={{
          width: size,
          height: size,
        }}
        title={toolName}
      >
        {/* Tool Icon */}
        <div className="text-2xl mb-1 relative">
          <span className={executionStatus === 'running' && isAnimating ? 'opacity-50' : ''}>
            {toolIcon}
          </span>
          
          {/* Spinner for running nodes */}
          {executionStatus === 'running' && isAnimating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-9 h-9 text-blue-500 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
          
          {/* X mark for failed nodes */}
          {executionStatus === 'failed' && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-scale-in">
              <svg
                className="w-2.5 h-2.5 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Tool Label (truncated if too long) */}
        <div className={`text-[10px] font-semibold ${colorClass.text} text-center px-1 max-w-full truncate`}>
          {toolName}
        </div>
      </div>
    </div>
  );
}
