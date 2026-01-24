/**
 * VariableNodeConfigForm Component
 * 
 * Custom configuration form for Variable nodes with Set/Update modes
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { VariableTreePopover } from '../VariableTreePopover';
import { ExpressionEditor } from '../ExpressionEditor';
import type { Node, Edge } from '@xyflow/react';

interface VariableNodeConfigFormProps {
  config: any;
  onConfigChange: (config: any) => void;
  nodes?: Node[];
  edges?: Edge[];
  currentNodeId?: string;
  debugSteps?: any[];
  workflowVariables?: Record<string, any>;
}

export function VariableNodeConfigForm({
  config,
  onConfigChange,
  nodes = [],
  edges = [],
  currentNodeId,
  debugSteps = [],
  workflowVariables = {},
}: VariableNodeConfigFormProps) {
  const [variableMode, setVariableMode] = useState<'set' | 'update'>(config.variableMode || 'set');
  const [selectedVariable, setSelectedVariable] = useState<string>(config.selectedVariable || '');
  const [selectedField, setSelectedField] = useState<string>(config.selectedField || '');
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const fieldPickerButtonRef = useRef<HTMLButtonElement>(null);
  
  // Track if we're updating internally to prevent loops
  const isInternalUpdateRef = useRef(false);

  // Get available variables
  const availableVariables = useMemo(() => {
    const vars: Record<string, any> = {};
    
    // Extract from workflow variables
    if (workflowVariables) {
      Object.assign(vars, workflowVariables);
    }
    
    // Extract from Variable Nodes on canvas
    nodes.forEach((node) => {
      if (node.type === 'variable') {
        const nodeData = node.data || {};
        const variableName = typeof nodeData?.variableName === 'string' ? nodeData.variableName.trim() : '';
        const variableValue = nodeData?.variableValue;
        
        if (variableName && variableValue !== undefined && variableValue !== null && variableValue !== '') {
          const valueStr = String(variableValue);
          if (!valueStr.includes('{{')) {
            try {
              const trimmed = valueStr.trim();
              if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                vars[variableName] = JSON.parse(trimmed);
              } else if (trimmed === 'true') {
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
            } catch (e) {
              vars[variableName] = valueStr;
            }
          }
        }
      }
    });
    
    return vars;
  }, [workflowVariables, nodes]);

  // Get selected variable value
  const selectedVariableValue = useMemo(() => {
    if (!selectedVariable || !availableVariables[selectedVariable]) {
      return null;
    }
    return availableVariables[selectedVariable];
  }, [selectedVariable, availableVariables]);

  // Auto-fill variableName and variablePath when selections change
  // Only update if values actually changed to avoid infinite loops
  useEffect(() => {
    // Skip if this is an internal update (to prevent loops)
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    
    if (variableMode === 'update' && selectedVariable) {
      // Only update if variableName or variablePath actually changed
      const needsUpdate = 
        config.variableName !== selectedVariable || 
        (selectedField && config.variablePath !== selectedField) ||
        (!selectedField && config.variablePath !== '');
      
      if (needsUpdate) {
        const updates: any = {
          variableName: selectedVariable,
        };
        
        if (selectedField) {
          updates.variablePath = selectedField;
        } else {
          updates.variablePath = '';
        }
        
        onConfigChange(updates);
      }
    }
  }, [variableMode, selectedVariable, selectedField, config.variableName, config.variablePath]);

  // Sync with config changes from outside (only when config changes externally, not from our own updates)
  useEffect(() => {
    // Skip if this is an internal update
    if (isInternalUpdateRef.current) {
      return;
    }
    
    let hasChanges = false;
    
    if (config.variableMode !== undefined && config.variableMode !== variableMode) {
      isInternalUpdateRef.current = true;
      setVariableMode(config.variableMode);
      hasChanges = true;
    }
    if (config.selectedVariable !== undefined && config.selectedVariable !== selectedVariable) {
      isInternalUpdateRef.current = true;
      setSelectedVariable(config.selectedVariable);
      hasChanges = true;
    }
    if (config.selectedField !== undefined && config.selectedField !== selectedField) {
      isInternalUpdateRef.current = true;
      setSelectedField(config.selectedField);
      hasChanges = true;
    }
    
    if (hasChanges) {
      // Reset flag after state updates
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 0);
    }
  }, [config.variableMode, config.selectedVariable, config.selectedField]);

  const handleModeChange = (mode: 'set' | 'update') => {
    isInternalUpdateRef.current = true;
    setVariableMode(mode);
    
    // Clear update-specific fields when switching to set mode
    if (mode === 'set') {
      setSelectedVariable('');
      setSelectedField('');
      onConfigChange({ 
        variableMode: mode,
        selectedVariable: '',
        selectedField: '',
        variablePath: config.variablePath || '', // Keep variablePath for set mode
      });
    } else {
      onConfigChange({ variableMode: mode });
    }
  };

  const handleVariableSelect = (varName: string) => {
    isInternalUpdateRef.current = true;
    setSelectedVariable(varName);
    setSelectedField(''); // Reset field when variable changes
    onConfigChange({ 
      selectedVariable: varName,
      selectedField: '',
      variableName: varName,
      variablePath: '', // Clear path when variable changes
    });
  };

  const handleFieldPick = (path: string) => {
    // Extract relative path (remove "vars." prefix and variable name)
    // Path from VariableTreePopover will be like "vars.test.options.c"
    let relativePath = path;
    
    if (path.startsWith('vars.')) {
      relativePath = path.substring(5); // Remove "vars."
      
      // Remove variable name prefix
      if (relativePath.startsWith(selectedVariable + '.')) {
        relativePath = relativePath.substring(selectedVariable.length + 1);
      } else if (relativePath.startsWith(selectedVariable + '[')) {
        relativePath = relativePath.substring(selectedVariable.length);
      } else if (relativePath === selectedVariable) {
        relativePath = ''; // Root level - updating entire variable
      }
    }
    
    isInternalUpdateRef.current = true;
    setSelectedField(relativePath);
    setShowFieldPicker(false);
    
    // Auto-fill variableName and variablePath
    onConfigChange({ 
      selectedField: relativePath,
      variableName: selectedVariable,
      variablePath: relativePath,
    });
  };

  // Get current value of selected field for preview
  const getFieldCurrentValue = (): any => {
    if (!selectedVariable || !selectedField) return null;
    
    try {
      const varValue = availableVariables[selectedVariable];
      if (!varValue) return null;
      
      // Parse path
      const parts = selectedField.split(/[\.\[\]]/).filter(p => p !== '');
      let current = varValue;
      
      for (const part of parts) {
        if (current === null || current === undefined) return null;
        const index = parseInt(part, 10);
        if (!isNaN(index) && Array.isArray(current)) {
          current = current[index];
        } else if (typeof current === 'object') {
          current = current[part];
        } else {
          return null;
        }
      }
      
      return current;
    } catch {
      return null;
    }
  };

  const fieldCurrentValue = getFieldCurrentValue();

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mode
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleModeChange('set')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              variableMode === 'set'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Set Variable
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('update')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              variableMode === 'update'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Update Variable
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {variableMode === 'set' 
            ? 'Create or set a new variable' 
            : 'Update an existing variable or its nested properties'}
        </p>
      </div>

      {/* Set Mode */}
      {variableMode === 'set' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variable Name
            </label>
            <input
              type="text"
              value={config.variableName || ''}
              onChange={(e) => onConfigChange({ variableName: e.target.value })}
              placeholder="Variable name (e.g., counter, userData, items)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variable Value
            </label>
            <ExpressionEditor
              value={config.variableValue || ''}
              onChange={(value) => onConfigChange({ variableValue: value })}
              placeholder='Variable value (JSON: "text", 123, {"key": "value"}, [1,2,3], or use {{steps.nodeId.json.field}})'
              multiline={true}
              rows={4}
              nodes={nodes}
              edges={edges}
              currentNodeId={currentNodeId || ''}
              debugSteps={debugSteps}
              workflowVariables={workflowVariables}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nested Path (Optional)
            </label>
            <input
              type="text"
              value={config.variablePath || ''}
              onChange={(e) => onConfigChange({ variablePath: e.target.value })}
              placeholder='Path to update nested property (e.g., "user.email", "items[1].name")'
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to set the whole variable. Use this to update only a specific property.
            </p>
          </div>
        </>
      )}

      {/* Update Mode */}
      {variableMode === 'update' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variable to Update
            </label>
            <select
              value={selectedVariable}
              onChange={(e) => handleVariableSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Variable --</option>
              {Object.keys(availableVariables).sort().map((varName) => {
                const varValue = availableVariables[varName];
                let typeDisplay = '';
                if (Array.isArray(varValue)) {
                  typeDisplay = `Array[${varValue.length}]`;
                } else if (typeof varValue === 'object' && varValue !== null) {
                  typeDisplay = `Object{${Object.keys(varValue).length} keys}`;
                } else {
                  typeDisplay = typeof varValue;
                }
                return (
                  <option key={varName} value={varName}>
                    {varName} ({typeDisplay})
                  </option>
                );
              })}
            </select>
            {Object.keys(availableVariables).length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No variables available. Create a variable first using "Set Variable" mode.
              </p>
            )}
          </div>

          {selectedVariable && selectedVariableValue && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field to Update <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <button
                    ref={fieldPickerButtonRef}
                    type="button"
                    onClick={() => setShowFieldPicker(!showFieldPicker)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left bg-white hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span className={selectedField ? 'text-gray-900 font-mono text-sm' : 'text-gray-400'}>
                      {selectedField || 'Click to select field (or leave empty for entire variable)...'}
                    </span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showFieldPicker && fieldPickerButtonRef.current && (
                    <VariableTreePopover
                      anchorEl={fieldPickerButtonRef.current}
                      data={selectedVariableValue}
                      nodes={nodes}
                      edges={edges}
                      currentNodeId={currentNodeId}
                      debugSteps={debugSteps}
                      workflowVariables={{ [selectedVariable]: selectedVariableValue }}
                      onPick={handleFieldPick}
                      onClose={() => setShowFieldPicker(false)}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedField 
                    ? `Will update: ${selectedVariable}.${selectedField}` 
                    : `Leave empty to update entire variable "${selectedVariable}"`}
                </p>
                {selectedField && fieldCurrentValue !== null && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <span className="text-blue-700 font-medium">Current value:</span>
                    <pre className="mt-1 text-blue-600 font-mono text-xs overflow-x-auto whitespace-pre-wrap break-words">
                      {typeof fieldCurrentValue === 'object' 
                        ? JSON.stringify(fieldCurrentValue, null, 2) 
                        : String(fieldCurrentValue)}
                    </pre>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Value
                </label>
                <ExpressionEditor
                  value={config.variableValue || ''}
                  onChange={(value) => onConfigChange({ variableValue: value })}
                  placeholder={`New value for ${selectedVariable}${selectedField ? '.' + selectedField : ''} (e.g., "text", 123, {{steps.nodeId.json.field}})`}
                  multiline={true}
                  rows={4}
                  nodes={nodes}
                  edges={edges}
                  currentNodeId={currentNodeId || ''}
                  debugSteps={debugSteps}
                  workflowVariables={workflowVariables}
                />
              </div>
            </>
          )}

          {selectedVariable && !selectedVariableValue && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                Variable "{selectedVariable}" not found. Make sure it exists in the workflow.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

