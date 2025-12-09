/**
 * TransformNodeConfigForm Component
 * 
 * Configuration form for Transform nodes.
 */

import { useState, useEffect } from 'react';
import { ExpressionEditor } from '../ExpressionEditor';

interface TransformNodeConfigFormProps {
  config: any;
  onConfigChange: (config: any) => void;
  nodes?: any[];
  edges?: any[];
  currentNodeId?: string;
}

export function TransformNodeConfigForm({
  config,
  onConfigChange,
  nodes = [],
  edges = [],
  currentNodeId,
}: TransformNodeConfigFormProps) {
  const [transformMode, setTransformMode] = useState<string>(config.transformMode || 'extract_path');
  const [extractPath, setExtractPath] = useState<string>(config.extractPath || 'data');
  const [customExpression, setCustomExpression] = useState<string>(config.customExpression || '');

  useEffect(() => {
    onConfigChange({
      transformMode,
      extractPath,
      customExpression,
    });
  }, [transformMode, extractPath, customExpression, onConfigChange]);

  return (
    <div className="space-y-4">
      {/* Transform Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transformation Mode
        </label>
        <select
          value={transformMode}
          onChange={(e) => setTransformMode(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="full">📦 Pass Full NodeData (Standard)</option>
          <option value="extract_path">🔍 Extract Path (e.g., "data")</option>
          <option value="extract_data">📄 Extract Data Field Only</option>
          <option value="custom">⚙️ Custom Expression</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Choose how to transform the input data before passing it to the next node
        </p>
      </div>

      {/* Extract Path Input */}
      {transformMode === 'extract_path' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Extract Path
          </label>
          <input
            type="text"
            value={extractPath}
            onChange={(e) => setExtractPath(e.target.value)}
            placeholder="data"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Path to extract from NodeData (e.g., "data", "data.field", "data[0]")
          </p>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            <strong>Examples:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li><code className="bg-blue-100 px-1 rounded">data</code> - Extract the data field</li>
              <li><code className="bg-blue-100 px-1 rounded">data.message</code> - Extract nested field</li>
              <li><code className="bg-blue-100 px-1 rounded">data.items[0]</code> - Extract first array item</li>
            </ul>
          </div>
        </div>
      )}

      {/* Custom Expression Input - Build New Object */}
      {transformMode === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Build New Object
          </label>
          <ExpressionEditor
            value={customExpression}
            onChange={(value) => setCustomExpression(value)}
            placeholder='{"message": "{{steps.agent.data}}", "timestamp": "{{steps.start.data.timestamp}}"}'
            nodes={nodes}
            edges={edges}
            currentNodeId={currentNodeId || ''}
            multiline={true}
            rows={8}
          />
          <p className="text-xs text-gray-500 mt-1">
            Build a new object using expressions from multiple nodes
          </p>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            <strong>💡 Examples:</strong>
            <div className="mt-2 space-y-2 font-mono text-[11px]">
              <div>
                <strong>Simple object:</strong>
                <pre className="mt-1 bg-blue-100 p-2 rounded overflow-x-auto">
{`{
  "message": "{{steps.agent.data}}",
  "status": "success"
}`}
                </pre>
              </div>
              <div>
                <strong>Combine multiple nodes:</strong>
                <pre className="mt-1 bg-blue-100 p-2 rounded overflow-x-auto">
{`{
  "user": "{{steps.start.data.user}}",
  "response": "{{steps.agent.data}}",
  "timestamp": "{{steps.start.data.timestamp}}"
}`}
                </pre>
              </div>
              <div>
                <strong>Nested objects:</strong>
                <pre className="mt-1 bg-blue-100 p-2 rounded overflow-x-auto">
{`{
  "data": {
    "content": "{{steps.agent.data}}",
    "metadata": {
      "source": "{{steps.start.data.source}}"
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-blue-600">ℹ️</span>
          <div className="text-xs text-gray-700">
            <strong>How it works:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li><strong>Full NodeData:</strong> Passes the complete NodeData object (default behavior)</li>
              <li><strong>Extract Path:</strong> Extracts a specific field from the NodeData</li>
              <li><strong>Extract Data:</strong> Extracts only the data field (removes metadata)</li>
              <li><strong>Custom Expression:</strong> Build a new object from multiple nodes using JSON with expressions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

