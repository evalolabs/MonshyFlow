import React from 'react';
import type { Node, Edge } from '@xyflow/react';

interface VariableBuilderProps {
  nodes: Node[];
  edges: Edge[];
  currentNodeId: string;
  onInsertVariable: (variable: string) => void;
}

interface VariableCategory {
  title: string;
  icon: string;
  variables: Variable[];
}

interface Variable {
  name: string;
  path: string;
  description: string;
  example?: string;
}

export const VariableBuilder: React.FC<VariableBuilderProps> = ({
  nodes,
  edges,
  currentNodeId,
  onInsertVariable,
}) => {
  // Get previous nodes (nodes that connect TO the current node)
  const previousNodeIds = edges
    .filter(edge => edge.target === currentNodeId)
    .map(edge => edge.source);

  const previousNodes = nodes.filter(node => previousNodeIds.includes(node.id));

  // Define available variables
  const categories: VariableCategory[] = [
    {
      title: 'Webhook Input',
      icon: '📥',
      variables: [
        {
          name: 'Request Body',
          path: 'input.body',
          description: 'Full request body object',
          example: '{"question": "What is AI?"}',
        },
        {
          name: 'Body Field',
          path: 'input.body.question',
          description: 'Specific field from body',
          example: 'What is AI?',
        },
        {
          name: 'Body Message',
          path: 'input.body.message',
          description: 'Message field from body',
          example: 'Hello, world!',
        },
        {
          name: 'Headers',
          path: 'input.headers',
          description: 'Request headers',
          example: '{"Content-Type": "application/json"}',
        },
        {
          name: 'Query Params',
          path: 'input.query',
          description: 'URL query parameters',
          example: '{"page": "1", "limit": "10"}',
        },
        {
          name: 'HTTP Method',
          path: 'input.method',
          description: 'HTTP request method',
          example: 'POST',
        },
      ],
    },
    {
      title: 'Previous Nodes',
      icon: '🔗',
      variables: previousNodes.map(node => ({
        name: `${node.data?.label || node.type} Output`,
        path: `node_${node.id}_output`,
        description: `Output from ${node.data?.label || node.type} node`,
        example: 'Full node output object',
      })),
    },
    {
      title: 'Common Patterns',
      icon: '⚡',
      variables: [
        {
          name: 'LLM Response',
          path: 'llm_response',
          description: 'Last LLM response text',
          example: 'The capital of France is Paris.',
        },
        {
          name: 'User Question',
          path: 'input.body.question',
          description: 'User question from webhook',
          example: 'What is the capital of France?',
        },
        {
          name: 'User Message',
          path: 'input.body.message',
          description: 'User message from webhook',
          example: 'Hello from user!',
        },
      ],
    },
  ];

  const handleInsert = (variablePath: string) => {
    onInsertVariable(`{{${variablePath}}}`);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">📝 Available Variables</h3>
        <span className="text-xs text-gray-500">Click to insert</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {categories.map((category, idx) => (
          <div key={idx} className="space-y-2">
            <h4 className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <span>{category.icon}</span>
              <span>{category.title}</span>
              <span className="text-gray-400">({category.variables.length})</span>
            </h4>

            {category.variables.length === 0 && (
              <p className="text-xs text-gray-400 italic pl-4">
                No previous nodes yet
              </p>
            )}

            <div className="space-y-1">
              {category.variables.map((variable, varIdx) => (
                <button
                  key={varIdx}
                  onClick={() => handleInsert(variable.path)}
                  className="w-full text-left p-2 rounded hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all group"
                  title={variable.description}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
                        {variable.name}
                      </div>
                      <div className="text-xs font-mono text-blue-600 truncate">
                        {`{{${variable.path}}}`}
                      </div>
                      {variable.description && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {variable.description}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 group-hover:text-blue-500">
                      ➕
                    </div>
                  </div>
                  {variable.example && (
                    <div className="text-xs text-gray-400 mt-1 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                      Ex: {variable.example}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">💡 Tips:</p>
          <ul className="list-disc list-inside space-y-0.5 pl-2">
            <li>Click any variable to insert it</li>
            <li>Type <code className="bg-gray-200 px-1 rounded">{'{{'}</code> for auto-complete</li>
            <li>Use dot notation: <code className="bg-gray-200 px-1 rounded">input.body.field</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

