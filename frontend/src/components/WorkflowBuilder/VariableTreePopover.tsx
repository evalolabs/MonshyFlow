import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { isLoopNodeType, LOOP_HANDLE_IDS } from './constants';
// Removed schema imports - we only show what's in debugStep.output

interface VariableTreePopoverProps {
  anchorEl: HTMLElement | null;
  data?: any;
  nodes?: Array<{ id: string; type?: string; data?: any; label?: any }>;
  edges?: Array<{ source: string; target: string }>;
  currentNodeId?: string;
  debugSteps?: any[]; // Debug steps with evaluated outputs
  workflowVariables?: Record<string, any>; // Workflow variables
  onPick: (path: string) => void;
  onClose: () => void;
}

interface TreeNodeProps {
  path: string;
  keyName: string;
  value: any;
  onPick: (path: string) => void;
  searchTerm?: string;
  onFocus?: (focusId: string) => void;
  focusId?: string;
}

// Helper function to check if a value matches search term
const matchesSearch = (searchTerm: string, keyName: string, value: any): boolean => {
  if (!searchTerm) return true;
  const lowerSearch = searchTerm.toLowerCase();
  
  // Check keyName
  if (keyName.toLowerCase().includes(lowerSearch)) return true;
  
  // Check value preview
  const isArray = Array.isArray(value);
  const isObject = !isArray && typeof value === 'object' && value !== null;
  const isPrimitive = value === null || value === undefined || (typeof value !== 'object' && typeof value !== 'function');
  
  if (isArray) {
    const preview = `[${value.length} items]`;
    if (preview.toLowerCase().includes(lowerSearch)) return true;
  } else if (isObject) {
    const preview = `{${Object.keys(value).length} keys}`;
    if (preview.toLowerCase().includes(lowerSearch)) return true;
  } else if (isPrimitive) {
    const str = String(value);
    if (str.toLowerCase().includes(lowerSearch)) return true;
  }
  
  return false;
};

// Helper function to check if a TreeNode or any of its children match search
const treeNodeMatchesSearch = (searchTerm: string, path: string, keyName: string, value: any): boolean => {
  if (!searchTerm) return true;
  
  // Check current node
  if (matchesSearch(searchTerm, keyName, value)) return true;
  
  // Check children recursively
  const isArray = Array.isArray(value);
  const isObject = !isArray && typeof value === 'object' && value !== null;
  const isPrimitive = value === null || value === undefined || (typeof value !== 'object' && typeof value !== 'function');
  const isString = typeof value === 'string';
  
  if (!isPrimitive && !isString && (isObject || isArray)) {
    if (isArray) {
      return value.some((item: any, index: number) => 
        treeNodeMatchesSearch(searchTerm, path, `[${index}]`, item)
      );
    } else if (isObject) {
      return Object.entries(value).some(([k, v]) => 
        treeNodeMatchesSearch(searchTerm, path, k, v)
      );
    }
  }
  
  return false;
};

const TreeNode: React.FC<TreeNodeProps> = ({ path, keyName, value, onPick, searchTerm = '', onFocus, focusId }) => {
  // Auto-expand if matches search (depth <= 1)
  const shouldAutoExpand = searchTerm && treeNodeMatchesSearch(searchTerm, path, keyName, value);
  const [open, setOpen] = useState(shouldAutoExpand);
  
  // Update open state when searchTerm changes
  useEffect(() => {
    if (shouldAutoExpand) {
      setOpen(true);
    }
  }, [shouldAutoExpand]);
  // Build full path: handle both workflow-style ($node["NodeName"].json.field) and legacy (steps.nodeId.json.field)
  // For array indices like [0], [1], append directly without a dot
  const fullPath = path 
    ? (keyName.startsWith('[') ? `${path}${keyName}` : `${path}.${keyName}`)
    : keyName;
  
  // IMPORTANT: Strings should NOT be treated as objects/arrays
  // Check if value is a primitive first (string, number, boolean, null, undefined)
  const isPrimitive = value === null || value === undefined || (typeof value !== 'object' && typeof value !== 'function');
  const isString = typeof value === 'string';
  const isObject = !isPrimitive && !isString && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const hasChildren = !isPrimitive && !isString && (isObject || isArray) && (
    isArray ? value.length > 0 : 
    isObject ? Object.keys(value).length > 0 : false
  );

  // Get value preview (truncated)
  const getValuePreview = () => {
    if (isArray) return `[${value.length} items]`;
    if (isObject) return `{${Object.keys(value).length} keys}`;
    const str = String(value);
    if (str.length > 25) return str.slice(0, 22) + '...';
    return str;
  };

  // Format path for display (show both workflow and legacy syntax if applicable)
  const getDisplayPath = () => {
    // If path starts with $node, it's workflow-style - show as-is
    if (path?.startsWith('$node[') || path?.startsWith('$json') || path?.startsWith('$input')) {
      return fullPath;
    }
    // Legacy syntax - show as-is
    return fullPath;
  };

  return (
    <div className="pl-1">
      <div className="flex items-center gap-1.5 group">
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            className="w-5 h-5 flex items-center justify-center rounded border border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors flex-shrink-0"
            title={open ? 'Collapse' : 'Expand'}
          >
            <svg 
              className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-5 inline-block" />
        )}
        <button
          type="button"
          className="flex-1 px-2 py-1.5 rounded-md hover:bg-blue-50 hover:border-blue-200 border border-transparent text-left transition-all duration-150 min-w-0 group/item focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          onClick={() => onPick(fullPath)}
          onFocus={() => {
            const id = focusId || fullPath || keyName;
            onFocus?.(id);
          }}
          data-focus-id={focusId || fullPath || keyName}
          tabIndex={0}
          title={`Click to insert {{${getDisplayPath()}}}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-semibold text-gray-800 group-hover/item:text-blue-700 truncate">
              {keyName}
            </span>
            <span className="text-[10px] text-gray-400 truncate flex-shrink-0">
              {getValuePreview()}
            </span>
          </div>
        </button>
      </div>
      {open && hasChildren && !isString && (
        <div className="mt-0.5 ml-3 border-l-2 border-blue-200 pl-2 transition-all duration-150 ease-out">
          {isArray ? (
            // For arrays, show all items with index notation [0], [1], etc.
            value.length > 0 ? (
              value
                .map((item: any, index: number) => ({
                  item,
                  index,
                  matches: searchTerm ? treeNodeMatchesSearch(searchTerm, fullPath, `[${index}]`, item) : true
                }))
                .filter(({ matches }) => matches)
                .map(({ item, index }) => (
                <TreeNode 
                  key={index} 
                  path={fullPath} 
                  keyName={`[${index}]`} 
                  value={item} 
                  onPick={onPick}
                  searchTerm={searchTerm}
                  onFocus={onFocus}
                  focusId={`${fullPath}[${index}]`}
                />
                ))
            ) : (
              // Empty array
              <div className="text-xs text-gray-400 italic">Empty array</div>
            )
          ) : (
            // For objects, show all keys
            Object.entries(value)
              .map(([k, v]) => ({
                key: k,
                value: v,
                matches: searchTerm ? treeNodeMatchesSearch(searchTerm, fullPath, k, v) : true
              }))
              .filter(({ matches }) => matches)
              .map(({ key, value: v }) => (
                <TreeNode 
                  key={key} 
                  path={fullPath} 
                  keyName={key} 
                  value={v} 
                  onPick={onPick}
                  searchTerm={searchTerm}
                  onFocus={onFocus}
                  focusId={fullPath ? `${fullPath}.${key}` : key}
                />
              ))
          )}
        </div>
      )}
    </div>
  );
};

export const VariableTreePopover: React.FC<VariableTreePopoverProps> = ({ anchorEl, data, nodes = [], edges = [], currentNodeId, debugSteps = [], workflowVariables, onPick, onClose }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const resizeHandleRef = useRef<HTMLDivElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [userHeight, setUserHeight] = useState<number | null>(null); // User-defined height (null = auto)
  const [isInitialized, setIsInitialized] = useState(false); // Track if popover has been opened
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);
  
  // Helper function to set a nested value at a path
  const setNestedValue = (obj: any, path: string, value: any): void => {
    const parts = path.split(/[\.\[\]]/).filter(p => p !== '');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const index = parseInt(part, 10);
      
      if (!isNaN(index) && Array.isArray(current)) {
        if (current[index] === undefined || current[index] === null) {
          current[index] = {};
        }
        current = current[index];
      } else if (typeof current === 'object' && current !== null) {
        if (current[part] === undefined || current[part] === null) {
          current[part] = {};
        }
        current = current[part];
      } else {
        return; // Cannot set nested value
      }
    }
    
    const lastPart = parts[parts.length - 1];
    const lastIndex = parseInt(lastPart, 10);
    
    if (!isNaN(lastIndex) && Array.isArray(current)) {
      current[lastIndex] = value;
    } else if (typeof current === 'object' && current !== null) {
      current[lastPart] = value;
    }
  };
  
  // Extract current variable values from debugSteps (from _variableSet in output.json)
  // This gives us the runtime values, not just the static DB values
  const currentVariables = useMemo(() => {
    const vars: Record<string, any> = {};
    
    // Start with static workflow variables from DB (deep clone to avoid mutations)
    if (workflowVariables) {
      Object.entries(workflowVariables).forEach(([key, value]) => {
        vars[key] = JSON.parse(JSON.stringify(value)); // Deep clone
      });
    }
    
    // Override with values from debugSteps (most recent value wins)
    // Filter to only completed steps and sort by timestamp to ensure chronological order
    const completedSteps = debugSteps.filter(step => step.status === 'completed' && step.output);
    const sortedSteps = [...completedSteps].sort((a, b) => {
      const timeA = a.completedAt || a.startedAt || '';
      const timeB = b.completedAt || b.startedAt || '';
      return timeA.localeCompare(timeB);
    });
    
    // Look for _variableSet in output.json of each debug step
    sortedSteps.forEach(step => {
      // Check multiple possible structures:
      // 1. step.output.json._variableSet (NodeData format: { json: {...}, metadata: {...} })
      // 2. step.output._variableSet (direct output)
      // 3. step.json._variableSet (legacy format)
      let variableSet = null;
      
      if (step.output?.json?._variableSet) {
        variableSet = step.output.json._variableSet;
      } else if (step.output?._variableSet) {
        variableSet = step.output._variableSet;
      } else if (step.json?._variableSet) {
        variableSet = step.json._variableSet;
      }
      
      if (variableSet) {
        const varName = variableSet.name;
        const varValue = variableSet.value;
        const varPath = variableSet.path;
        
        if (varName) {
          if (varPath && varPath.trim()) {
            // Nested path update - update only that specific path
            if (vars[varName] === undefined || vars[varName] === null) {
              vars[varName] = {};
            }
            setNestedValue(vars[varName], varPath.trim(), varValue);
          } else {
            // Full variable update
            vars[varName] = varValue;
          }
        }
      }
    });
    
    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[VariableTreePopover] Current variables:', vars);
      console.log('[VariableTreePopover] Debug steps:', debugSteps.map(s => ({
        nodeId: s.nodeId,
        nodeType: s.nodeType,
        output: s.output,
      })));
    }
    
    return vars;
  }, [workflowVariables, debugSteps]);
  
  const [pos, setPos] = useState<{ left: number; top: number; width: number; maxHeight: number }>({ 
    left: 0, 
    top: 0, 
    width: 360, 
    maxHeight: 400 
  });
  
  // Expanded sections (Start, Guaranteed, Conditional) - default: all expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Expanded nodes within sections - default: all collapsed
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  
  // Keyboard navigation
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Toggle section (Start, Guaranteed, Conditional)
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };
  
  // Toggle node expansion within a section
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Resize functionality
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      
      const viewportHeight = window.innerHeight;
      const taskbarHeight = 80;
      const viewportPadding = 8;
      const effectiveViewportHeight = viewportHeight - taskbarHeight;
      const minHeight = 250; // Minimum total popover height (including header + footer)
      const maxHeight = effectiveViewportHeight - pos.top - viewportPadding; // Maximum height
      
      // Calculate new height based on mouse position (relative to current top)
      // Ensure minimum height and don't exceed viewport
      const newHeight = Math.max(
        minHeight, 
        Math.min(maxHeight, e.clientY - pos.top + 5) // +5px offset for better UX
      );
      
      setUserHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Prevent text selection after resizing
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    const handleMouseDown = () => {
      // Prevent text selection during resize
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ns-resize';
    };

    if (isResizing) {
      handleMouseDown();
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isResizing, pos.top]);

  useEffect(() => {
    // Find config panel container once (it's relatively static)
    const findConfigPanel = (): HTMLElement | null => {
      const byId = document.querySelector('#config-panel') as HTMLElement;
      if (byId) return byId;
      
      const byTestId = document.querySelector('[data-testid="config-panel"]') as HTMLElement;
      if (byTestId) return byTestId;
      
      // Fallback: find the rightmost panel that's likely the config panel
      const panels = Array.from(document.querySelectorAll('[class*="overflow-y-auto"]')) as HTMLElement[];
      const viewportWidth = window.innerWidth;
      const rightPanels = panels.filter(p => {
        const rect = p.getBoundingClientRect();
        return rect.right > viewportWidth * 0.6 && rect.width > 200 && rect.height > 200;
      });
      return rightPanels.length > 0 ? rightPanels[0] : null;
    };
    
    const upd = () => {
      if (!anchorEl) return;
      const r = anchorEl.getBoundingClientRect();
      const popoverWidth = 360;
      const popoverMaxHeight = 500;
      const padding = 12;
      const viewportPadding = 8;
      const minDistanceFromPanel = 16; // Minimum distance from config panel
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Find config panel
      const configPanelContainer = findConfigPanel();
      const configPanelRect = configPanelContainer?.getBoundingClientRect();
      
      // Calculate available space on each side of the anchor element
      // Account for taskbar/OS chrome at bottom (typically ~40-50px, but be safe with 80px)
      const taskbarHeight = 80; // Reserve space for taskbar
      const effectiveViewportHeight = viewportHeight - taskbarHeight;
      
      const spaceRight = viewportWidth - r.right - padding;
      const spaceLeft = r.left - padding;
      const spaceBelow = effectiveViewportHeight - r.bottom - padding;
      const spaceAbove = r.top - padding;
      
      let left: number;
      let top: number;
      let maxHeight: number;
      
      // If config panel exists and is on the right, calculate space more carefully
      let effectiveSpaceRight = spaceRight;
      if (configPanelRect && configPanelRect.left < viewportWidth * 0.7) {
        // Config panel is likely on the right side
        // Check if positioning to the right would overlap
        if (r.right + popoverWidth + minDistanceFromPanel > configPanelRect.left) {
          // Would overlap - use space between anchor and config panel
          effectiveSpaceRight = configPanelRect.left - r.right - minDistanceFromPanel;
        }
      }
      
      // Determine best position based on available space and config panel location
      // Priority: LEFT > ABOVE > RIGHT > BELOW (ABOVE preferred over BELOW to avoid taskbar)
      
      // Check if config panel is on the right side
      const configPanelOnRight = configPanelRect && configPanelRect.left > viewportWidth * 0.5;
      
      // Check if anchor is in bottom half of viewport (likely in config panel)
      const anchorInBottomHalf = r.top > effectiveViewportHeight / 2;
      
      // Strategy 1: Position to the LEFT of anchor (always preferred to avoid right-side config panel)
      if (spaceLeft >= popoverWidth) {
        left = r.left - popoverWidth - padding;
        // Align vertically with anchor, but keep within safe viewport area
        top = Math.max(
          viewportPadding,
          Math.min(
            r.top,
            effectiveViewportHeight - popoverMaxHeight - viewportPadding
          )
        );
        maxHeight = Math.min(popoverMaxHeight, effectiveViewportHeight - top - viewportPadding);
      }
      // Strategy 2: Position ABOVE anchor (preferred when anchor is in bottom half)
      // This avoids the popover being cut off at the bottom
      else if (anchorInBottomHalf || spaceAbove >= 200) {
        // Center horizontally relative to anchor, but avoid config panel
        let preferredLeft = r.left + (r.width / 2) - (popoverWidth / 2);
        
        // If config panel is on right, shift left to avoid it
        if (configPanelOnRight && configPanelRect) {
          const maxLeft = configPanelRect.left - popoverWidth - minDistanceFromPanel;
          preferredLeft = Math.min(preferredLeft, maxLeft);
        }
        
        left = Math.max(
          viewportPadding,
          Math.min(preferredLeft, viewportWidth - popoverWidth - viewportPadding)
        );
        
        // Use available space above, but ensure we don't go above viewport
        const calculatedHeight = Math.min(
          popoverMaxHeight, 
          Math.max(200, spaceAbove - padding) // At least 200px if possible
        );
        top = Math.max(
          viewportPadding,
          r.top - calculatedHeight - padding
        );
        maxHeight = Math.min(calculatedHeight, r.top - top - padding);
      }
      // Strategy 3: Position to the RIGHT of anchor (only if config panel is NOT on right)
      else if (!configPanelOnRight && effectiveSpaceRight >= popoverWidth) {
        left = r.right + padding;
        // Align vertically with anchor, but ensure it fits in viewport
        top = Math.max(
          viewportPadding,
          Math.min(
            r.top,
            effectiveViewportHeight - popoverMaxHeight - viewportPadding
          )
        );
        maxHeight = Math.min(popoverMaxHeight, effectiveViewportHeight - top - viewportPadding);
      }
      // Strategy 4: Position BELOW anchor (only if there's enough space and not too close to bottom)
      else if (spaceBelow >= 300 && r.bottom < effectiveViewportHeight * 0.7) {
        // Only position below if anchor is not too low (less than 70% down)
        // Center horizontally relative to anchor, but avoid config panel
        let preferredLeft = r.left + (r.width / 2) - (popoverWidth / 2);
        
        // If config panel is on right, shift left to avoid it
        if (configPanelOnRight && configPanelRect) {
          const maxLeft = configPanelRect.left - popoverWidth - minDistanceFromPanel;
          preferredLeft = Math.min(preferredLeft, maxLeft);
        }
        
        left = Math.max(
          viewportPadding,
          Math.min(preferredLeft, viewportWidth - popoverWidth - viewportPadding)
        );
        
        top = r.bottom + padding;
        // Ensure popover doesn't extend beyond safe viewport area
        const maxAvailableHeight = effectiveViewportHeight - top - viewportPadding;
        maxHeight = Math.min(popoverMaxHeight, maxAvailableHeight);
      }
      // Strategy 5: Position to the left of config panel (if it exists and is on right)
      else if (configPanelOnRight && configPanelRect && configPanelRect.left >= popoverWidth + minDistanceFromPanel) {
        left = configPanelRect.left - popoverWidth - minDistanceFromPanel;
        // Align with anchor vertically, but keep within safe viewport
        top = Math.max(
          viewportPadding,
          Math.min(
            r.top,
            effectiveViewportHeight - popoverMaxHeight - viewportPadding
          )
        );
        maxHeight = Math.min(popoverMaxHeight, effectiveViewportHeight - top - viewportPadding);
      }
      // Strategy 6: Last resort - position above (even with limited space) to avoid bottom cutoff
      else {
        // Always prefer above when space is limited to avoid taskbar/OS chrome
        const availableWidth = Math.min(popoverWidth, Math.max(spaceRight, spaceLeft, 280));
        let preferredLeft = r.left + (r.width / 2) - (availableWidth / 2);
        
        // Shift away from config panel if on right
        if (configPanelOnRight && configPanelRect) {
          const maxLeft = configPanelRect.left - availableWidth - minDistanceFromPanel;
          preferredLeft = Math.min(preferredLeft, maxLeft);
        }
        
        left = Math.max(
          viewportPadding,
          Math.min(preferredLeft, viewportWidth - availableWidth - viewportPadding)
        );
        
        // Position above anchor, using whatever space is available
        const availableHeightAbove = Math.max(150, r.top - viewportPadding); // At least 150px
        const calculatedHeight = Math.min(popoverMaxHeight, availableHeightAbove - padding);
        top = Math.max(
          viewportPadding,
          r.top - calculatedHeight - padding
        );
        maxHeight = calculatedHeight;
      }
      
      // Final check: Ensure we don't overlap with config panel
      if (configPanelRect && configPanelRect.width > 0 && configPanelRect.height > 0) {
        const panelRight = configPanelRect.right;
        const panelLeft = configPanelRect.left;
        const panelTop = configPanelRect.top;
        const panelBottom = configPanelRect.bottom;
        
        // Check for horizontal overlap
        if (left < panelRight && left + popoverWidth > panelLeft) {
          // Overlaps horizontally - move to left of panel
          if (panelLeft >= popoverWidth + minDistanceFromPanel) {
            left = panelLeft - popoverWidth - minDistanceFromPanel;
          } else {
            // Not enough space on left - move above or below
            if (spaceAbove >= 200) {
              top = Math.min(panelTop - maxHeight - minDistanceFromPanel, r.top - maxHeight - padding);
              maxHeight = Math.min(popoverMaxHeight, spaceAbove - padding);
            } else if (spaceBelow >= 200) {
              top = Math.max(panelBottom + minDistanceFromPanel, r.bottom + padding);
              maxHeight = Math.min(popoverMaxHeight, viewportHeight - top - viewportPadding);
            }
          }
        }
        
        // Check for vertical overlap
        if (top < panelBottom && top + maxHeight > panelTop) {
          // Overlaps vertically - prefer positioning above to avoid bottom cutoff
          if (spaceAbove >= 150) {
            const calculatedHeight = Math.min(popoverMaxHeight, spaceAbove - padding);
            top = Math.max(
              viewportPadding,
              Math.min(panelTop - calculatedHeight - minDistanceFromPanel, r.top - calculatedHeight - padding)
            );
            maxHeight = calculatedHeight;
          } else if (spaceBelow >= 300 && r.bottom < effectiveViewportHeight * 0.7) {
            // Only use below if there's plenty of space and anchor is not too low
            top = Math.max(panelBottom + minDistanceFromPanel, r.bottom + padding);
            maxHeight = Math.min(popoverMaxHeight, effectiveViewportHeight - top - viewportPadding);
          } else {
            // Last resort: position above with limited height
            const availableHeight = Math.max(150, r.top - viewportPadding);
            const limitedHeight = Math.min(popoverMaxHeight, availableHeight - padding);
            top = Math.max(viewportPadding, r.top - limitedHeight - padding);
            maxHeight = limitedHeight;
          }
        }
      }
      
      // Final viewport clamping (ensure popover is fully visible and above taskbar)
      left = Math.max(viewportPadding, Math.min(left, viewportWidth - popoverWidth - viewportPadding));
      // Ensure popover doesn't go below safe viewport area (above taskbar)
      // When user is resizing, don't adjust top position
      if (!isResizing) {
        top = Math.max(
          viewportPadding, 
          Math.min(top, effectiveViewportHeight - Math.min(maxHeight, 300) - viewportPadding)
        );
      }
      // Recalculate maxHeight based on final top position
      // On first open, set to maximum available height
      const maxAvailableHeight = effectiveViewportHeight - top - viewportPadding;
      
      // Use user-defined height if set, otherwise use calculated maxHeight
      // But on first open, always use maximum available height
      let finalMaxHeight: number;
      if (!isInitialized && anchorEl) {
        // First time opening - set to maximum available height
        finalMaxHeight = maxAvailableHeight;
        setUserHeight(maxAvailableHeight);
        setIsInitialized(true);
      } else {
        // Use user-defined height if set, otherwise use calculated maxHeight
        finalMaxHeight = userHeight !== null 
          ? Math.min(userHeight, maxAvailableHeight)
          : Math.min(maxHeight, maxAvailableHeight);
      }
      
      setPos({ left, top, width: popoverWidth, maxHeight: finalMaxHeight });
    };
    
    // Use requestAnimationFrame for smoother positioning
    let rafId: number;
    const scheduleUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(upd);
    };
    
    scheduleUpdate();
    
    // Update position on resize, scroll, and when config panel changes (but not during user resize)
    if (!isResizing) {
      window.addEventListener('resize', scheduleUpdate);
      window.addEventListener('scroll', scheduleUpdate, true);
      
      // Observe config panel if it exists
      let resizeObserver: ResizeObserver | null = null;
      const configPanelContainer = findConfigPanel();
      if (configPanelContainer) {
        configPanelContainer.addEventListener('scroll', scheduleUpdate, true);
        resizeObserver = new ResizeObserver(scheduleUpdate);
        resizeObserver.observe(configPanelContainer);
      }
      
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', scheduleUpdate);
        window.removeEventListener('scroll', scheduleUpdate, true);
        const cleanupConfigPanel = findConfigPanel();
        if (cleanupConfigPanel) {
          cleanupConfigPanel.removeEventListener('scroll', scheduleUpdate, true);
        }
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }
  }, [anchorEl, userHeight, isResizing, isInitialized]);
  
  // Reset initialization when popover closes
  useEffect(() => {
    if (!anchorEl && isInitialized) {
      setIsInitialized(false);
      // Optionally reset userHeight on close, or keep it for next open
      // setUserHeight(null); // Uncomment if you want to reset height on close
    }
  }, [anchorEl, isInitialized]);

  // Drag functionality
  useEffect(() => {
    if (!isDragging || !dragStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setPos(prev => ({
        ...prev,
        left: Math.max(0, Math.min(window.innerWidth - prev.width, prev.left + deltaX)),
        top: Math.max(0, Math.min(window.innerHeight - 100, prev.top + deltaY)), // Keep at least 100px visible
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      
      setPos(prev => ({
        ...prev,
        left: Math.max(0, Math.min(window.innerWidth - prev.width, prev.left + deltaX)),
        top: Math.max(0, Math.min(window.innerHeight - 100, prev.top + deltaY)),
      }));
      
      setDragStart({ x: touch.clientX, y: touch.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setDragStart(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);

    // Prevent text selection during drag
    document.body.style.cursor = 'move';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (anchorEl && anchorEl.contains(e.target as Node)) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [anchorEl, onClose]);

  // Upstream computation
  const upstreamNodes = useMemo(() => {
    if (!currentNodeId || !nodes || !edges) return [] as any[];
    const adjIn: Record<string, string[]> = {};
    nodes.forEach(n => { adjIn[n.id] = []; });
    edges.forEach(e => { if (adjIn[e.target]) adjIn[e.target].push(e.source); });
    const visited = new Set<string>();
    const result: string[] = [];
    const stack = [...(adjIn[currentNodeId] || [])];
    while (stack.length) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      result.push(id);
      (adjIn[id] || []).forEach(p => stack.push(p));
    }
    return result.map(id => nodes.find(n => n.id === id)).filter(Boolean) as any[];
  }, [nodes, edges, currentNodeId]);

  // Dominator analysis to mark guaranteed nodes
  const guaranteedIds = useMemo(() => {
    if (!currentNodeId || !nodes || !edges) return new Set<string>();
    const preds: Record<string, Set<string>> = {};
    nodes.forEach(n => preds[n.id] = new Set());
    edges.forEach(e => preds[e.target].add(e.source));
    const allIds = new Set(nodes.map(n => n.id));
    const dom: Record<string, Set<string>> = {};
    nodes.forEach(n => dom[n.id] = new Set(allIds));
    dom[currentNodeId] = new Set([currentNodeId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of nodes) {
        if (n.id === currentNodeId) continue;
        let inter: Set<string> | null = null;
        preds[n.id].forEach(p => {
          inter = inter ? new Set([...inter!].filter(x => dom[p].has(x))) : new Set(dom[p]);
        });
        const next = new Set<string>([n.id, ...(inter || allIds)]);
        const old = dom[n.id];
        if (next.size !== old.size || [...next].some(x => !old.has(x))) {
          dom[n.id] = next; changed = true;
        }
      }
    }
    const res = new Set<string>();
    for (const id of dom[currentNodeId]) { if (id !== currentNodeId) res.add(id); }
    return res;
  }, [nodes, edges, currentNodeId]);

  const startNodes = useMemo(() => upstreamNodes.filter(n => n.type === 'start'), [upstreamNodes]);
  const guaranteed = useMemo(() => upstreamNodes.filter(n => guaranteedIds.has(n.id) && n.type !== 'start'), [upstreamNodes, guaranteedIds]);
  const conditional = useMemo(() => upstreamNodes.filter(n => !guaranteedIds.has(n.id) && n.type !== 'start'), [upstreamNodes, guaranteedIds]);

  // Filter nodes based on search term
  const nodeMatchesSearch = (node: any, searchTerm: string): boolean => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    
    // Check node label/name
    const nodeLabel = node.data?.label || node.type || '';
    if (nodeLabel.toLowerCase().includes(lowerSearch)) return true;
    
    // Check node output data
    const debugStep = debugSteps.find(s => s.nodeId === node.id);
    const nodeOutput = debugStep?.output;
    if (nodeOutput) {
      // Check if any field in output matches
      const checkValue = (val: any): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'string' && val.toLowerCase().includes(lowerSearch)) return true;
        if (typeof val === 'object') {
          if (Array.isArray(val)) {
            return val.some(item => checkValue(item));
          } else {
            return Object.entries(val).some(([k, v]) => 
              k.toLowerCase().includes(lowerSearch) || checkValue(v)
            );
          }
        }
        return String(val).toLowerCase().includes(lowerSearch);
      };
      
      if (checkValue(nodeOutput.json) || checkValue(nodeOutput.data) || checkValue(nodeOutput.metadata)) {
        return true;
      }
    }
    
    return false;
  };

  // Filter nodes based on search
  const filteredStartNodes = useMemo(() => {
    if (!searchTerm) return startNodes;
    return startNodes.filter(n => nodeMatchesSearch(n, searchTerm));
  }, [startNodes, searchTerm]);

  const filteredGuaranteed = useMemo(() => {
    if (!searchTerm) return guaranteed;
    return guaranteed.filter(n => nodeMatchesSearch(n, searchTerm));
  }, [guaranteed, searchTerm]);

  const filteredConditional = useMemo(() => {
    if (!searchTerm) return conditional;
    return conditional.filter(n => nodeMatchesSearch(n, searchTerm));
  }, [conditional, searchTerm]);

  // Auto-expand nodes when searching (depth <= 1)
  useEffect(() => {
    if (searchTerm) {
      const nodesToExpand = new Set<string>();
      [...startNodes, ...guaranteed, ...conditional].forEach(n => {
        if (nodeMatchesSearch(n, searchTerm)) {
          nodesToExpand.add(n.id);
        }
      });
      setExpandedNodes(nodesToExpand);
      // Also expand all sections when searching
      const sectionsToExpand = new Set<string>();
      if (currentInput) sectionsToExpand.add('currentInput');
      if (filteredStartNodes.length > 0) sectionsToExpand.add('start');
      if (filteredGuaranteed.length > 0) sectionsToExpand.add('guaranteed');
      if (filteredConditional.length > 0) sectionsToExpand.add('conditional');
      setExpandedSections(sectionsToExpand);
    } else {
      // Reset to default when search is cleared
      setExpandedNodes(new Set());
    }
  }, [searchTerm]);

  // Get current node's input from debugSteps (contains loop context if in a loop)
  // OR derive loop context from parent loop node's output if node hasn't been executed yet
  const currentInput = useMemo(() => {
    if (!currentNodeId || !nodes || !edges) return null;
    
    // First, check if we have actual input from debugSteps (node was executed)
    if (debugSteps) {
      const currentDebugStep = debugSteps.find(s => s.nodeId === currentNodeId);
      if (currentDebugStep?.input) {
        const input = currentDebugStep.input;
        // Check if input contains loop context (from ForEach/While)
        if (input?.loop || input?.current !== undefined || input?.index !== undefined) {
          return input;
        }
        // Also check if input.json contains loop context
        if (input?.json?.loop || input?.json?.current !== undefined || input?.json?.index !== undefined) {
          return input.json;
        }
      }
    }
    
    // If no input from debugSteps, check if current node is inside a loop
    // Find all loop nodes (while/foreach)
    const loopNodes = nodes.filter(n => isLoopNodeType(n.type));
    
    // Check if current node is connected via loop edge to a loop node
    for (const loopNode of loopNodes) {
      // Check if there's a loop edge from loop node to current node
      const loopEdge = edges.find(e => 
        e.source === loopNode.id && 
        e.target === currentNodeId &&
        (e as any).sourceHandle === LOOP_HANDLE_IDS.LOOP
      );
      
      if (loopEdge) {
        // Current node is inside this loop
        // Try to get sample data from loop node's output
        const loopDebugStep = debugSteps?.find(s => s.nodeId === loopNode.id);
        const loopOutput = loopDebugStep?.output;
        
        // For ForEach: extract array from output and use first item as sample
        if (loopNode.type === 'foreach') {
          // Try to get array from output
          // ForEach node can have different array field names:
          // - 'data' (from HTTP-Request nodes that return data)
          // - 'results' (from ForEach node's own output)
          // - Or any other array field in json
          let arrayData: any[] | null = null;
          
          // Check if output itself is an array
          if (Array.isArray(loopOutput) && loopOutput.length > 0) {
            arrayData = loopOutput;
          } else {
            const jsonData = loopOutput?.json || loopOutput?.data || {};
            
            // First, try common field names
            if (Array.isArray(jsonData.data) && jsonData.data.length > 0) {
              arrayData = jsonData.data;
            } else if (Array.isArray(jsonData.results) && jsonData.results.length > 0) {
              arrayData = jsonData.results;
            } else if (Array.isArray(jsonData.body?.data) && jsonData.body.data.length > 0) {
              arrayData = jsonData.body.data;
            } else {
              // If no common field found, search for the first array field in json
              for (const [_key, value] of Object.entries(jsonData)) {
                if (Array.isArray(value) && value.length > 0) {
                  arrayData = value as any[];
                  break;
                }
              }
            }
          }
          
          if (arrayData && arrayData.length > 0) {
            // Use first item as sample for loop.current
            const sampleCurrent = arrayData[0];
            return {
              loop: {
                current: sampleCurrent,
                index: 0, // Sample index
                array: arrayData, // Full array
              },
              current: sampleCurrent, // Convenience alias
              index: 0, // Convenience alias
            };
          }
        } else if (loopNode.type === 'while') {
          // For While, use input as sample
          const sampleCurrent = loopOutput?.json || loopOutput?.data || {};
          return {
            loop: {
              current: sampleCurrent,
              index: 0, // Sample index
            },
            current: sampleCurrent, // Convenience alias
            index: 0, // Convenience alias
          };
        }
      }
    }
    
    return null;
  }, [currentNodeId, nodes, edges, debugSteps]);

  // Collect all focusable elements (TreeNodes and Node buttons)
  const focusableElements = useMemo(() => {
    const elements: Array<{ id: string; type: 'node' | 'treeNode'; path?: string }> = [];
    
    // Add current input elements if available
    if (currentInput) {
      if (currentInput.loop?.current !== undefined) {
        elements.push({ id: 'loop.current', type: 'treeNode', path: 'loop.current' });
      }
      if (currentInput.current !== undefined && !currentInput.loop) {
        elements.push({ id: 'current', type: 'treeNode', path: 'current' });
      }
      if (currentInput.loop?.index !== undefined) {
        elements.push({ id: 'loop.index', type: 'treeNode', path: 'loop.index' });
      }
      if (currentInput.index !== undefined && !currentInput.loop) {
        elements.push({ id: 'index', type: 'treeNode', path: 'index' });
      }
    }
    
    // Add nodes from all sections
    [...filteredStartNodes, ...filteredGuaranteed, ...filteredConditional].forEach(n => {
      elements.push({ id: `node.${n.id}`, type: 'node' });
      const debugStep = debugSteps.find(s => s.nodeId === n.id);
      const nodeOutput = debugStep?.output;
      if (nodeOutput && expandedNodes.has(n.id)) {
        if (nodeOutput.json !== undefined) {
          elements.push({ id: `node.${n.id}.json`, type: 'treeNode', path: `steps.${n.id}.json` });
        }
        if (nodeOutput.data !== undefined && nodeOutput.data !== nodeOutput.json) {
          elements.push({ id: `node.${n.id}.data`, type: 'treeNode', path: `steps.${n.id}.data` });
        }
        if (nodeOutput.metadata) {
          elements.push({ id: `node.${n.id}.metadata`, type: 'treeNode', path: `steps.${n.id}.metadata` });
        }
        if (nodeOutput.error) {
          elements.push({ id: `node.${n.id}.error`, type: 'treeNode', path: `steps.${n.id}.error` });
        }
      }
    });
    
    // Add workflow variables
    if (currentVariables) {
      Object.entries(currentVariables).forEach(([k]) => {
        elements.push({ id: `vars.${k}`, type: 'treeNode', path: `vars.${k}` });
      });
    }
    
    return elements;
  }, [currentInput, filteredStartNodes, filteredGuaranteed, filteredConditional, debugSteps, expandedNodes, currentVariables]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in any input/textarea (not just search)
      const activeElement = document.activeElement;
      const isInputElement = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).isContentEditable
      );
      
      // If user is typing in an input/textarea, only handle Escape to close
      if (isInputElement) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
        // Don't intercept any other keys when typing in input/textarea
        return;
      }
      
      // Don't handle if user is typing in search input
      if (searchInputRef.current && document.activeElement === searchInputRef.current) {
        // Allow Escape to close even when in search
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
        // Allow Arrow Down to move focus from search to first element
        if (e.key === 'ArrowDown' && focusableElements.length > 0) {
          e.preventDefault();
          setFocusedElementId(focusableElements[0].id);
          const element = document.querySelector(`[data-focus-id="${focusableElements[0].id}"]`) as HTMLElement;
          element?.focus();
        }
        return;
      }

      const currentIndex = focusedElementId 
        ? focusableElements.findIndex((el: { id: string }) => el.id === focusedElementId)
        : -1;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const prevId = focusableElements[currentIndex - 1].id;
            setFocusedElementId(prevId);
            const element = document.querySelector(`[data-focus-id="${prevId}"]`) as HTMLElement;
            element?.focus();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < focusableElements.length - 1) {
            const nextId = focusableElements[currentIndex + 1].id;
            setFocusedElementId(nextId);
            const element = document.querySelector(`[data-focus-id="${nextId}"]`) as HTMLElement;
            element?.focus();
          } else if (currentIndex === -1 && focusableElements.length > 0) {
            // If nothing focused, focus first element
            const firstId = focusableElements[0].id;
            setFocusedElementId(firstId);
            const element = document.querySelector(`[data-focus-id="${firstId}"]`) as HTMLElement;
            element?.focus();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          // Collapse if focused on a node
          if (focusedElementId?.startsWith('node.')) {
            const nodeId = focusedElementId.replace('node.', '').split('.')[0];
            if (expandedNodes.has(nodeId)) {
              toggleNode(nodeId);
            }
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          // Expand if focused on a node
          if (focusedElementId?.startsWith('node.')) {
            const nodeId = focusedElementId.replace('node.', '').split('.')[0];
            const node = [...filteredStartNodes, ...filteredGuaranteed, ...filteredConditional].find(n => n.id === nodeId);
            if (node && !expandedNodes.has(nodeId)) {
              const debugStep = debugSteps.find(s => s.nodeId === node.id);
              const nodeOutput = debugStep?.output;
              const hasOutput = nodeOutput && (
                (nodeOutput.json !== undefined && nodeOutput.json !== null) ||
                (nodeOutput.data !== undefined && nodeOutput.data !== nodeOutput.json) ||
                nodeOutput.metadata ||
                nodeOutput.error
              );
              if (hasOutput) {
                toggleNode(nodeId);
              }
            }
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          // Select/Insert variable
          if (focusedElementId) {
            const element = focusableElements.find((el: { id: string }) => el.id === focusedElementId);
            if (element?.path) {
              onPick(element.path);
            } else if (element?.type === 'node') {
              // If it's a node button, toggle it
              const nodeId = focusedElementId.replace('node.', '').split('.')[0];
              toggleNode(nodeId);
            }
          }
          break;
        case 'Tab':
          // Allow default Tab behavior for navigation between sections
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPick, focusedElementId, focusableElements, expandedNodes, filteredStartNodes, filteredGuaranteed, filteredConditional, debugSteps, toggleNode]);

  // No schema suggestions - we only show what's actually in debugStep.output
  // This ensures the Variable Popup matches exactly what's shown in the Debug Console

  // Initialize expanded sections on mount (all expanded by default)
  useEffect(() => {
    const sections = new Set<string>();
    if (currentInput) sections.add('currentInput'); // Add current input section if available
    if (startNodes.length > 0) sections.add('start');
    if (guaranteed.length > 0) sections.add('guaranteed');
    if (conditional.length > 0) sections.add('conditional');
    setExpandedSections(sections);
  }, [currentInput, startNodes.length, guaranteed.length, conditional.length]);

  // Auto-expand nodes when debugSteps are updated (e.g., after Play button click)
  // This ensures that newly executed nodes with output are automatically visible
  useEffect(() => {
    if (!debugSteps || debugSteps.length === 0) return;
    
    const nodesToExpand = new Set<string>();
    
    // Check all nodes for new output data
    [...startNodes, ...guaranteed, ...conditional].forEach(n => {
      const debugStep = debugSteps.find(s => s.nodeId === n.id);
      const nodeOutput = debugStep?.output;
      
      // Auto-expand if node has output data
      if (nodeOutput && (
        (nodeOutput.json !== undefined && nodeOutput.json !== null) ||
        (nodeOutput.data !== undefined && nodeOutput.data !== nodeOutput.json) ||
        nodeOutput.metadata ||
        nodeOutput.error
      )) {
        nodesToExpand.add(n.id);
      }
    });
    
    // Update expanded nodes (merge with existing, don't collapse already expanded ones)
    if (nodesToExpand.size > 0) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        nodesToExpand.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [debugSteps, startNodes, guaranteed, conditional]);

  // Optional: fetch sample outputs for API upstreams to populate tree keys
  const [upstreamPreview, setUpstreamPreview] = useState<Record<string, any>>({});
  useEffect(() => {
    let aborted = false;
    const load = async () => {
      for (const n of upstreamNodes) {
        if (n?.type === 'api') {
          const url = (n.data as any)?.url;
          if (url && typeof url === 'string' && upstreamPreview[n.id] === undefined) {
            try {
              const res = await fetch(url);
              if (!res.ok) throw new Error(String(res.status));
              const json = await res.json();
              if (!aborted) setUpstreamPreview(prev => ({ ...prev, [n.id]: json }));
            } catch {
              if (!aborted) setUpstreamPreview(prev => ({ ...prev, [n.id]: (n.data || {}) }));
            }
          }
        }
      }
    };
    load();
    return () => { aborted = true; };
  }, [upstreamNodes]);

  if (!anchorEl) return null;

  const hasStartNodes = filteredStartNodes.length > 0;
  const hasGuaranteedNodes = filteredGuaranteed.length > 0;
  const hasConditionalNodes = filteredConditional.length > 0;
  const hasWorkflowVariables = currentVariables && Object.keys(currentVariables).length > 0;
  const hasFallbackData = (!currentNodeId || upstreamNodes.length === 0) && data && typeof data === 'object';
  
  // Check if search has no results
  const hasSearchResults = hasStartNodes || hasGuaranteedNodes || hasConditionalNodes || hasWorkflowVariables || (currentInput && searchTerm ? treeNodeMatchesSearch(searchTerm, '', 'currentInput', currentInput) : !!currentInput) || hasFallbackData;

  const content = (
    <div
      ref={ref}
      style={{ 
        position: 'fixed', 
        left: `${pos.left}px`, 
        top: `${pos.top}px`, 
        width: `${pos.width}px`, 
        height: userHeight !== null ? `${userHeight}px` : 'auto',
        maxHeight: userHeight !== null ? `${userHeight}px` : `${pos.maxHeight}px`, 
        zIndex: 10000,
        animation: isResizing ? 'none' : 'fadeIn 0.2s ease-out, slideIn 0.2s ease-out',
      }}
      className="bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      tabIndex={-1}
    >
      {/* Header - Draggable */}
      <div 
        ref={dragHandleRef}
        className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 cursor-move select-none"
        onMouseDown={(e) => {
          // Don't start drag if clicking on buttons
          if ((e.target as HTMLElement).closest('button')) return;
          setIsDragging(true);
          setDragStart({ x: e.clientX, y: e.clientY });
          e.preventDefault();
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 0) return;
          const touch = e.touches[0];
          // Don't start drag if clicking on buttons
          if ((e.target as HTMLElement).closest('button')) return;
          setIsDragging(true);
          setDragStart({ x: touch.clientX, y: touch.clientY });
          e.preventDefault();
        }}
        style={{ userSelect: 'none' }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-800">Available Variables</h3>
          <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Drag to move">
            <title>Drag to move</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
        <div className="flex items-center gap-1">
          {/* Expand/Collapse All Nodes button */}
          {(hasStartNodes || hasGuaranteedNodes || hasConditionalNodes) && (
            <button
              onClick={() => {
                const allNodesExpanded = [...startNodes, ...guaranteed, ...conditional].every(n => expandedNodes.has(n.id));
                if (allNodesExpanded) {
                  // Collapse all nodes
                  setExpandedNodes(new Set());
                } else {
                  // Expand all nodes that have data
                  const nodeIdsToExpand = new Set<string>();
                  [...startNodes, ...guaranteed, ...conditional].forEach(n => {
                    const debugStep = debugSteps.find(s => s.nodeId === n.id);
                    const outputData = debugStep?.output ?? upstreamPreview[n.id] ?? n.data ?? {};
                    if (Object.keys(outputData).length > 0) {
                      nodeIdsToExpand.add(n.id);
                    }
                  });
                  setExpandedNodes(nodeIdsToExpand);
                }
              }}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title={expandedNodes.size > 0 ? 'Collapse All Nodes' : 'Expand All Nodes'}
            >
              {expandedNodes.size > 0 ? '−' : '+'}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Close (Esc)"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus={false}
            onKeyDown={(e) => {
              // Allow Escape to close even when in search
              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
          />
          <svg 
            className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div 
        className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
        style={{ 
          // Calculate content height: total height minus header (~60px) and footer (~40px)
          height: userHeight !== null 
            ? `${Math.max(100, userHeight - 100)}px` 
            : 'auto',
          maxHeight: userHeight !== null 
            ? `${Math.max(100, userHeight - 100)}px` 
            : `${Math.max(100, pos.maxHeight - 100)}px`,
          minHeight: '100px', // Ensure minimum scrollable content
        }}
      >
        {/* Current Input Section (Loop Context) */}
        {currentInput && (
          <div className="border border-purple-200 rounded-md overflow-hidden mb-2">
            <button
              onClick={() => toggleSection('currentInput')}
              className="w-full px-3 py-2 bg-purple-50 hover:bg-purple-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg 
                  className={`w-4 h-4 text-purple-600 transition-transform ${expandedSections.has('currentInput') ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-xs font-semibold text-purple-700">Current Input</span>
                <span className="text-xs text-purple-500">(Loop Context)</span>
              </div>
            </button>
            {expandedSections.has('currentInput') && (
              <div className="p-2 bg-white space-y-2 transition-all duration-200 ease-out">
                <div className="text-xs text-gray-600 mb-2 px-1">
                  Variables available in this node's input:
                </div>
                
                {/* Show loop.current if available */}
                {currentInput.loop?.current !== undefined && (
                  <div className="border-l-2 border-purple-300 pl-2 py-1">
                    <div className="text-xs font-semibold text-purple-700 mb-1">loop.current</div>
                    <div className="text-xs text-gray-600 mb-2">Current item in the loop</div>
                    <TreeNode 
                      path="loop" 
                      keyName="current" 
                      value={currentInput.loop.current} 
                      onPick={onPick}
                      searchTerm={searchTerm}
                      onFocus={setFocusedElementId}
                      focusId="loop.current"
                    />
                  </div>
                )}
                
                {/* Show current directly if available (convenience alias) */}
                {currentInput.current !== undefined && !currentInput.loop && (
                  <div className="border-l-2 border-purple-300 pl-2 py-1">
                    <div className="text-xs font-semibold text-purple-700 mb-1">current</div>
                    <div className="text-xs text-gray-600 mb-2">Current item (alias for loop.current)</div>
                    <TreeNode 
                      path="" 
                      keyName="current" 
                      value={currentInput.current} 
                      onPick={onPick}
                      searchTerm={searchTerm}
                      onFocus={setFocusedElementId}
                      focusId="current"
                    />
                  </div>
                )}
                
                {/* Show loop.index if available */}
                {currentInput.loop?.index !== undefined && (
                  <div className="border-l-2 border-purple-300 pl-2 py-1">
                    <button
                      onClick={() => onPick('loop.index')}
                      className="w-full text-left flex items-center gap-2 hover:bg-gray-50 rounded px-1 py-1 transition-colors"
                    >
                      <span className="text-xs font-mono text-purple-600">loop.index</span>
                      <span className="text-xs text-gray-500">= {currentInput.loop.index}</span>
                    </button>
                  </div>
                )}
                
                {/* Show index directly if available (convenience alias) */}
                {currentInput.index !== undefined && !currentInput.loop && (
                  <div className="border-l-2 border-purple-300 pl-2 py-1">
                    <button
                      onClick={() => onPick('index')}
                      className="w-full text-left flex items-center gap-2 hover:bg-gray-50 rounded px-1 py-1 transition-colors"
                    >
                      <span className="text-xs font-mono text-purple-600">index</span>
                      <span className="text-xs text-gray-500">= {currentInput.index}</span>
                    </button>
                  </div>
                )}
                
                {/* Show loop.array if available */}
                {currentInput.loop?.array !== undefined && (
                  <div className="border-l-2 border-purple-300 pl-2 py-1">
                    <div className="text-xs font-semibold text-purple-700 mb-1">loop.array</div>
                    <div className="text-xs text-gray-600 mb-2">Full array being iterated</div>
                    <TreeNode 
                      path="loop" 
                      keyName="array" 
                      value={currentInput.loop.array} 
                      onPick={onPick}
                      searchTerm={searchTerm}
                      onFocus={setFocusedElementId}
                      focusId="loop.array"
                    />
                  </div>
                )}
                
                {/* Show other input fields if available */}
                {Object.entries(currentInput).filter(([k]) => k !== 'loop' && k !== 'current' && k !== 'index').map(([k, v]) => (
                  <div key={k} className="border-l-2 border-purple-300 pl-2 py-1">
                    <TreeNode path="" keyName={k} value={v} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={k} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Workflow Variables Section */}
        {currentVariables && Object.keys(currentVariables).length > 0 && (
          <div className="border border-blue-200 rounded-md overflow-hidden mb-2">
            <button
              onClick={() => toggleSection('workflowVariables')}
              className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg 
                  className={`w-4 h-4 text-blue-600 transition-transform ${expandedSections.has('workflowVariables') ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-xs font-semibold text-blue-700">Workflow Variables</span>
                <span className="text-xs text-blue-500">({Object.keys(currentVariables).length})</span>
              </div>
            </button>
            {expandedSections.has('workflowVariables') && (
              <div className="p-2 bg-white space-y-2 transition-all duration-200 ease-out">
                {Object.entries(currentVariables)
                  .filter(([k, v]) => !searchTerm || treeNodeMatchesSearch(searchTerm, 'vars', k, v))
                  .map(([k, v]) => (
                    <div key={k} className="border-l-2 border-blue-300 pl-2 py-1">
                      <TreeNode path="vars" keyName={k} value={v} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`vars.${k}`} />
                    </div>
                  ))}
                {Object.entries(currentVariables).filter(([k, v]) => !searchTerm || treeNodeMatchesSearch(searchTerm, 'vars', k, v)).length === 0 && searchTerm && (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    No matching workflow variables
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Start Nodes Section */}
        {hasStartNodes && (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => toggleSection('start')}
              className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg 
                  className={`w-4 h-4 text-gray-600 transition-transform ${expandedSections.has('start') ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-xs font-semibold text-gray-700">Start</span>
                <span className="text-xs text-gray-500">({startNodes.length})</span>
              </div>
            </button>
            {expandedSections.has('start') && (
              <div className="p-2 bg-white space-y-2 transition-all duration-200 ease-out">
                {filteredStartNodes.length === 0 && searchTerm ? (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    No matching variables in Start nodes
                  </div>
                ) : (
                  filteredStartNodes.map(n => {
                    const debugStep = debugSteps.find(s => s.nodeId === n.id);
                    // Use exactly what's in debugStep.output - no fallbacks, no special logic
                    const nodeOutput = debugStep?.output;
                    // Check if output has any meaningful data (json, data, metadata, error)
                    const hasOutput = nodeOutput && (
                      (nodeOutput.json !== undefined && nodeOutput.json !== null) ||
                      (nodeOutput.data !== undefined && nodeOutput.data !== null) ||
                      nodeOutput.metadata ||
                      nodeOutput.error
                    );
                    const isNodeExpanded = expandedNodes.has(n.id);
                    
                    return (
                      <div key={n.id} className="border-l-2 border-blue-300 pl-2 py-1">
                        <button
                          onClick={() => toggleNode(n.id)}
                          className="w-full text-left flex items-center gap-2 mb-1 hover:bg-gray-50 rounded px-1 py-1 transition-colors"
                          disabled={!hasOutput}
                        >
                          <svg 
                            className={`w-3 h-3 text-gray-600 transition-transform flex-shrink-0 ${isNodeExpanded ? 'rotate-90' : ''} ${!hasOutput ? 'opacity-30' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                          <span className="text-xs font-semibold text-gray-800 truncate flex-1">
                            {n.data?.label || 'Start'}
                          </span>
                          {hasOutput && (
                            <span className="text-xs text-gray-400">
                              {(() => {
                                let count = 0;
                                if (nodeOutput?.json !== undefined && nodeOutput.json !== null) count++;
                                if (nodeOutput?.data !== undefined && nodeOutput.data !== null && nodeOutput.data !== nodeOutput.json) count++;
                                if (nodeOutput?.metadata) count++;
                                if (nodeOutput?.error) count++;
                                return `${count} ${count === 1 ? 'field' : 'fields'}`;
                              })()}
                            </span>
                          )}
                        </button>
                        {isNodeExpanded && hasOutput && (
                          <div className="space-y-0.5 ml-6 mt-1 border-l-2 border-blue-200 pl-2">
                            {/* Show exactly what's in output - no special handling */}
                          {nodeOutput?.json !== undefined && (
                            <TreeNode key="json" path="input" keyName="json" value={nodeOutput.json} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`input.json`} />
                          )}
                          {nodeOutput?.data !== undefined && nodeOutput.data !== nodeOutput.json && (
                            <TreeNode key="data" path="input" keyName="data" value={nodeOutput.data} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`input.data`} />
                          )}
                          {nodeOutput?.metadata && (
                            <TreeNode key="metadata" path="input" keyName="metadata" value={nodeOutput.metadata} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`input.metadata`} />
                          )}
                          {nodeOutput?.error && (
                            <TreeNode key="error" path="input" keyName="error" value={nodeOutput.error} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`input.error`} />
                          )}
                          </div>
                        )}
                        {isNodeExpanded && !hasOutput && (
                          <div className="text-xs text-gray-400 italic ml-6">No output data. Test the node to see output.</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Guaranteed Nodes Section */}
        {hasGuaranteedNodes && (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => toggleSection('guaranteed')}
              className="w-full px-3 py-2 bg-green-50 hover:bg-green-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg 
                  className={`w-4 h-4 text-green-600 transition-transform ${expandedSections.has('guaranteed') ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-xs font-semibold text-green-700">Guaranteed</span>
                <span className="text-xs text-green-600">({guaranteed.length})</span>
              </div>
              <span className="text-xs text-green-600" title="These nodes always execute">●</span>
            </button>
            {expandedSections.has('guaranteed') && (
              <div className="p-2 bg-white space-y-2 transition-all duration-200 ease-out">
                {filteredGuaranteed.length === 0 && searchTerm ? (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    No matching variables in Guaranteed nodes
                  </div>
                ) : (
                  filteredGuaranteed.map(n => {
                    const debugStep = debugSteps.find(s => s.nodeId === n.id);
                    // Use exactly what's in debugStep.output - no fallbacks, no special logic
                    const nodeOutput = debugStep?.output;
                    // Check if output has any meaningful data (json, data, metadata, error)
                    const hasOutput = nodeOutput && (
                      (nodeOutput.json !== undefined && nodeOutput.json !== null) ||
                      (nodeOutput.data !== undefined && nodeOutput.data !== null) ||
                      nodeOutput.metadata ||
                      nodeOutput.error
                    );
                    const isNodeExpanded = expandedNodes.has(n.id);
                    
                    return (
                      <div key={n.id} className="border-l-2 border-green-300 pl-2 py-1">
                        <button
                          onClick={() => toggleNode(n.id)}
                          onFocus={() => setFocusedElementId(`node.${n.id}`)}
                          data-focus-id={`node.${n.id}`}
                          tabIndex={0}
                          className="w-full text-left flex items-center gap-2 mb-1 hover:bg-gray-50 rounded px-1 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                          disabled={!hasOutput}
                        >
                          <svg 
                            className={`w-3 h-3 text-green-600 transition-transform flex-shrink-0 ${isNodeExpanded ? 'rotate-90' : ''} ${!hasOutput ? 'opacity-30' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                          <span className="text-xs font-semibold text-gray-800 truncate flex-1">
                            {n.data?.label || n.type}
                          </span>
                          {hasOutput && (
                            <span className="text-xs text-green-600">
                              {(() => {
                                let count = 0;
                                if (nodeOutput?.json !== undefined && nodeOutput.json !== null) count++;
                                if (nodeOutput?.data !== undefined && nodeOutput.data !== null && nodeOutput.data !== nodeOutput.json) count++;
                                if (nodeOutput?.metadata) count++;
                                if (nodeOutput?.error) count++;
                                return `${count} ${count === 1 ? 'field' : 'fields'}`;
                              })()}
                            </span>
                          )}
                        </button>
                        {isNodeExpanded && hasOutput && (
                          <div className="space-y-0.5 ml-6 mt-1 border-l-2 border-green-200 pl-2">
                            {/* Show exactly what's in output - no special handling */}
                          {nodeOutput?.json !== undefined && (
                            <TreeNode key="json" path={`steps.${n.id}`} keyName="json" value={nodeOutput.json} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`steps.${n.id}.json`} />
                          )}
                          {nodeOutput?.data !== undefined && nodeOutput.data !== nodeOutput.json && (
                            <TreeNode key="data" path={`steps.${n.id}`} keyName="data" value={nodeOutput.data} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`steps.${n.id}.data`} />
                          )}
                          {nodeOutput?.metadata && (
                            <TreeNode key="metadata" path={`steps.${n.id}`} keyName="metadata" value={nodeOutput.metadata} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`steps.${n.id}.metadata`} />
                          )}
                          {nodeOutput?.error && (
                            <TreeNode key="error" path={`steps.${n.id}`} keyName="error" value={nodeOutput.error} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`steps.${n.id}.error`} />
                          )}
                          </div>
                        )}
                        {isNodeExpanded && !hasOutput && (
                          <div className="text-xs text-gray-400 italic ml-6">No output data. Test the node to see output.</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Conditional Nodes Section */}
        {hasConditionalNodes && (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => toggleSection('conditional')}
              className="w-full px-3 py-2 bg-amber-50 hover:bg-amber-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg 
                  className={`w-4 h-4 text-amber-600 transition-transform ${expandedSections.has('conditional') ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-xs font-semibold text-amber-700">Conditional</span>
                <span className="text-xs text-amber-600">({conditional.length})</span>
              </div>
              <span className="text-xs text-amber-600" title="These nodes may not execute">●</span>
            </button>
            {expandedSections.has('conditional') && (
              <div className="p-2 bg-white space-y-2 transition-all duration-200 ease-out">
                {filteredConditional.length === 0 && searchTerm ? (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    No matching variables in Conditional nodes
                  </div>
                ) : (
                  filteredConditional.map(n => {
                    const debugStep = debugSteps.find(s => s.nodeId === n.id);
                    // Use exactly what's in debugStep.output - no fallbacks, no special logic
                    const nodeOutput = debugStep?.output;
                    // Check if output has any meaningful data (json, data, metadata, error)
                    const hasOutput = nodeOutput && (
                      (nodeOutput.json !== undefined && nodeOutput.json !== null) ||
                      (nodeOutput.data !== undefined && nodeOutput.data !== null) ||
                      nodeOutput.metadata ||
                      nodeOutput.error
                    );
                    const isNodeExpanded = expandedNodes.has(n.id);
                    
                    return (
                      <div key={n.id} className="border-l-2 border-amber-300 pl-2 py-1">
                        <button
                          onClick={() => toggleNode(n.id)}
                          className="w-full text-left flex items-center gap-2 mb-1 hover:bg-gray-50 rounded px-1 py-1 transition-colors"
                          disabled={!hasOutput}
                        >
                          <svg 
                            className={`w-3 h-3 text-amber-600 transition-transform flex-shrink-0 ${isNodeExpanded ? 'rotate-90' : ''} ${!hasOutput ? 'opacity-30' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
                          <span className="text-xs font-semibold text-gray-800 truncate flex-1">
                            {n.data?.label || n.type}
                          </span>
                          {hasOutput && (
                            <span className="text-xs text-amber-600">
                              {(() => {
                                let count = 0;
                                if (nodeOutput?.json !== undefined && nodeOutput.json !== null) count++;
                                if (nodeOutput?.data !== undefined && nodeOutput.data !== null && nodeOutput.data !== nodeOutput.json) count++;
                                if (nodeOutput?.metadata) count++;
                                if (nodeOutput?.error) count++;
                                return `${count} ${count === 1 ? 'field' : 'fields'}`;
                              })()}
                            </span>
                          )}
                        </button>
                        {isNodeExpanded && hasOutput && (
                          <div className="space-y-0.5 ml-6 mt-1 border-l-2 border-amber-200 pl-2">
                            {/* Show exactly what's in output - no special handling */}
                          {nodeOutput?.json !== undefined && (
                            <TreeNode key="json" path={`steps.${n.id}`} keyName="json" value={nodeOutput.json} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`steps.${n.id}.json`} />
                          )}
                          {nodeOutput?.data !== undefined && nodeOutput.data !== nodeOutput.json && (
                            <TreeNode key="data" path={`steps.${n.id}`} keyName="data" value={nodeOutput.data} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`steps.${n.id}.data`} />
                          )}
                          {nodeOutput?.metadata && (
                            <TreeNode key="metadata" path={`steps.${n.id}`} keyName="metadata" value={nodeOutput.metadata} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`steps.${n.id}.metadata`} />
                          )}
                          {nodeOutput?.error && (
                            <TreeNode key="error" path={`steps.${n.id}`} keyName="error" value={nodeOutput.error} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`steps.${n.id}.error`} />
                          )}
                          </div>
                        )}
                        {isNodeExpanded && !hasOutput && (
                          <div className="text-xs text-gray-400 italic ml-6">No output data. Test the node to see output.</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Fallback single data mode */}
        {hasFallbackData && (
          <div className="border border-gray-200 rounded-md p-2 bg-gray-50">
            <div className="text-xs font-semibold text-gray-700 mb-2">Input Data</div>
            <div className="space-y-0.5">
              {Object.entries(data).map(([k, v]) => (
                <TreeNode key={k} path="input" keyName={k} value={v} onPick={onPick} searchTerm={searchTerm} onFocus={setFocusedElementId} focusId={`input.${k}`} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state - No search results */}
        {searchTerm && !hasSearchResults && (
          <div className="text-center py-8 text-gray-400 text-sm">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="font-semibold">No matching data</p>
            <p className="text-xs mt-1">Try adjusting your search</p>
          </div>
        )}

        {/* Empty state - No variables available */}
        {!searchTerm && !currentInput && !hasStartNodes && !hasGuaranteedNodes && !hasConditionalNodes && !hasFallbackData && (
          <div className="text-center py-8 text-gray-400 text-sm">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>No variables available</p>
            <p className="text-xs mt-1">Connect nodes to see their outputs</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 relative">
        <div className="flex items-center justify-between">
          <span>Click to insert variable</span>
          <span className="font-mono text-gray-600">{'{{path}}'}</span>
        </div>
        {/* Resize Handle */}
        <div
          ref={resizeHandleRef}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
          }}
          className={`absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize transition-all group touch-none ${
            isResizing ? 'h-3 bg-blue-300' : 'hover:bg-gray-300/50'
          }`}
          style={{
            cursor: 'ns-resize',
            marginBottom: '-2px',
          }}
          title="Drag to resize height"
        >
          {/* Visual grip indicator - always visible but more prominent on hover */}
          <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-1.5 transition-opacity ${
            isResizing ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'
          }`}>
            <div className={`h-0.5 rounded-full transition-colors ${
              isResizing ? 'w-10 bg-blue-600' : 'w-8 bg-gray-500'
            }`}></div>
            <div className={`h-0.5 rounded-full transition-colors ${
              isResizing ? 'w-10 bg-blue-600' : 'w-8 bg-gray-500'
            }`}></div>
            <div className={`h-0.5 rounded-full transition-colors ${
              isResizing ? 'w-10 bg-blue-600' : 'w-8 bg-gray-500'
            }`}></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render into body to escape any stacking contexts/overflow
  return createPortal(content, document.body);
};


