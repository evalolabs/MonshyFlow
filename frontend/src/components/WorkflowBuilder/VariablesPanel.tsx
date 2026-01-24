/**
 * Variables Panel Component
 * 
 * Professional workflow variables management panel
 * Supports complex data types: objects, arrays, primitives
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Workflow } from '../../types/workflow';

interface VariablesPanelProps {
  workflow: Workflow | null;
  onUpdateVariables: (variables: Record<string, any>) => void;
  workflowId?: string;
  nodes?: any[]; // NEW: Nodes from canvas to extract Variable Nodes
  onSelectNode?: (nodeId: string) => void; // NEW: For jumping to Variable Nodes
  onAddNode?: (nodeType: string, initialData?: any) => void; // NEW: For creating Variable Nodes
}

interface VariableEditorProps {
  varName: string;
  varValue: any;
  onUpdate: (name: string, value: any) => void;
  onDelete: (name: string) => void;
  onCopyPath?: (path: string) => void; // NEW: Copy path to clipboard
  onFindUsages?: (varName: string) => Array<{ nodeId: string; nodeType: string; nodeLabel: string; field: string }>; // NEW: Find where variable is used
  onJumpToNode?: (nodeId: string) => void; // NEW: Jump to Variable Node
  onCreateVariableNode?: (varName: string, fieldPath?: string) => void; // NEW: Create Variable Node (with optional field path)
  variableNodeId?: string; // NEW: ID of Variable Node that sets this variable
}

// Helper component for expandable tree view of nested values
function ValueTreeView({ 
  value, 
  path = '', 
  depth = 0, 
  maxDepth = 3,
  varName = '',
  onUpdateField
}: { 
  value: any; 
  path?: string; 
  depth?: number; 
  maxDepth?: number;
  varName?: string;
  onUpdateField?: (varName: string, fieldPath: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(depth === 0); // Auto-expand first level
  
  const isPrimitive = value === null || value === undefined || (typeof value !== 'object' && typeof value !== 'function');
  const isString = typeof value === 'string';
  const isObject = !isPrimitive && !isString && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const hasChildren = !isPrimitive && !isString && (isObject || isArray) && depth < maxDepth && (
    isArray ? value.length > 0 : 
    isObject ? Object.keys(value).length > 0 : false
  );

  const getValueDisplay = () => {
    if (value === null) return <span className="text-gray-400 italic">null</span>;
    if (value === undefined) return <span className="text-gray-400 italic">undefined</span>;
    if (typeof value === 'string') {
      const display = value.length > 50 ? value.substring(0, 47) + '...' : value;
      return <span className="text-green-700">"{display}"</span>;
    }
    if (typeof value === 'number') return <span className="text-purple-600">{value}</span>;
    if (typeof value === 'boolean') return <span className="text-blue-600">{String(value)}</span>;
    if (isArray) return <span className="text-gray-500">Array[{value.length}]</span>;
    if (isObject) return <span className="text-gray-500">Object{'{'}{Object.keys(value).length} keys{'}'}</span>;
    return <span>{String(value)}</span>;
  };

  if (isPrimitive || isString || !hasChildren) {
    const fullPath = path || '';
    // Extract the relative path (remove varName prefix if present)
    // path can be "items[1].name" when varName is "items", we need "[1].name"
    let relativePath = fullPath;
    if (varName && fullPath.startsWith(varName)) {
      if (fullPath.startsWith(varName + '.')) {
        relativePath = fullPath.substring(varName.length + 1);
      } else if (fullPath.startsWith(varName + '[')) {
        relativePath = fullPath.substring(varName.length);
      } else if (fullPath === varName) {
        relativePath = ''; // Root level, can't update
      }
    }
    const canUpdate = varName && relativePath && onUpdateField && depth > 0; // Only show for nested fields
    
    return (
      <div className="flex items-center gap-2 group/item">
        <div className="text-xs font-mono text-gray-600 flex-1">
          {getValueDisplay()}
        </div>
        {canUpdate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateField(varName, relativePath);
            }}
            className="opacity-0 group-hover/item:opacity-100 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-all flex items-center gap-1"
            title={`Create Variable Node to update ${varName}.${relativePath}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Update
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1 group">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-4 h-4 flex items-center justify-center rounded hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors flex-shrink-0 border border-gray-300 hover:border-blue-400"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg 
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span className="text-xs font-mono text-gray-600 group-hover:text-blue-600">
          {isArray ? `Array[${value.length}]` : `Object{${Object.keys(value).length} keys}`}
        </span>
        <span className="text-[10px] text-gray-400 ml-1">
          {isExpanded ? '(expanded)' : '(click to expand)'}
        </span>
      </div>
      {isExpanded && (
        <div className="mt-1 ml-5 border-l-2 border-gray-200 pl-2 space-y-1">
          {isArray ? (
            value.length > 0 ? (
              value.slice(0, 10).map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-1">
                  <span className="text-xs text-gray-400 font-mono">[{index}]:</span>
                  <div className="flex-1">
                    <ValueTreeView 
                      value={item} 
                      path={`${path}[${index}]`} 
                      depth={depth + 1} 
                      maxDepth={maxDepth}
                      varName={varName}
                      onUpdateField={onUpdateField}
                    />
                  </div>
                </div>
              ))
            ).concat(
              value.length > 10 ? [<div key="more" className="text-xs text-gray-400 italic">... and {value.length - 10} more</div>] : []
            ) : (
              <div className="text-xs text-gray-400 italic">Empty array</div>
            )
          ) : (
            Object.entries(value).slice(0, 10).map(([key, val]) => (
              <div key={key} className="flex items-start gap-1">
                <span className="text-xs text-gray-600 font-mono">{key}:</span>
                <div className="flex-1">
                  <ValueTreeView 
                    value={val} 
                    path={path ? `${path}.${key}` : key} 
                    depth={depth + 1} 
                    maxDepth={maxDepth}
                    varName={varName}
                    onUpdateField={onUpdateField}
                  />
                </div>
              </div>
            )).concat(
              Object.keys(value).length > 10 ? [<div key="more" className="text-xs text-gray-400 italic">... and {Object.keys(value).length - 10} more keys</div>] : []
            )
          )}
        </div>
      )}
    </div>
  );
}

function VariableEditor({ 
  varName, 
  varValue, 
  onUpdate, 
  onDelete,
  onCopyPath,
  onFindUsages,
  onJumpToNode,
  onCreateVariableNode,
  variableNodeId
}: VariableEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showUsages, setShowUsages] = useState(false);
  const [usages, setUsages] = useState<Array<{ nodeId: string; nodeType: string; nodeLabel: string; field: string }>>([]);
  const [editNameValue, setEditName] = useState(varName);
  const [editValue, setEditValue] = useState(() => {
    try {
      return JSON.stringify(varValue, null, 2);
    } catch {
      return String(varValue);
    }
  });
  const [error, setError] = useState<string | null>(null);

  // Find usages when component mounts or varName changes
  useEffect(() => {
    if (onFindUsages) {
      const foundUsages = onFindUsages(varName);
      setUsages(foundUsages);
    }
  }, [varName, onFindUsages]);

  const handleSave = useCallback(() => {
    setError(null);
    try {
      let parsedValue: any;
      if (editValue.trim() === '') {
        parsedValue = undefined;
      } else {
        parsedValue = JSON.parse(editValue);
      }
      
      if (editNameValue !== varName) {
        // Rename variable
        onUpdate(editNameValue, parsedValue);
        onDelete(varName);
      } else {
        // Update value
        onUpdate(editNameValue, parsedValue);
      }
      setIsEditing(false);
    } catch (e: any) {
      setError(e.message || 'Invalid JSON');
    }
  }, [editNameValue, editValue, varName, onUpdate, onDelete]);

  const handleCopyPath = useCallback((nestedPath?: string) => {
    const path = nestedPath ? `{{vars.${varName}.${nestedPath}}}` : `{{vars.${varName}}}`;
    if (onCopyPath) {
      onCopyPath(path);
    } else {
      navigator.clipboard.writeText(path);
    }
  }, [varName, onCopyPath]);

  const handleCancel = useCallback(() => {
    setEditName(varName);
    setEditValue(() => {
      try {
        return JSON.stringify(varValue, null, 2);
      } catch {
        return String(varValue);
      }
    });
    setError(null);
    setIsEditing(false);
  }, [varName, varValue]);

  const isComplexValue = useMemo(() => {
    // Check if value is a complex type (object or array)
    // Also handle JSON strings that should be parsed
    let valueToCheck = varValue;
    
    // If it's a string that looks like JSON, try to parse it
    if (typeof varValue === 'string' && (varValue.trim().startsWith('{') || varValue.trim().startsWith('['))) {
      try {
        valueToCheck = JSON.parse(varValue);
      } catch {
        // Not valid JSON, keep as string
        return false;
      }
    }
    
    // Check if it's an object with keys
    if (typeof valueToCheck === 'object' && valueToCheck !== null && !Array.isArray(valueToCheck)) {
      return Object.keys(valueToCheck).length > 0;
    }
    
    // Check if it's an array with items
    if (Array.isArray(valueToCheck)) {
      return valueToCheck.length > 0;
    }
    
    return false;
  }, [varValue]);
  
  // Get the actual value (parsed if it was a JSON string)
  const actualValue = useMemo(() => {
    if (typeof varValue === 'string' && (varValue.trim().startsWith('{') || varValue.trim().startsWith('['))) {
      try {
        return JSON.parse(varValue);
      } catch {
        return varValue;
      }
    }
    return varValue;
  }, [varValue]);

  const getValuePreview = useCallback((value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value.length > 30 ? value.substring(0, 30) + '...' : value}"`;
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `Array[${value.length}]`;
      }
      return `Object{${Object.keys(value).length} keys}`;
    }
    return String(value);
  }, []);

  const getValueType = useCallback((value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }, []);

  if (isEditing) {
    return (
      <div className="border border-blue-300 rounded-lg p-3 bg-blue-50/50 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={editNameValue}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Variable name"
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSave}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
        <textarea
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            setError(null);
          }}
          placeholder='Enter JSON value (e.g., "text", 123, {"key": "value"}, [1, 2, 3])'
          className="w-full px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={6}
        />
        {error && (
          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            {error}
          </div>
        )}
        <div className="text-xs text-gray-500">
          Supports: strings, numbers, booleans, objects, arrays, null
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-semibold text-blue-700">{varName}</span>
            <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
              {getValueType(varValue)}
            </span>
            {variableNodeId && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded" title="Set by Variable Node">
                📝
              </span>
            )}
          </div>
          
          {/* Value Preview / Tree View */}
          {isComplexValue ? (
            <div className="mt-1">
              <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Hover over nested fields to update them
              </div>
              <ValueTreeView 
                value={actualValue} 
                path={varName} 
                varName={varName}
                onUpdateField={onCreateVariableNode}
              />
            </div>
          ) : (
            <div className="text-xs text-gray-600 font-mono break-all">
              {getValuePreview(varValue)}
            </div>
          )}

          {/* Usage Info */}
          {usages.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setShowUsages(!showUsages)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <svg className={`w-3 h-3 transition-transform ${showUsages ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Used in {usages.length} place{usages.length !== 1 ? 's' : ''}
              </button>
              {showUsages && (
                <div className="mt-1 ml-4 space-y-1">
                  {usages.map((usage, idx) => (
                    <div key={idx} className="text-xs text-gray-600">
                      <span className="font-mono">{usage.nodeLabel || usage.nodeType}</span>
                      {usage.field && <span className="text-gray-400"> ({usage.field})</span>}
                      {onJumpToNode && (
                        <button
                          onClick={() => onJumpToNode(usage.nodeId)}
                          className="ml-1 text-blue-600 hover:text-blue-800 underline"
                        >
                          Jump
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
          {/* Copy Path */}
          <button
            onClick={() => handleCopyPath()}
            className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Copy {{vars.variableName}} to clipboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          {/* Jump to Variable Node */}
          {variableNodeId && onJumpToNode && (
            <button
              onClick={() => onJumpToNode(variableNodeId)}
              className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
              title="Jump to Variable Node"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
          
          {/* Create Variable Node */}
          {!variableNodeId && onCreateVariableNode && (
            <button
              onClick={() => onCreateVariableNode(varName)}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Create Variable Node"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          
          {/* Edit */}
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit variable"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          {/* Delete */}
          <button
            onClick={() => {
              if (usages.length > 0) {
                if (!confirm(`Variable "${varName}" is used in ${usages.length} place(s). Are you sure you want to delete it?`)) {
                  return;
                }
              }
              onDelete(varName);
            }}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete variable"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function VariablesPanel({ 
  workflow, 
  onUpdateVariables, 
  workflowId: _workflowId, 
  nodes = [],
  onSelectNode,
  onAddNode
}: VariablesPanelProps) {
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Extract variables from Variable Nodes in the canvas
  const variablesFromNodes = useMemo(() => {
    const vars: Record<string, any> = {};
    nodes.forEach((node) => {
      if (node.type === 'variable') {
        const nodeData = node.data || {};
        const variableName = nodeData?.variableName?.trim();
        const variableValue = nodeData?.variableValue;
        
        // Only include if variableName is set and variableValue is not an expression
        if (variableName && variableValue !== undefined && variableValue !== null && variableValue !== '') {
          const valueStr = String(variableValue);
          // Skip if it's an expression (contains {{)
          if (!valueStr.includes('{{')) {
            try {
              // Try to parse as JSON if it looks like JSON
              const trimmed = valueStr.trim();
              if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                vars[variableName] = JSON.parse(trimmed);
              } else {
                // Try to parse as number, boolean, or keep as string
                if (trimmed === 'true') {
                  vars[variableName] = true;
                } else if (trimmed === 'false') {
                  vars[variableName] = false;
                } else if (trimmed === 'null') {
                  vars[variableName] = null;
                } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
                  vars[variableName] = Number(trimmed);
                } else {
                  vars[variableName] = trimmed;
                }
              }
            } catch (e) {
              // If parsing fails, use as string
              vars[variableName] = valueStr;
            }
          }
        }
      }
    });
    return vars;
  }, [nodes]);

  // Merge workflow variables with variables from Variable Nodes
  // Priority: workflow.variables (from DB) > variablesFromNodes (from Variable Nodes)
  const variables = useMemo(() => {
    return { ...variablesFromNodes, ...(workflow?.variables || {}) };
  }, [workflow?.variables, variablesFromNodes]);

  const handleAddVariable = useCallback(() => {
    setAddError(null);
    
    if (!newVarName.trim()) {
      setAddError('Variable name is required');
      return;
    }

    // Validate variable name (alphanumeric, underscore, no spaces)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newVarName.trim())) {
      setAddError('Variable name must start with a letter or underscore and contain only alphanumeric characters and underscores');
      return;
    }

    // Check if variable already exists
    if (variables[newVarName.trim()] !== undefined) {
      setAddError('Variable already exists');
      return;
    }

    try {
      let parsedValue: any = undefined;
      if (newVarValue.trim() !== '') {
        parsedValue = JSON.parse(newVarValue);
      }

      const updated = {
        ...variables,
        [newVarName.trim()]: parsedValue,
      };

      onUpdateVariables(updated);
      setNewVarName('');
      setNewVarValue('');
      setShowAddForm(false);
      setAddError(null);
    } catch (e: any) {
      setAddError(e.message || 'Invalid JSON value');
    }
  }, [newVarName, newVarValue, variables, onUpdateVariables]);

  const handleUpdateVariable = useCallback((name: string, value: any) => {
    const updated = {
      ...variables,
      [name]: value,
    };
    onUpdateVariables(updated);
  }, [variables, onUpdateVariables]);

  const handleDeleteVariable = useCallback((name: string) => {
    const updated = { ...variables };
    delete updated[name];
    onUpdateVariables(updated);
  }, [variables, onUpdateVariables]);

  // Find Variable Nodes that set each variable
  const variableNodeMap = useMemo(() => {
    const map: Record<string, string> = {}; // varName -> nodeId
    nodes.forEach((node) => {
      if (node.type === 'variable') {
        const nodeData = node.data || {};
        const variableName = nodeData?.variableName?.trim();
        if (variableName) {
          map[variableName] = node.id;
        }
      }
    });
    return map;
  }, [nodes]);

  // Find where variables are used
  const findVariableUsages = useCallback((varName: string): Array<{ nodeId: string; nodeType: string; nodeLabel: string; field: string }> => {
    const usages: Array<{ nodeId: string; nodeType: string; nodeLabel: string; field: string }> = [];
    const varPattern = new RegExp(`\\{\\{vars\\.${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\.[^}]+)?\\}\\}`, 'g');
    
    nodes.forEach((node) => {
      // Search in node.data (all fields)
      const searchInData = (data: any, path = 'data'): void => {
        if (!data || typeof data !== 'object') return;
        
        Object.entries(data).forEach(([key, value]) => {
          const currentPath = path === 'data' ? key : `${path}.${key}`;
          
          if (typeof value === 'string' && varPattern.test(value)) {
            usages.push({
              nodeId: node.id,
              nodeType: node.type || 'unknown',
              nodeLabel: (node.data?.label as string) || node.type || 'Unknown',
              field: currentPath
            });
          } else if (typeof value === 'object' && value !== null) {
            searchInData(value, currentPath);
          }
        });
      };
      
      if (node.data) {
        searchInData(node.data);
      }
    });
    
    return usages;
  }, [nodes]);

  // Helper functions for value type and preview
  const getValueType = useCallback((value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }, []);

  const getValuePreview = useCallback((value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value.length > 30 ? value.substring(0, 30) + '...' : value}"`;
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `Array[${value.length}]`;
      }
      return `Object{${Object.keys(value).length} keys}`;
    }
    return String(value);
  }, []);

  // Filter variables by search term
  const variableEntries = useMemo(() => {
    const entries = Object.entries(variables).sort(([a], [b]) => a.localeCompare(b));
    if (!searchTerm.trim()) return entries;
    
    const term = searchTerm.toLowerCase();
    return entries.filter(([name, value]) => {
      // Match by name
      if (name.toLowerCase().includes(term)) return true;
      
      // Match by type
      const type = getValueType(value);
      if (type.toLowerCase().includes(term)) return true;
      
      // Match by value preview
      const preview = getValuePreview(value);
      if (preview.toLowerCase().includes(term)) return true;
      
      return false;
    });
  }, [variables, searchTerm, getValueType, getValuePreview]);

  const handleCopyPath = useCallback((path: string) => {
    navigator.clipboard.writeText(path);
    // Could show a toast notification here
  }, []);

  const handleCreateVariableNode = useCallback((varName: string, fieldPath?: string) => {
    if (onAddNode) {
      const initialData: any = {
        variableName: varName,
      };
      
      if (fieldPath) {
        // For nested updates, set the path and try to get current value
        initialData.variablePath = fieldPath;
        try {
          const currentValue = getNestedValue(variables[varName], fieldPath);
          if (currentValue !== undefined) {
            initialData.variableValue = typeof currentValue === 'string' 
              ? currentValue 
              : JSON.stringify(currentValue);
          }
        } catch (e) {
          // If path doesn't exist, leave empty
        }
      } else {
        // For full variable, set the value
        initialData.variableValue = variables[varName] !== undefined 
          ? JSON.stringify(variables[varName]) 
          : '';
      }
      
      onAddNode('variable', initialData);
    }
  }, [onAddNode, variables]);

  // Helper to get nested value from object/array
  const getNestedValue = useCallback((obj: any, path: string): any => {
    const parts = path.split(/[\.\[\]]/).filter(p => p !== '');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      const index = parseInt(part, 10);
      if (!isNaN(index) && Array.isArray(current)) {
        current = current[index];
      } else if (typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return current;
  }, []);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between p-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Workflow Variables</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {variableEntries.length} variable{variableEntries.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Variable
          </button>
        </div>
        
        {/* Search */}
        {Object.keys(variables).length > 3 && (
          <div className="px-3 pb-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search variables..."
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Add Variable Form */}
        {showAddForm && (
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-3 bg-blue-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-gray-700">New Variable</h4>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewVarName('');
                  setNewVarValue('');
                  setAddError(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={newVarName}
              onChange={(e) => {
                setNewVarName(e.target.value);
                setAddError(null);
              }}
              placeholder="Variable name (e.g., counter, userData, items)"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={newVarValue}
              onChange={(e) => {
                setNewVarValue(e.target.value);
                setAddError(null);
              }}
              placeholder='Initial value (JSON, e.g., "text", 0, {"key": "value"}, [1, 2, 3], or leave empty)'
              className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
            {addError && (
              <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                {addError}
              </div>
            )}
            <button
              onClick={handleAddVariable}
              className="w-full px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Add Variable
            </button>
          </div>
        )}

        {/* Variables List */}
        {variableEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No variables defined</p>
            <p className="text-xs mt-1">Add a variable to get started</p>
          </div>
        ) : (
          variableEntries.map(([name, value]) => (
            <VariableEditor
              key={name}
              varName={name}
              varValue={value}
              onUpdate={handleUpdateVariable}
              onDelete={handleDeleteVariable}
              onCopyPath={handleCopyPath}
              onFindUsages={findVariableUsages}
              onJumpToNode={onSelectNode}
              onCreateVariableNode={(varName) => handleCreateVariableNode(varName)}
              variableNodeId={variableNodeMap[name]}
            />
          ))
        )}
        
        {/* No search results */}
        {searchTerm && variableEntries.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No variables match "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500">
          Variables can be accessed in expressions: <code className="bg-gray-200 px-1 rounded">{'{{vars.variableName}}'}</code>
        </p>
      </div>
    </div>
  );
}

