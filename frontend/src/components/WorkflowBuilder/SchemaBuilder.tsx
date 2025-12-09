import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getTemplatesByCategory, getTemplateById, getCategories } from '../../utils/schemaTemplates';

interface SchemaBuilderProps {
  initialSchema?: any;
  onSchemaChange: (schema: any) => void;
  onClose: () => void;
  type: 'input' | 'output';
}

interface SchemaProperty {
  name: string;
  type: string;
  required: boolean;
  description: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  format?: string;
  enum?: string[];
}

export function SchemaBuilder({ initialSchema, onSchemaChange, onClose, type }: SchemaBuilderProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'builder' | 'example'>('templates');
  const [properties, setProperties] = useState<SchemaProperty[]>([]);
  const [exampleData, setExampleData] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    if (initialSchema && initialSchema.properties) {
      const props = Object.entries(initialSchema.properties).map(([name, prop]: [string, any]) => ({
        name,
        type: prop.type || 'string',
        required: initialSchema.required?.includes(name) || false,
        description: prop.description || '',
        minLength: prop.minLength,
        maxLength: prop.maxLength,
        minimum: prop.minimum,
        maximum: prop.maximum,
        format: prop.format,
        enum: prop.enum
      }));
      setProperties(props);
    }
  }, [initialSchema]);

  const handleTemplateSelect = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      const schema = type === 'input' ? template.inputSchema : template.outputSchema;
      onSchemaChange(schema);
      setSelectedTemplate(templateId);
    }
  };

  const addProperty = () => {
    setProperties([...properties, {
      name: '',
      type: 'string',
      required: false,
      description: ''
    }]);
  };

  const updateProperty = (index: number, field: keyof SchemaProperty, value: any) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: value };
    setProperties(updated);
    generateSchema();
  };

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
    generateSchema();
  };

  const generateSchema = () => {
    const schema = {
      type: 'object',
      required: properties.filter(p => p.required).map(p => p.name),
      properties: properties.reduce((acc, prop) => {
        if (prop.name) {
          acc[prop.name] = {
            type: prop.type,
            description: prop.description,
            ...(prop.minLength !== undefined && { minLength: prop.minLength }),
            ...(prop.maxLength !== undefined && { maxLength: prop.maxLength }),
            ...(prop.minimum !== undefined && { minimum: prop.minimum }),
            ...(prop.maximum !== undefined && { maximum: prop.maximum }),
            ...(prop.format && { format: prop.format }),
            ...(prop.enum && prop.enum.length > 0 && { enum: prop.enum })
          };
        }
        return acc;
      }, {} as any)
    };
    onSchemaChange(schema);
  };

  const generateFromExample = () => {
    try {
      const data = JSON.parse(exampleData);
      const schema = generateSchemaFromExample(data);
      onSchemaChange(schema);
    } catch (error) {
      alert('Invalid JSON example');
    }
  };

  const generateSchemaFromExample = (data: any): any => {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      const properties: any = {};
      const required: string[] = [];

      Object.entries(data).forEach(([key, value]) => {
        required.push(key);
        properties[key] = inferType(value);
      });

      return {
        type: 'object',
        required,
        properties
      };
    }
    return { type: 'object', properties: {} };
  };

  const inferType = (value: any): any => {
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return { type: 'string', format: 'date-time' };
      }
      if (value.includes('@')) {
        return { type: 'string', format: 'email' };
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
      return { type: 'array', items: value.length > 0 ? inferType(value[0]) : { type: 'string' } };
    }
    if (typeof value === 'object' && value !== null) {
      return { type: 'object', properties: {} };
    }
    return { type: 'string' };
  };

  const categories = getCategories();

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{ 
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col"
        style={{ position: 'relative' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {type === 'input' ? 'Input' : 'Output'} Schema Builder
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'templates', label: '📋 Templates', icon: '📋' },
            { id: 'builder', label: '🔧 Builder', icon: '🔧' },
            { id: 'example', label: '💡 From Example', icon: '💡' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <h3 className="text-md font-semibold">Choose a Template</h3>
              {categories.map(category => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                    {category} Templates
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getTemplatesByCategory(category).map(template => (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateSelect(template.id)}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                          selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'builder' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold">Build Schema</h3>
                <button
                  onClick={addProperty}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  + Add Property
                </button>
              </div>

              <div className="space-y-3">
                {properties.map((prop, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                      <input
                        type="text"
                        placeholder="Property name"
                        value={prop.name}
                        onChange={(e) => updateProperty(index, 'name', e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <select
                        value={prop.type}
                        onChange={(e) => updateProperty(index, 'type', e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Description"
                        value={prop.description}
                        onChange={(e) => updateProperty(index, 'description', e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={prop.required}
                          onChange={(e) => updateProperty(index, 'required', e.target.checked)}
                          className="mr-1"
                        />
                        Required
                      </label>
                      <button
                        onClick={() => removeProperty(index)}
                        className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'example' && (
            <div className="space-y-4">
              <h3 className="text-md font-semibold">Generate from Example</h3>
              <p className="text-sm text-gray-600">
                Paste a JSON example and we'll generate the schema automatically
              </p>
              <textarea
                value={exampleData}
                onChange={(e) => setExampleData(e.target.value)}
                placeholder='{"id": "user123", "prompt": "Hello AI"}'
                className="w-full h-40 px-3 py-2 border rounded font-mono text-sm"
              />
              <button
                onClick={generateFromExample}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Generate Schema
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply Schema
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
