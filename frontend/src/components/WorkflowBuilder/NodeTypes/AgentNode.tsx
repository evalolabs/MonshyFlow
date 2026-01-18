/**
 * AgentNode Component
 * 
 * AI Agent node with specialized input handle for Tools.
 * AI Agent architecture where tools are connected as inputs.
 * 
 * Structure:
 * - Input (left): Main workflow input (user prompt/data)
 * - Input (bottom): Tools (multiple tool nodes can be connected)
 * - Output (right): Final agent response
 */

import type { Node, NodeProps } from '@xyflow/react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { NodeInfoOverlay } from './NodeInfoOverlay';
import { useState } from 'react';
import { ENABLE_LAYOUT_LOCK } from '../../../utils/layoutLock';

export function AgentNode({ data, id, type, selected, ...props }: NodeProps) {
  const safeData = (data || {}) as Record<string, any>;
  const [isNodeHovered, setIsNodeHovered] = useState(false); // Track hover state of the node itself
  const { setNodes } = useReactFlow();
  
  // Extract overlay props (added at runtime by nodeRegistry)
  const onUpdateComment = safeData.onUpdateComment as ((nodeId: string, comment: string) => void) | undefined;
  const showInfoOverlay = (safeData.showInfoOverlay as boolean | undefined) ?? true;
  const secrets = (safeData.secrets as Array<{ key: string; isActive: boolean }>) || [];
  
  // Create node object for overlay - use xPos/yPos from props if available, otherwise default
  const node: Node = {
    id: id || '',
    type: type || 'agent',
    position: { x: (props as any).xPos || 0, y: (props as any).yPos || 0 },
    data: safeData,
  };
  
  const getSubtitle = () => {
    if (safeData.model) return safeData.model;
    return 'AI Agent';
  };

  // Bottom input handles configuration - only Tool handle
  const bottomInputs = [
    {
      id: 'tool',
      label: 'Tool',
      position: 50, // 50% from left (centered, since it's the only handle)
      color: 'bg-amber-500',
      required: false,
    },
  ];

  // Determine border and background based on execution status and animation
  const getBorderColor = () => {
    if (safeData.executionStatus === 'running' && safeData.isAnimating) {
      return 'border-emerald-500 border-4 animate-pulse';
    }
    if (safeData.executionStatus === 'completed') {
      return 'border-green-500';
    }
    if (safeData.executionStatus === 'failed') {
      return 'border-red-500';
    }
    return 'border-indigo-400';
  };

  const getBackgroundColor = () => {
    if (safeData.executionStatus === 'running' && safeData.isAnimating) {
      return 'from-emerald-50 to-emerald-100';
    }
    return 'from-indigo-50 to-purple-50';
  };

  return (
    <div 
      className={`relative w-[240px] h-[100px] px-4 py-3 rounded-lg shadow-md hover:shadow-lg bg-gradient-to-br ${getBackgroundColor()} ${getBorderColor()} transition-all duration-200 flex flex-col justify-center overflow-visible group ${selected ? 'ring-4 ring-blue-400 ring-offset-2' : ''} ${safeData.isAnimating && safeData.executionStatus === 'running' ? 'ring-4 ring-emerald-400 ring-opacity-60 scale-105 animate-pulse' : ''}`}
      onMouseEnter={() => setIsNodeHovered(true)} // Set hovered state on node
      onMouseLeave={() => setIsNodeHovered(false)} // Reset hovered state on node
    >
      {/* Layout Lock (pin) */}
      {ENABLE_LAYOUT_LOCK && id && (
        <button
          type="button"
          className={`
            absolute top-2 right-2 z-10
            inline-flex items-center justify-center
            w-7 h-7 rounded-md
            border border-gray-200 bg-white/90 backdrop-blur
            text-gray-600 hover:text-gray-900 hover:bg-white
            shadow-sm
            transition-all duration-200
            ${Boolean((safeData as any)?.layoutLocked) ? 'text-red-700 border-red-200 bg-red-50/90' : 'text-gray-500'}
            ${isNodeHovered || Boolean((safeData as any)?.layoutLocked) ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          title={Boolean((safeData as any)?.layoutLocked) ? 'Unlock position (Auto-Layout can move this node)' : 'Lock position (Auto-Layout will not move this node)'}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setNodes(prev =>
              prev.map(n => {
                if (n.id !== id) return n;
                const locked = Boolean((n.data as any)?.layoutLocked);
                return { ...n, data: { ...n.data, layoutLocked: !locked } };
              })
            );
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-9 4h10a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2z" />
          </svg>
        </button>
      )}
      
      {/* Node Info Overlay */}
      {showInfoOverlay && (
        <NodeInfoOverlay
          node={node}
          onUpdateComment={onUpdateComment}
          showOnHover={true}
          secrets={secrets}
          parentHovered={isNodeHovered} // Pass parent hover state
        />
      )}
      
      {/* Main Input Handle - Left */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />

      {/* Content */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="text-lg text-indigo-600 flex-shrink-0 relative">
            {/* Normal Icon */}
            <span className={safeData.executionStatus === 'running' && safeData.isAnimating ? 'opacity-50' : ''}>
              👤
            </span>
            
            {/* Spinner for running nodes */}
            {safeData.executionStatus === 'running' && safeData.isAnimating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-500 animate-spin"
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
            {safeData.executionStatus === 'failed' && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-scale-in">
                <svg
                  className="w-3 h-3 text-white"
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
          <div className="font-semibold text-sm text-gray-800 truncate flex-1">
            {safeData.agentName || safeData.label || 'Agent'}
          </div>
        </div>
        <div className="text-[11px] text-gray-600 truncate">
          {getSubtitle()}
        </div>
      </div>

      {/* Bottom Input Handle - Tool */}
      {bottomInputs.map((input) => (
        <div key={input.id}>
          {/* Handle */}
          <Handle
            type="target"
            position={Position.Bottom}
            id={input.id}
            className={`w-3.5 h-3.5 ${input.color} border-2 border-white hover:scale-125 transition-transform cursor-pointer shadow-md`}
            style={{
              bottom: -7,
              left: `${input.position}%`,
              transform: 'translateX(-50%)',
            }}
          />
          
          {/* Label above handle */}
          <div
            className="absolute text-[9px] font-semibold text-gray-700 pointer-events-none whitespace-nowrap"
            style={{
              bottom: '4px',
              left: `${input.position}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {input.label}
            {input.required && <span className="text-red-500 ml-0.5">*</span>}
          </div>
        </div>
      ))}

      {/* Main Output Handle - Right */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />
    </div>
  );
}
