/**
 * Schema Builder Component
 * 
 * User-friendly visual builder for creating JSON Schema definitions.
 * Allows users to define the expected structure of input data.
 * Supports both visual builder and JSON editor modes.
 */

import { useState, useEffect } from 'react';
import { getTemplatesByCategory, getCategories, type SchemaTemplate } from '../../../utils/schemaTemplates';

export interface SchemaField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
  // For string type
  minLength?: number;
  maxLength?: number;
  // For number type
  minimum?: number;
  maximum?: number;
  // For array type
  itemsType?: 'string' | 'number' | 'boolean' | 'object';
  // For nested objects (when type is 'object' or itemsType is 'object')
  nestedFields?: SchemaField[];
}

// Component for editing nested fields (recursive)
interface NestedFieldsEditorProps {
  fields: SchemaField[];
  onFieldsChange: (fields: SchemaField[]) => void;
  level: number;
}

function NestedFieldsEditor({ fields, onFieldsChange, level }: NestedFieldsEditorProps) {
  const addNestedField = () => {
    const newField: SchemaField = {
      id: `nested-field-${Date.now()}`,
      name: '',
      type: 'string',
      required: false,
    };
    onFieldsChange([...fields, newField]);
  };

  const removeNestedField = (id: string) => {
    onFieldsChange(fields.filter(f => f.id !== id));
  };

  const updateNestedField = (id: string, updates: Partial<SchemaField>) => {
    onFieldsChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return '📝';
      case 'number': return '🔢';
      case 'boolean': return '✓';
      case 'array': return '📋';
      case 'object': return '📦';
      default: return '📄';
    }
  };

  return (
    <div className={`border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 shadow-sm ${level > 0 ? 'ml-4 border-l-4 border-l-indigo-300' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center">
            <span className="text-sm">📦</span>
          </div>
          <span className="text-sm font-semibold text-gray-700">Nested Properties</span>
        </div>
        <button
          type="button"
          onClick={addNestedField}
          className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg hover:from-indigo-700 hover:to-indigo-800 shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Property
        </button>
      </div>
      {fields.length === 0 ? (
        <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg bg-white/50">
          <p className="text-xs text-gray-400">No nested properties defined</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((nestedField) => (
            <div key={nestedField.id} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  {getTypeIcon(nestedField.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={nestedField.name}
                      onChange={(e) => updateNestedField(nestedField.id, { name: e.target.value })}
                      placeholder="Property name"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all"
                    />
                    <select
                      value={nestedField.type}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        updateNestedField(nestedField.id, { 
                          type: newType,
                          nestedFields: newType === 'object' ? (nestedField.nestedFields || []) : undefined
                        });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all"
                    >
                      <option value="string">📝 Text</option>
                      <option value="number">🔢 Number</option>
                      <option value="boolean">✓ Yes/No</option>
                      <option value="array">📋 List</option>
                      <option value="object">📦 Object</option>
                    </select>
                  </div>
                  {nestedField.type === 'array' && (
                    <div>
                      <select
                        value={nestedField.itemsType || 'string'}
                        onChange={(e) => {
                          const newItemsType = e.target.value as any;
                          updateNestedField(nestedField.id, { 
                            itemsType: newItemsType,
                            nestedFields: newItemsType === 'object' ? (nestedField.nestedFields || []) : undefined
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all"
                      >
                        <option value="string">📝 Text</option>
                        <option value="number">🔢 Number</option>
                        <option value="boolean">✓ Yes/No</option>
                        <option value="object">📦 Object</option>
                      </select>
                      {nestedField.itemsType === 'object' && (
                        <div className="mt-2">
                          <NestedFieldsEditor
                            fields={nestedField.nestedFields || []}
                            onFieldsChange={(nestedFields) => updateNestedField(nestedField.id, { nestedFields })}
                            level={level + 1}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {nestedField.type === 'object' && (
                    <div className="mt-2">
                      <NestedFieldsEditor
                        fields={nestedField.nestedFields || []}
                        onFieldsChange={(nestedFields) => updateNestedField(nestedField.id, { nestedFields })}
                        level={level + 1}
                      />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeNestedField(nestedField.id)}
                  className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-all duration-200 flex-shrink-0"
                  title="Remove property"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SchemaBuilderProps {
  schema: any; // JSON Schema
  onChange: (schema: any) => void;
  schemaType?: 'input' | 'output'; // For templates and registry integration
  nodeType?: string; // For registry schema integration
}

export function SchemaBuilder({ schema, onChange, schemaType = 'input' }: SchemaBuilderProps) {
  const [mode, setMode] = useState<'visual' | 'json' | 'templates' | 'example'>('visual');
  const [jsonSchemaText, setJsonSchemaText] = useState('');
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null);
  const [exampleData, setExampleData] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  // Helper function to parse schema to fields (recursive)
  const parseSchemaToFields = (schemaToParse: any, requiredList: string[] = []): SchemaField[] => {
    if (!schemaToParse || !schemaToParse.properties) {
      return [];
    }
    
    return Object.entries(schemaToParse.properties).map(([name, prop]: [string, any], index) => {
      const field: SchemaField = {
        id: `field-${Date.now()}-${index}`,
        name,
        type: prop.type || 'string',
        required: requiredList.includes(name),
        description: prop.description,
        minLength: prop.minLength,
        maxLength: prop.maxLength,
        minimum: prop.minimum,
        maximum: prop.maximum,
        itemsType: prop.items?.type || 'string',
      };

      // Handle nested objects
      if (prop.type === 'object' && prop.properties) {
        field.nestedFields = parseSchemaToFields(prop, prop.required || []);
      }
      // Handle array of objects
      else if (prop.type === 'array' && prop.items?.type === 'object' && prop.items?.properties) {
        field.itemsType = 'object';
        field.nestedFields = parseSchemaToFields(prop.items, prop.items.required || []);
      }

      return field;
    });
  };

  const [fields, setFields] = useState<SchemaField[]>(() => {
    // Parse existing schema to fields
    if (!schema || !schema.properties) {
      return [];
    }
    
    const required = schema.required || [];
    return parseSchemaToFields(schema, required);
  });

  const addField = () => {
    const newField: SchemaField = {
      id: `field-${Date.now()}`,
      name: '',
      type: 'string',
      required: false,
    };
    setFields([...fields, newField]);
  };

  // Note: removeField and updateField are defined but not currently used
  // They may be needed for future features like inline field editing
  // const removeField = (id: string) => {
  //   setFields(fields.filter(f => f.id !== id));
  // };

  // const updateField = (id: string, updates: Partial<SchemaField>) => {
  //   setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  // };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedFieldId(fieldId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fieldId);
  };

  const handleDragOver = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedFieldId && draggedFieldId !== fieldId) {
      setDragOverFieldId(fieldId);
    }
  };

  const handleDragLeave = () => {
    setDragOverFieldId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    setDragOverFieldId(null);
    
    if (!draggedFieldId || draggedFieldId === targetFieldId) {
      setDraggedFieldId(null);
      return;
    }

    const draggedIndex = fields.findIndex(f => f.id === draggedFieldId);
    const targetIndex = fields.findIndex(f => f.id === targetFieldId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedFieldId(null);
      return;
    }

    const newFields = [...fields];
    const [removed] = newFields.splice(draggedIndex, 1);
    newFields.splice(targetIndex, 0, removed);

    handleFieldsChange(newFields);
    setDraggedFieldId(null);
  };

  const handleDragEnd = () => {
    setDraggedFieldId(null);
    setDragOverFieldId(null);
  };

  // Convert fields to JSON Schema (recursive)
  const buildSchema = (fieldsToBuild: SchemaField[]): any => {
    if (fieldsToBuild.length === 0) {
      return null; // No schema = accept anything
    }

    const properties: any = {};
    const required: string[] = [];

    fieldsToBuild.forEach(field => {
      if (!field.name || field.name.trim() === '') {
        return; // Skip empty fields
      }

      const prop: any = {
        type: field.type,
      };

      if (field.description) {
        prop.description = field.description;
      }

      // Type-specific properties
      if (field.type === 'string') {
        if (field.minLength !== undefined) {
          prop.minLength = field.minLength;
        }
        if (field.maxLength !== undefined) {
          prop.maxLength = field.maxLength;
        }
      } else if (field.type === 'number') {
        if (field.minimum !== undefined) {
          prop.minimum = field.minimum;
        }
        if (field.maximum !== undefined) {
          prop.maximum = field.maximum;
        }
      } else if (field.type === 'array') {
        if (field.itemsType === 'object' && field.nestedFields && field.nestedFields.length > 0) {
          // Array of objects with nested fields
          const nestedSchema = buildSchema(field.nestedFields);
          if (nestedSchema) {
            prop.items = nestedSchema;
          } else {
            prop.items = { type: 'object', additionalProperties: true };
          }
        } else {
          prop.items = {
            type: field.itemsType || 'string',
          };
        }
      } else if (field.type === 'object') {
        if (field.nestedFields && field.nestedFields.length > 0) {
          // Nested object with defined properties
          const nestedSchema = buildSchema(field.nestedFields);
          if (nestedSchema) {
            prop.properties = nestedSchema.properties;
            prop.required = nestedSchema.required;
            prop.additionalProperties = false;
          } else {
            prop.additionalProperties = true;
          }
        } else {
          prop.additionalProperties = true; // Allow any properties in empty object
        }
      }

      properties[field.name] = prop;

      if (field.required) {
        required.push(field.name);
      }
    });

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: false, // Only allow defined properties
    };
  };

  // Update schema when fields change
  const handleFieldsChange = (newFields: SchemaField[]) => {
    setFields(newFields);
    const newSchema = buildSchema(newFields);
    onChange(newSchema);
  };

  // Update field and rebuild schema
  const handleFieldUpdate = (id: string, updates: Partial<SchemaField>) => {
    const newFields = fields.map(f => f.id === id ? { ...f, ...updates } : f);
    handleFieldsChange(newFields);
  };

  // Generate schema from example JSON
  const generateSchemaFromExample = (data: any): any => {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return { type: 'object', properties: {} };
    }

    const properties: any = {};
    const required: string[] = [];

    Object.entries(data).forEach(([key, value]) => {
      required.push(key);
      properties[key] = inferTypeFromValue(value);
    });

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: false
    };
  };

  // Infer JSON Schema type from value
  const inferTypeFromValue = (value: any): any => {
    if (typeof value === 'string') {
      // Try to detect format
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return { type: 'string', format: 'date-time' };
      }
      if (value.includes('@') && value.includes('.')) {
        return { type: 'string', format: 'email' };
      }
      if (value.match(/^https?:\/\//)) {
        return { type: 'string', format: 'uri' };
      }
      return { type: 'string' };
    }
    if (typeof value === 'number') {
      return { type: 'number' };
    }
    if (typeof value === 'boolean') {
      return { type: 'boolean' };
    }
    if (Array.isArray(value)) {
      if (value.length > 0) {
        return {
          type: 'array',
          items: inferTypeFromValue(value[0])
        };
      }
      return { type: 'array', items: { type: 'string' } };
    }
    if (typeof value === 'object' && value !== null) {
      const nestedSchema = generateSchemaFromExample(value);
      return {
        type: 'object',
        properties: nestedSchema.properties,
        required: nestedSchema.required
      };
    }
    return { type: 'string' };
  };

  // Helper function to generate example JSON from schema
  const generateExampleFromSchema = (schemaToUse: any): any => {
    if (!schemaToUse || !schemaToUse.properties) {
      return {};
    }

    const example: any = {};
    Object.entries(schemaToUse.properties).forEach(([name, prop]: [string, any]) => {
      switch (prop.type) {
        case 'string':
          example[name] = '';
          break;
        case 'number':
          example[name] = null;
          break;
        case 'boolean':
          example[name] = false;
          break;
        case 'array':
          example[name] = [];
          break;
        case 'object':
          // For nested objects, generate nested example if properties exist
          if (prop.properties) {
            example[name] = generateExampleFromSchema(prop);
          } else {
            example[name] = {};
          }
          break;
        default:
          example[name] = null;
      }
    });
    return example;
  };

  // Helper function to generate example from fields (recursive)
  const generateExampleFromFields = (fieldsToUse: SchemaField[]): any => {
    const example: any = {};
    fieldsToUse.forEach(field => {
      if (!field.name) return;
      
      switch (field.type) {
        case 'string':
          example[field.name] = '';
          break;
        case 'number':
          example[field.name] = null;
          break;
        case 'boolean':
          example[field.name] = false;
          break;
        case 'array':
          if (field.itemsType === 'object' && field.nestedFields && field.nestedFields.length > 0) {
            // Array of objects - generate one example object
            example[field.name] = [generateExampleFromFields(field.nestedFields)];
          } else {
            example[field.name] = [];
          }
          break;
        case 'object':
          if (field.nestedFields && field.nestedFields.length > 0) {
            // Nested object with defined properties
            example[field.name] = generateExampleFromFields(field.nestedFields);
          } else {
            example[field.name] = {};
          }
          break;
      }
    });
    return example;
  };

  // Sync JSON text with schema
  useEffect(() => {
    if (schema) {
      setJsonSchemaText(JSON.stringify(schema, null, 2));
    } else {
      setJsonSchemaText('');
    }
  }, [schema]);

  // Handle JSON mode changes
  const handleJsonChange = (jsonText: string) => {
    setJsonSchemaText(jsonText);
    try {
      if (jsonText.trim() === '') {
        onChange(null);
        return;
      }
      const parsed = JSON.parse(jsonText);
      onChange(parsed);
    } catch (error) {
      // Invalid JSON - don't update schema yet
    }
  };

  const validateJson = () => {
    try {
      if (jsonSchemaText.trim() === '') {
        onChange(null);
        return true;
      }
      const parsed = JSON.parse(jsonSchemaText);
      onChange(parsed);
      return true;
    } catch (error: any) {
      alert(`Invalid JSON: ${error.message}`);
      return false;
    }
  };

  // Helper to get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return '📝';
      case 'number': return '🔢';
      case 'boolean': return '✓';
      case 'array': return '📋';
      case 'object': return '📦';
      default: return '📄';
    }
  };

  // Helper to get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'number': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'boolean': return 'bg-green-50 border-green-200 text-green-700';
      case 'array': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'object': return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Expected Input Structure</h4>
          <p className="text-sm text-gray-500 mt-0.5">
            Define what data your application should send to this workflow
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setMode('visual')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                mode === 'visual'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🎨 Visual
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('json');
                if (schema) {
                  setJsonSchemaText(JSON.stringify(schema, null, 2));
                }
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                mode === 'json'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {`</>`} JSON
            </button>
          </div>
          {mode === 'visual' && (
            <button
              type="button"
              onClick={addField}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Field
            </button>
          )}
        </div>
      </div>

      {/* Templates Mode */}
      {mode === 'templates' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-blue-900 mb-2">Choose a Template</h5>
            <p className="text-xs text-blue-700">
              Select a pre-configured schema template to get started quickly
            </p>
          </div>
          {getCategories().map(category => (
            <div key={category}>
              <h5 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                {category} Templates
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getTemplatesByCategory(category).map((template: SchemaTemplate) => {
                  const templateSchema = schemaType === 'input' ? template.inputSchema : template.outputSchema;
                  return (
                    <div
                      key={template.id}
                      onClick={() => {
                        onChange(templateSchema);
                        setSelectedTemplate(template.id);
                        setMode('visual'); // Switch to visual mode after selecting template
                      }}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {Object.keys(templateSchema?.properties || {}).length} properties
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* From Example Mode */}
      {mode === 'example' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-green-900 mb-2">Generate from Example</h5>
            <p className="text-xs text-green-700">
              Paste a JSON example and we'll automatically generate the schema for you
            </p>
          </div>
          <textarea
            value={exampleData}
            onChange={(e) => setExampleData(e.target.value)}
            placeholder={`{\n  "field1": "value1",\n  "field2": 123,\n  "field3": true\n}`}
            className="w-full h-64 font-mono text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            spellCheck={false}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">
              Enter a JSON example of the {schemaType === 'input' ? 'input' : 'output'} data
            </span>
            <button
              type="button"
              onClick={() => {
                try {
                  const data = JSON.parse(exampleData);
                  const generatedSchema = generateSchemaFromExample(data);
                  onChange(generatedSchema);
                  setMode('visual'); // Switch to visual mode after generation
                } catch (error: any) {
                  alert(`Invalid JSON: ${error.message}`);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Generate Schema
            </button>
          </div>
        </div>
      )}

      {/* JSON Editor Mode */}
      {mode === 'json' && (
        <div className="space-y-2">
          <div className="bg-white border border-gray-300 rounded-lg p-3">
            <textarea
              value={jsonSchemaText}
              onChange={(e) => handleJsonChange(e.target.value)}
              onBlur={validateJson}
              placeholder='{\n  "type": "object",\n  "properties": {\n    "userPrompt": {\n      "type": "string",\n      "description": "User message"\n    }\n  },\n  "required": ["userPrompt"]\n}'
              className="w-full h-64 font-mono text-sm border-0 focus:outline-none focus:ring-0 resize-none"
              spellCheck={false}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Enter JSON Schema directly (for advanced users)</span>
            <button
              type="button"
              onClick={validateJson}
              className="px-2 py-1 text-blue-600 hover:text-blue-800 font-medium"
            >
              Validate & Save
            </button>
          </div>
        </div>
      )}

      {/* Visual Builder Mode */}
      {mode === 'visual' && (
        <>
          {fields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-base font-medium text-gray-700 mb-1">No fields defined</p>
              <p className="text-sm text-gray-500 mb-4">
                Start by adding your first field to define the expected input structure
              </p>
              <button
                type="button"
                onClick={addField}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Field
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field) => {
                const isExpanded = expandedFields.has(field.id);
                const isEditingName = editingFields.has(field.id);
                
                return (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, field.id)}
                  onDragOver={(e) => handleDragOver(e, field.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, field.id)}
                  onDragEnd={handleDragEnd}
                  className={`group border rounded-lg bg-white shadow-sm hover:shadow transition-all duration-200 ${
                    draggedFieldId === field.id
                      ? 'opacity-50 border-blue-300'
                      : dragOverFieldId === field.id
                      ? 'border-blue-400 border-2 shadow-md'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Compact Field Row - Always Visible */}
                  <div className="px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    {/* Drag Handle */}
                    <div 
                      className="text-gray-300 hover:text-gray-400 cursor-move flex-shrink-0"
                      title="Drag to reorder"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>

                    {/* Type Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border-2 flex-shrink-0 ${getTypeColor(field.type)}`}>
                      {getTypeIcon(field.type)}
                    </div>

                    {/* Field Name - Inline Editable */}
                    <div className="flex-1 min-w-0">
                      {isEditingName ? (
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => handleFieldUpdate(field.id, { name: e.target.value })}
                          onBlur={() => {
                            const newSet = new Set(editingFields);
                            newSet.delete(field.id);
                            setEditingFields(newSet);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newSet = new Set(editingFields);
                              newSet.delete(field.id);
                              setEditingFields(newSet);
                            }
                          }}
                          autoFocus
                          className="w-full px-2 py-1 text-sm font-medium bg-white border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const newSet = new Set(editingFields);
                            newSet.add(field.id);
                            setEditingFields(newSet);
                          }}
                          className="w-full text-left px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {field.name || <span className="text-gray-400 italic">Click to name field...</span>}
                        </button>
                      )}
                    </div>

                    {/* Type Badge - Clickable */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const types: Array<'string' | 'number' | 'boolean' | 'array' | 'object'> = ['string', 'number', 'boolean', 'array', 'object'];
                          const currentIndex = types.indexOf(field.type);
                          const nextType = types[(currentIndex + 1) % types.length];
                          handleFieldUpdate(field.id, { type: nextType });
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all hover:shadow-sm ${getTypeColor(field.type)}`}
                        title="Click to change type"
                      >
                        {getTypeIcon(field.type)} {field.type}
                      </button>

                      {/* Required Toggle */}
                      <button
                        type="button"
                        onClick={() => handleFieldUpdate(field.id, { required: !field.required })}
                        className={`px-2 py-1 text-xs font-medium rounded-md border transition-all ${
                          field.required
                            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                        title={field.required ? 'Required' : 'Optional'}
                      >
                        {field.required ? '★' : '☆'}
                      </button>

                      {/* Expand/Collapse */}
                      <button
                        type="button"
                        onClick={() => {
                          const newSet = new Set(expandedFields);
                          if (isExpanded) {
                            newSet.delete(field.id);
                          } else {
                            newSet.add(field.id);
                          }
                          setExpandedFields(newSet);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
                        title={isExpanded ? 'Collapse' : 'Expand for options'}
                      >
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => {
                          const newFields = fields.filter(f => f.id !== field.id);
                          handleFieldsChange(newFields);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                        title="Remove field"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Options - Collapsible */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-2 border-t border-gray-100 bg-gray-50/50 space-y-3">

                    {/* Type-specific options */}
                    {field.type === 'string' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Min Length
                          </label>
                          <input
                            type="number"
                            value={field.minLength || ''}
                            onChange={(e) => handleFieldUpdate(field.id, { minLength: e.target.value ? parseInt(e.target.value) : undefined })}
                            placeholder="Optional"
                            min="0"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Max Length
                          </label>
                          <input
                            type="number"
                            value={field.maxLength || ''}
                            onChange={(e) => handleFieldUpdate(field.id, { maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                            placeholder="Optional"
                            min="0"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {field.type === 'number' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Minimum Value
                          </label>
                          <input
                            type="number"
                            value={field.minimum || ''}
                            onChange={(e) => handleFieldUpdate(field.id, { minimum: e.target.value ? parseFloat(e.target.value) : undefined })}
                            placeholder="Optional"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Maximum Value
                          </label>
                          <input
                            type="number"
                            value={field.maximum || ''}
                            onChange={(e) => handleFieldUpdate(field.id, { maximum: e.target.value ? parseFloat(e.target.value) : undefined })}
                            placeholder="Optional"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {field.type === 'array' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Array Item Type
                          </label>
                          <select
                            value={field.itemsType || 'string'}
                            onChange={(e) => {
                              const newItemsType = e.target.value as any;
                              handleFieldUpdate(field.id, { 
                                itemsType: newItemsType,
                                nestedFields: newItemsType === 'object' ? (field.nestedFields || []) : undefined
                              });
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                          >
                            <option value="string">📝 Text</option>
                            <option value="number">🔢 Number</option>
                            <option value="boolean">✓ Yes/No</option>
                            <option value="object">📦 Object</option>
                          </select>
                        </div>
                        {field.itemsType === 'object' && (
                          <NestedFieldsEditor
                            fields={field.nestedFields || []}
                            onFieldsChange={(nestedFields) => handleFieldUpdate(field.id, { nestedFields })}
                            level={1}
                          />
                        )}
                      </div>
                    )}

                    {field.type === 'object' && (
                      <div>
                        <NestedFieldsEditor
                          fields={field.nestedFields || []}
                          onFieldsChange={(nestedFields) => handleFieldUpdate(field.id, { nestedFields })}
                          level={1}
                        />
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        Description
                        <span className="text-gray-400 font-normal normal-case ml-1">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={field.description || ''}
                        onChange={(e) => handleFieldUpdate(field.id, { description: e.target.value })}
                        placeholder="Describe what this field is used for..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      />
                    </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Example Input Preview - Only show if schema is defined */}
      {(mode === 'visual' ? fields.length > 0 : schema) && (
        <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 border-2 border-blue-200 flex items-center justify-center">
                <span className="text-sm">💡</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900">Example Input</span>
                <p className="text-xs text-gray-600 mt-0.5">For your application</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const example = mode === 'visual' 
                  ? generateExampleFromFields(fields)
                  : generateExampleFromSchema(schema);
                
                navigator.clipboard.writeText(JSON.stringify(example, null, 2));
              }}
              className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          </div>
          <pre className="text-xs text-gray-800 overflow-x-auto bg-white p-4 rounded-lg border border-blue-200 shadow-inner font-mono leading-relaxed max-h-64 overflow-y-auto">
            {JSON.stringify(
              mode === 'visual' 
                ? generateExampleFromFields(fields)
                : generateExampleFromSchema(schema),
              null,
              2
            )}
          </pre>
          <p className="text-xs text-gray-600 mt-3 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            This is an example of the data structure your application should send to the webhook URL.
          </p>
        </div>
      )}
    </div>
  );
}

