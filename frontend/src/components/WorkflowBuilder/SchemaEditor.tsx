/**
 * Schema Editor Component
 * 
 * Allows editing JSON Schema for nodes
 * Provides a JSON editor with validation
 */

import React, { useState } from 'react';
import type { JsonSchema } from './nodeRegistry/nodeMetadata';

interface SchemaEditorProps {
  schema: JsonSchema | undefined;
  onChange: (schema: JsonSchema | undefined) => void;
  title?: string;
  placeholder?: string;
  className?: string;
}

export const SchemaEditor: React.FC<SchemaEditorProps> = ({
  schema,
  onChange,
  title = 'Edit Schema',
  placeholder = 'Enter JSON Schema...',
  className = '',
}) => {
  const [jsonText, setJsonText] = useState(() => {
    return schema ? JSON.stringify(schema, null, 2) : '';
  });
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleChange = (text: string) => {
    setJsonText(text);
    setError(null);

    if (!text.trim()) {
      onChange(undefined);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      onChange(parsed);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setError(null);
      onChange(parsed);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleValidate = () => {
    if (!jsonText.trim()) {
      setError('Schema is empty');
      return;
    }

    setIsValidating(true);
    try {
      const parsed = JSON.parse(jsonText);
      
      // Basic validation
      if (!parsed.type && !parsed.properties) {
        setError('Schema must have either "type" or "properties"');
        return;
      }

      setError(null);
      onChange(parsed);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    setJsonText('');
    setError(null);
    onChange(undefined);
  };

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFormat}
            className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="Format JSON"
          >
            Format
          </button>
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidating}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
            title="Validate Schema"
          >
            {isValidating ? 'Validating...' : 'Validate'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="Clear Schema"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="p-4">
        <textarea
          value={jsonText}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={15}
          className={`w-full px-3 py-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-300 focus:ring-red-500 bg-red-50'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />

        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {!error && jsonText.trim() && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
            ✓ Valid JSON Schema
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500">
          <p className="font-medium mb-1">Tips:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Use JSON Schema Draft 2020-12 format</li>
            <li>Define <code className="bg-gray-100 px-1 rounded">type</code>, <code className="bg-gray-100 px-1 rounded">properties</code>, and <code className="bg-gray-100 px-1 rounded">required</code> fields</li>
            <li>Add <code className="bg-gray-100 px-1 rounded">description</code> fields for better documentation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

