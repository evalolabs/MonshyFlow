/**
 * BaseNode Component
 * 
 * Professional, standardized base component for all workflow nodes.
 * Inspired by modern workflow builder design patterns.
 */

import { useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { ApiIntegrationColor } from '../../../types/apiIntegrations';
import type { Node } from '@xyflow/react';
import { NodeInfoOverlay } from './NodeInfoOverlay';
import { ENABLE_LAYOUT_LOCK } from '../../../utils/layoutLock';

export interface BaseNodeProps {
  // Core
  label: string;
  icon?: string;
  category: 'core' | 'ai' | 'logic' | 'data' | 'integration' | 'utility';
  color?: ApiIntegrationColor; // Optional custom color (overrides category default)
  
  // Optional content
  subtitle?: string;
  badge?: string;
  status?: 'active' | 'inactive' | 'error' | 'warning';
  
  // Selection state (from React Flow)
  selected?: boolean;
  
  // Execution animation
  isAnimating?: boolean;
  executionStatus?: 'idle' | 'running' | 'completed' | 'failed';
  
  // Handles
  hasInput?: boolean;
  hasOutput?: boolean;
  additionalHandles?: Array<{
    id: string;
    type: 'source' | 'target';
    position: Position;
    label?: string;
    style?: React.CSSProperties;
  }>;

  // Node info overlay
  node?: Node; // Full node object for overlay
  onUpdateComment?: (nodeId: string, comment: string) => void;
  showInfoOverlay?: boolean;
  secrets?: Array<{ key: string; isActive: boolean }>; // Secrets for validation
}

const CATEGORY_COLORS = {
  core: {
    bg: 'from-gray-50 to-gray-100',
    border: 'border-gray-400',
    icon: 'text-gray-600',
    handle: 'bg-gray-500',
  },
  ai: {
    bg: 'from-indigo-50 to-purple-50',
    border: 'border-indigo-400',
    icon: 'text-indigo-600',
    handle: 'bg-indigo-500',
  },
  logic: {
    bg: 'from-amber-50 to-orange-50',
    border: 'border-amber-400',
    icon: 'text-amber-600',
    handle: 'bg-amber-500',
  },
  data: {
    bg: 'from-blue-50 to-cyan-50',
    border: 'border-blue-400',
    icon: 'text-blue-600',
    handle: 'bg-blue-500',
  },
  integration: {
    bg: 'from-green-50 to-emerald-50',
    border: 'border-green-400',
    icon: 'text-green-600',
    handle: 'bg-green-500',
  },
  utility: {
    bg: 'from-slate-50 to-zinc-50',
    border: 'border-slate-400',
    icon: 'text-slate-600',
    handle: 'bg-slate-500',
  },
};

export function BaseNode({
  label,
  icon,
  category,
  color,
  subtitle,
  badge,
  status,
  selected = false,
  isAnimating = false,
  executionStatus = 'idle',
  hasInput = true,
  hasOutput = true,
  additionalHandles = [],
  node,
  onUpdateComment,
  showInfoOverlay = true,
  secrets = [],
}: BaseNodeProps) {
  const [isNodeHovered, setIsNodeHovered] = useState(false); // Track hover state of the node itself
  const { setNodes } = useReactFlow();

  // Use custom color if provided, otherwise use category default
  const colors = color || CATEGORY_COLORS[category];

  // Determine border color based on execution status and animation
  const getBorderColor = () => {
    if (executionStatus === 'running' && isAnimating) {
      return 'border-emerald-500 border-4 animate-pulse';
    }
    if (executionStatus === 'completed') {
      return 'border-green-500';
    }
    if (executionStatus === 'failed') {
      return 'border-red-500';
    }
    return colors.border;
  };

  // Determine background based on execution status
  const getBackgroundColor = () => {
    if (executionStatus === 'running' && isAnimating) {
      return 'from-emerald-50 to-emerald-100';
    }
    return colors.bg;
  };

  const bgGradient = getBackgroundColor();
  
  return (
    <div 
        className={`
          relative w-[220px] h-[100px] 
          px-4 py-3 
          rounded-lg shadow-md hover:shadow-lg
          bg-gradient-to-br ${bgGradient}
          ${getBorderColor()}
          transition-all duration-200
          flex flex-col justify-center
          overflow-visible
          ${selected ? 'ring-4 ring-blue-400 ring-offset-2' : ''}
          ${isAnimating && executionStatus === 'running' 
            ? 'ring-4 ring-emerald-400 ring-opacity-60 scale-105 animate-pulse' 
            : ''}
        `}
      onMouseEnter={() => setIsNodeHovered(true)} // Set hovered state on node
      onMouseLeave={() => setIsNodeHovered(false)} // Reset hovered state on node
    >
      {/* Layout Lock (pin) */}
      {ENABLE_LAYOUT_LOCK && node?.id && (
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
            ${Boolean((node.data as any)?.layoutLocked) ? 'text-red-700 border-red-200 bg-red-50/90' : 'text-gray-500'}
            ${isNodeHovered || Boolean((node.data as any)?.layoutLocked) ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          title={Boolean((node.data as any)?.layoutLocked) ? 'Unlock position (Auto-Layout can move this node)' : 'Lock position (Auto-Layout will not move this node)'}
          onMouseDown={(e) => {
            // Prevent starting a drag from this button
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            setNodes(prev =>
              prev.map(n => {
                if (n.id !== node.id) return n;
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
      {showInfoOverlay && node && (
        <NodeInfoOverlay
          node={node}
          onUpdateComment={onUpdateComment}
          showOnHover={true}
          secrets={secrets}
          parentHovered={isNodeHovered}
        />
      )}
      {/* Input Handle */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className={`w-3 h-3 ${colors.handle} border-2 border-white`}
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
      )}

      {/* Status Badge */}
      {status && (
        <div className={`
          absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm
          ${status === 'active' ? 'bg-green-500' : ''}
          ${status === 'error' ? 'bg-red-500' : ''}
          ${status === 'warning' ? 'bg-yellow-500' : ''}
          ${status === 'inactive' ? 'bg-gray-400' : ''}
        `} />
      )}

      {/* Badge Label */}
      {badge && (
        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
          {badge}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-1">
        {/* Main Row: Icon + Label */}
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className={`text-lg ${colors.icon} flex-shrink-0 relative`}>
              {/* Normal Icon */}
              <span className={executionStatus === 'running' && isAnimating ? 'opacity-50' : ''}>
                {icon}
              </span>
              
              {/* Spinner for running nodes - größer und auffälliger */}
              {executionStatus === 'running' && isAnimating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-emerald-500 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-30"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-90"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              )}
              
              {/* X mark for failed nodes */}
              {executionStatus === 'failed' && (
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
          )}
          <div className="font-semibold text-sm text-gray-800 truncate flex-1">
            {label}
          </div>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div className="text-[11px] text-gray-600 truncate">
            {subtitle}
          </div>
        )}
      </div>

      {/* Output Handle */}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className={`w-3 h-3 ${colors.handle} border-2 border-white`}
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
      )}

      {/* Additional Handles */}
      {additionalHandles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={handle.type}
          position={handle.position}
          className={`w-3 h-3 ${colors.handle} border-2 border-white`}
          style={handle.style}
        />
      ))}
    </div>
  );
}

