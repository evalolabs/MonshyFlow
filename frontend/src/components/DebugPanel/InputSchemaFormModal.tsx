/**
 * Input Schema Form Modal
 * 
 * Professional modal for entering test input data based on JSON Schema.
 * Includes auto-save/load functionality and form field generation.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { testInputStorage } from '../../utils/testInputStorage';

interface InputSchemaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: any; // JSON Schema
  workflowId: string;
  nodeId: string;
  nodeLabel?: string;
  initialData?: any; // Optional initial data to pre-fill
}

/**
 * Render a form field based on JSON Schema property
 */
function renderSchemaField(
  fieldName: string,
  fieldSchema: any,
  value: any,
  onChange: (value: any) => void,
  required: boolean,
  level: number = 0
): React.ReactNode {
  const indent = level * 16;
  const fieldType = fieldSchema.type || 'string';
  const description = fieldSchema.description || '';
  const placeholder = fieldSchema.placeholder || fieldSchema.example || '';

  // Handle nested objects
  if (fieldType === 'object' && fieldSchema.properties) {
    return (
      <div key={fieldName} className="space-y-3" style={{ marginLeft: `${indent}px` }}>
        <div className="flex items-center gap-2">
          <label className="block text-sm font-semibold text-gray-800">
            {fieldName}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
        {description && (
          <p className="text-xs text-gray-500 italic">{description}</p>
        )}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          {Object.entries(fieldSchema.properties).map(([nestedName, nestedSchema]: [string, any]) => {
            const nestedValue = value?.[nestedName];
            const nestedRequired = (fieldSchema.required || []).includes(nestedName);
            return (
              <div key={nestedName}>
                {renderSchemaField(
                  nestedName,
                  nestedSchema,
                  nestedValue,
                  (newValue) => {
                    onChange({ ...value, [nestedName]: newValue });
                  },
                  nestedRequired,
                  level + 1
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Handle arrays
  if (fieldType === 'array') {
    const arrayValue = Array.isArray(value) ? value : [];
    const itemSchema = fieldSchema.items || { type: 'string' };

    return (
      <div key={fieldName} className="space-y-2" style={{ marginLeft: `${indent}px` }}>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-gray-800">
            {fieldName}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <button
            type="button"
            onClick={() => {
              const defaultValue = itemSchema.type === 'object' ? {} : '';
              onChange([...arrayValue, defaultValue]);
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add Item
          </button>
        </div>
        {description && (
          <p className="text-xs text-gray-500 italic">{description}</p>
        )}
        <div className="space-y-2">
          {arrayValue.map((item: any, index: number) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                {itemSchema.type === 'object' ? (
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    {Object.entries(itemSchema.properties || {}).map(([itemName, itemProp]: [string, any]) => {
                      const itemValue = item?.[itemName];
                      return (
                        <div key={itemName} className="mb-2 last:mb-0">
                          {renderSchemaField(
                            itemName,
                            itemProp,
                            itemValue,
                            (newValue) => {
                              const newArray = [...arrayValue];
                              newArray[index] = { ...item, [itemName]: newValue };
                              onChange(newArray);
                            },
                            false,
                            level + 1
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  renderSchemaField(
                    `${fieldName}[${index}]`,
                    itemSchema,
                    item,
                    (newValue) => {
                      const newArray = [...arrayValue];
                      newArray[index] = newValue;
                      onChange(newArray);
                    },
                    false,
                    level
                  )
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const newArray = arrayValue.filter((_: any, i: number) => i !== index);
                  onChange(newArray);
                }}
                className="text-red-500 hover:text-red-700 p-1"
                title="Remove item"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {arrayValue.length === 0 && (
            <div className="text-xs text-gray-400 italic py-2">No items yet. Click "+ Add Item" to add one.</div>
          )}
        </div>
      </div>
    );
  }

  // Handle primitive types
  const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";

  switch (fieldType) {
    case 'string':
      if (fieldSchema.enum) {
        // Enum/Select field
        return (
          <div key={fieldName} className="space-y-1" style={{ marginLeft: `${indent}px` }}>
            <label className="block text-sm font-medium text-gray-700">
              {fieldName}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {description && (
              <p className="text-xs text-gray-500 italic">{description}</p>
            )}
            <select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className={baseClasses}
              required={required}
            >
              <option value="">-- Select --</option>
              {fieldSchema.enum.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      }

      // Textarea for long strings
      if (fieldSchema.format === 'textarea' || (fieldSchema.maxLength && fieldSchema.maxLength > 100)) {
        return (
          <div key={fieldName} className="space-y-1" style={{ marginLeft: `${indent}px` }}>
            <label className="block text-sm font-medium text-gray-700">
              {fieldName}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {description && (
              <p className="text-xs text-gray-500 italic">{description}</p>
            )}
            <textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`${baseClasses} font-mono`}
              rows={4}
              required={required}
            />
          </div>
        );
      }

      // Regular text input
      return (
        <div key={fieldName} className="space-y-1" style={{ marginLeft: `${indent}px` }}>
          <label className="block text-sm font-medium text-gray-700">
            {fieldName}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {description && (
            <p className="text-xs text-gray-500 italic">{description}</p>
          )}
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={baseClasses}
            required={required}
          />
        </div>
      );

    case 'number':
    case 'integer':
      return (
        <div key={fieldName} className="space-y-1" style={{ marginLeft: `${indent}px` }}>
          <label className="block text-sm font-medium text-gray-700">
            {fieldName}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {description && (
            <p className="text-xs text-gray-500 italic">{description}</p>
          )}
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => {
              const numValue = e.target.value === '' ? null : Number(e.target.value);
              onChange(numValue);
            }}
            placeholder={placeholder || '0'}
            min={fieldSchema.minimum}
            max={fieldSchema.maximum}
            step={fieldType === 'integer' ? 1 : fieldSchema.multipleOf || 'any'}
            className={baseClasses}
            required={required}
          />
        </div>
      );

    case 'boolean':
      return (
        <div key={fieldName} className="space-y-1" style={{ marginLeft: `${indent}px` }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {fieldName}
              {required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
          {description && (
            <p className="text-xs text-gray-500 italic ml-6">{description}</p>
          )}
        </div>
      );

    default:
      // Fallback: JSON textarea for unknown types
      return (
        <div key={fieldName} className="space-y-1" style={{ marginLeft: `${indent}px` }}>
          <label className="block text-sm font-medium text-gray-700">
            {fieldName}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {description && (
            <p className="text-xs text-gray-500 italic">{description}</p>
          )}
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value || null, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(parsed);
              } catch {
                onChange(e.target.value);
              }
            }}
            placeholder="Enter JSON value"
            className={`${baseClasses} font-mono`}
            rows={3}
            required={required}
          />
        </div>
      );
  }
}

export function InputSchemaFormModal({
  isOpen,
  onClose,
  schema,
  workflowId,
  nodeId,
  nodeLabel,
  initialData,
}: InputSchemaFormModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasStoredData, setHasStoredData] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');
  const isInitialMount = useRef(true);
  const isUpdatingFromRawJson = useRef(false);

  // Generate default values from schema
  const generateDefaultsFromSchema = useCallback((schemaToUse: any): any => {
    if (!schemaToUse || !schemaToUse.properties) {
      return {};
    }

    const defaults: any = {};
    Object.entries(schemaToUse.properties).forEach(([name, prop]: [string, any]) => {
      switch (prop.type) {
        case 'string':
          defaults[name] = prop.example || prop.default || '';
          break;
        case 'number':
        case 'integer':
          defaults[name] = prop.example ?? prop.default ?? (prop.minimum ?? 0);
          break;
        case 'boolean':
          defaults[name] = prop.example ?? prop.default ?? false;
          break;
        case 'array':
          defaults[name] = prop.example || prop.default || [];
          break;
        case 'object':
          if (prop.properties) {
            defaults[name] = generateDefaultsFromSchema(prop);
          } else {
            defaults[name] = prop.example || prop.default || {};
          }
          break;
        default:
          defaults[name] = prop.example || prop.default || null;
      }
    });
    return defaults;
  }, []);

  // Validate form data against schema
  const validateFormData = useCallback((data: any): string[] => {
    const errors: string[] = [];
    if (!schema || !schema.properties) {
      return errors;
    }

    const required = schema.required || [];
    Object.entries(schema.properties).forEach(([name, prop]: [string, any]) => {
      if (required.includes(name)) {
        if (data[name] === undefined || data[name] === null || data[name] === '') {
          errors.push(`${name} is required`);
        }
      }

      // Type-specific validation
      if (data[name] !== undefined && data[name] !== null && data[name] !== '') {
        const value = data[name];
        if (prop.type === 'string' && typeof value !== 'string') {
          errors.push(`${name} must be a string`);
        } else if (prop.type === 'number' && typeof value !== 'number') {
          errors.push(`${name} must be a number`);
        } else if (prop.type === 'integer' && (!Number.isInteger(value) || typeof value !== 'number')) {
          errors.push(`${name} must be an integer`);
        } else if (prop.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${name} must be a boolean`);
        } else if (prop.type === 'array' && !Array.isArray(value)) {
          errors.push(`${name} must be an array`);
        } else if (prop.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
          errors.push(`${name} must be an object`);
        }

        // Enum validation
        if (prop.enum && !prop.enum.includes(value)) {
          errors.push(`${name} must be one of: ${prop.enum.join(', ')}`);
        }

        // Min/Max validation
        if (prop.type === 'string') {
          if (prop.minLength && value.length < prop.minLength) {
            errors.push(`${name} must be at least ${prop.minLength} characters`);
          }
          if (prop.maxLength && value.length > prop.maxLength) {
            errors.push(`${name} must be at most ${prop.maxLength} characters`);
          }
        } else if (prop.type === 'number' || prop.type === 'integer') {
          if (prop.minimum !== undefined && value < prop.minimum) {
            errors.push(`${name} must be at least ${prop.minimum}`);
          }
          if (prop.maximum !== undefined && value > prop.maximum) {
            errors.push(`${name} must be at most ${prop.maximum}`);
          }
        }
      }
    });

    return errors;
  }, [schema]);

  // Load stored data on mount
  useEffect(() => {
    if (isOpen && schema && isInitialMount.current) {
      isInitialMount.current = false;
      // Try to load from storage first
      const stored = testInputStorage.load(workflowId, nodeId);
      if (stored) {
        setFormData(stored);
        setHasStoredData(true);
        setRawJsonText(JSON.stringify(stored, null, 2));
        // Validate loaded data
        const errors = validateFormData(stored);
        if (errors.length > 0) {
          setValidationErrors(errors);
        } else {
          setValidationErrors([]);
        }
      } else if (initialData) {
        setFormData(initialData);
        setRawJsonText(JSON.stringify(initialData, null, 2));
        // Validate initial data
        const errors = validateFormData(initialData);
        if (errors.length > 0) {
          setValidationErrors(errors);
        } else {
          setValidationErrors([]);
        }
      } else {
        // Generate default values from schema
        const defaults = generateDefaultsFromSchema(schema);
        setFormData(defaults);
        setRawJsonText(JSON.stringify(defaults, null, 2));
        // Validate defaults
        const errors = validateFormData(defaults);
        if (errors.length > 0) {
          setValidationErrors(errors);
        } else {
          setValidationErrors([]);
        }
      }
    }
    // Reset initial mount flag when modal closes
    if (!isOpen) {
      isInitialMount.current = true;
    }
  }, [isOpen, schema, workflowId, nodeId, initialData, validateFormData, generateDefaultsFromSchema]);

  // Handle clear stored data
  const handleClear = () => {
    testInputStorage.clear(workflowId, nodeId);
    setHasStoredData(false);
    const defaults = generateDefaultsFromSchema(schema);
    setFormData(defaults);
    setRawJsonText(JSON.stringify(defaults, null, 2));
  };

  // Auto-save when form data changes (with debounce)
  useEffect(() => {
    if (!isOpen || !schema || !workflowId || !nodeId) {
      return;
    }

    // Skip if this is the initial mount or if we're updating from raw JSON
    if (isInitialMount.current || isUpdatingFromRawJson.current) {
      return;
    }

    // Don't auto-save if formData is empty (initial state)
    if (Object.keys(formData).length === 0) {
      return;
    }

    // Validate and show errors, but don't prevent saving
    const errors = validateFormData(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }

    // Always save, even if there are validation errors (user can fix them later)
    // Debounce auto-save
    const timeoutId = setTimeout(() => {
      try {
        testInputStorage.save(workflowId, nodeId, formData);
        setHasStoredData(true);
        console.log('[InputSchemaFormModal] Auto-saved test input data');
      } catch (error) {
        console.error('[InputSchemaFormModal] Failed to auto-save:', error);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData, isOpen, schema, workflowId, nodeId, validateFormData]);

  // Auto-save when raw JSON changes (with debounce)
  useEffect(() => {
    if (!isOpen || !schema || !workflowId || !nodeId || !showRawJson) {
      return;
    }

    // Skip if this is the initial mount
    if (isInitialMount.current) {
      return;
    }

    // Debounce auto-save for raw JSON
    const timeoutId = setTimeout(() => {
      try {
        const parsed = JSON.parse(rawJsonText);
        
        // Validate and show errors, but don't prevent saving
        const errors = validateFormData(parsed);
        if (errors.length > 0) {
          setValidationErrors(errors);
        } else {
          setValidationErrors([]);
        }
        
        // Always save, even if there are validation errors
        // Set flag to prevent formData useEffect from triggering
        isUpdatingFromRawJson.current = true;
        testInputStorage.save(workflowId, nodeId, parsed);
        setHasStoredData(true);
        setFormData(parsed);
        console.log('[InputSchemaFormModal] Auto-saved test input data from raw JSON');
        // Reset flag after a short delay
        setTimeout(() => {
          isUpdatingFromRawJson.current = false;
        }, 100);
      } catch {
        // Invalid JSON, don't save
        setValidationErrors(['Invalid JSON format']);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [rawJsonText, showRawJson, isOpen, schema, workflowId, nodeId, validateFormData]);

  // Sync raw JSON when form data changes (but not when updating from raw JSON)
  useEffect(() => {
    // Only sync if we're in form view mode (not raw JSON mode)
    // and we're not currently updating from raw JSON
    if (showRawJson || isUpdatingFromRawJson.current || isInitialMount.current) {
      return;
    }
    setRawJsonText(JSON.stringify(formData, null, 2));
  }, [formData, showRawJson]);

  // Sync form data when raw JSON changes (if valid)
  const handleRawJsonChange = (text: string) => {
    setRawJsonText(text);
    try {
      const parsed = JSON.parse(text);
      isUpdatingFromRawJson.current = true;
      setFormData(parsed);
      setTimeout(() => {
        isUpdatingFromRawJson.current = false;
      }, 100);
    } catch {
      // Invalid JSON, but keep the text for editing
    }
  };

  if (!isOpen) return null;

  const requiredFields = schema?.required || [];
  const hasProperties = schema?.properties && Object.keys(schema.properties).length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Test Input: {nodeLabel || 'Start Node'}
              </h2>
              <p className="text-sm text-blue-100 mt-1">
                {schema?.properties ? 'Enter test data based on the input schema' : 'Configure test input for workflow execution'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!hasProperties ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Input Schema</h3>
              <p className="text-sm text-gray-500">
                {nodeLabel && nodeLabel !== 'Start Node' 
                  ? `The start node doesn't have an input schema defined. You can test the workflow without input data.`
                  : `This node doesn't have an input schema defined. You can test it without input data.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Toggle: Form vs Raw JSON */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  {hasStoredData && (
                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" />
                      <span>Saved</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                      showRawJson
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {showRawJson ? '📝 Form View' : '📄 Raw JSON'}
                  </button>
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <h4 className="text-sm font-semibold text-red-800">Validation Errors</h4>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form or Raw JSON */}
              {showRawJson ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    JSON Input
                  </label>
                  <textarea
                    value={rawJsonText}
                    onChange={(e) => handleRawJsonChange(e.target.value)}
                    className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Enter JSON data..."
                  />
                  <p className="text-xs text-gray-500">
                    💡 Tip: Use Form View for easier editing, or Raw JSON for complex nested structures
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(schema.properties).map(([fieldName, fieldSchema]: [string, any]) => {
                    const isRequired = requiredFields.includes(fieldName);
                    const fieldValue = formData[fieldName];

                    return (
                      <div key={fieldName}>
                        {renderSchemaField(
                          fieldName,
                          fieldSchema,
                          fieldValue,
                          (newValue) => {
                            setFormData({ ...formData, [fieldName]: newValue });
                          },
                          isRequired
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasStoredData && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                <CheckCircle className="w-3 h-3" />
                <span>Auto-saved</span>
              </div>
            )}
            {hasStoredData && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Saved
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

