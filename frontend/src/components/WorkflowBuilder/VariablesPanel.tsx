/**
 * Variables Panel Component
 * 
 * Professional workflow variables management panel
 * Supports complex data types: objects, arrays, primitives
 */

import { useState, useCallback, useMemo } from 'react';
import type { Workflow } from '../../types/workflow';

interface VariablesPanelProps {
  workflow: Workflow | null;
  onUpdateVariables: (variables: Record<string, any>) => void;
  workflowId?: string;
  nodes?: any[]; // NEW: Nodes from canvas to extract Variable Nodes
}

interface VariableEditorProps {
  varName: string;
  varValue: any;
  onUpdate: (name: string, value: any) => void;
  onDelete: (name: string) => void;
}

function VariableEditor({ varName, varValue, onUpdate, onDelete }: VariableEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(varName);
  const [editValue, setEditValue] = useState(() => {
    try {
      return JSON.stringify(varValue, null, 2);
    } catch {
      return String(varValue);
    }
  });
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    setError(null);
    try {
      let parsedValue: any;
      if (editValue.trim() === '') {
        parsedValue = undefined;
      } else {
        parsedValue = JSON.parse(editValue);
      }
      
      if (editName !== varName) {
        // Rename variable
        onUpdate(editName, parsedValue);
        onDelete(varName);
      } else {
        // Update value
        onUpdate(editName, parsedValue);
      }
      setIsEditing(false);
    } catch (e: any) {
      setError(e.message || 'Invalid JSON');
    }
  }, [editName, editValue, varName, onUpdate, onDelete]);

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
            value={editName}
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
          </div>
          <div className="text-xs text-gray-600 font-mono break-all">
            {getValuePreview(varValue)}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit variable"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(varName)}
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

export function VariablesPanel({ workflow, onUpdateVariables, workflowId: _workflowId, nodes = [] }: VariablesPanelProps) {
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

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

  const variableEntries = useMemo(() => {
    return Object.entries(variables).sort(([a], [b]) => a.localeCompare(b));
  }, [variables]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
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
            />
          ))
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

