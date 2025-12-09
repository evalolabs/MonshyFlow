/**
 * Schema Visualization Component
 * 
 * Displays JSON Schema in a user-friendly format
 * Shows structure, types, descriptions, and required fields
 */

import React from 'react';
import type { JsonSchema } from './nodeRegistry/nodeMetadata';
import { extractFieldPaths } from './utils/schemaHelpers';

interface SchemaVisualizationProps {
  schema: JsonSchema | undefined;
  title?: string;
  showEmpty?: boolean;
  className?: string;
}

export const SchemaVisualization: React.FC<SchemaVisualizationProps> = ({
  schema,
  title = 'Schema',
  showEmpty = true,
  className = '',
}) => {
  if (!schema) {
    if (!showEmpty) return null;
    return (
      <div className={`text-sm text-gray-500 italic ${className}`}>
        No schema defined
      </div>
    );
  }

  const fieldPaths = extractFieldPaths(schema);

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
        <span className="text-xs text-gray-500">
          {fieldPaths.length} {fieldPaths.length === 1 ? 'field' : 'fields'}
        </span>
      </div>

      {schema.description && (
        <p className="text-xs text-gray-600 mb-3 italic">{schema.description}</p>
      )}

      <div className="space-y-2">
        {schema.type && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-gray-700">Type:</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-mono">
              {schema.type}
            </span>
          </div>
        )}

        {schema.properties && Object.keys(schema.properties).length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">Properties:</div>
            <div className="space-y-1.5">
              {Object.entries(schema.properties).map(([key, value]: [string, any]) => {
                const isRequired = schema.required?.includes(key);
                const fieldType = value.type || 'any';
                const fieldDescription = value.description || '';

                return (
                  <div
                    key={key}
                    className="flex items-start gap-2 p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-semibold text-gray-800">
                          {key}
                        </span>
                        {isRequired && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 rounded font-semibold">
                            required
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded font-mono">
                          {fieldType}
                        </span>
                      </div>
                      {fieldDescription && (
                        <p className="text-xs text-gray-500 italic">{fieldDescription}</p>
                      )}
                      {value.enum && (
                        <div className="mt-1 text-xs text-gray-600">
                          <span className="font-medium">Allowed values:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {value.enum.map((val: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded font-mono text-[10px]"
                              >
                                {String(val)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {schema.required && schema.required.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-1">
              Required Fields ({schema.required.length}):
            </div>
            <div className="flex flex-wrap gap-1">
              {schema.required.map((field: string) => (
                <span
                  key={field}
                  className="px-2 py-0.5 text-xs bg-red-50 text-red-700 rounded border border-red-200"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}

        {schema.additionalProperties !== undefined && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Additional Properties:</span>{' '}
              {schema.additionalProperties ? 'Allowed' : 'Not allowed'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

