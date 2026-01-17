/**
 * CodeNodeConfigForm Component
 * 
 * Configuration form for Code nodes.
 * Allows users to write custom JavaScript code to transform data.
 */

import { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { VariableTreePopover } from '../VariableTreePopover';

interface CodeNodeConfigFormProps {
  config: any;
  onConfigChange: (config: any) => void;
  nodes?: any[];
  edges?: any[];
  currentNodeId?: string;
  debugSteps?: any[];
}

export function CodeNodeConfigForm({
  config,
  onConfigChange,
  nodes = [],
  edges = [],
  currentNodeId,
  debugSteps = [],
}: CodeNodeConfigFormProps) {
  const [code, setCode] = useState<string>(config.code || '');
  const [showVars, setShowVars] = useState(false);
  const editorViewRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousCodeRef = useRef<string>(config.code || '');

  // Sync code state with config prop when it changes externally
  useEffect(() => {
    if (config.code !== undefined && config.code !== previousCodeRef.current) {
      setCode(config.code);
      previousCodeRef.current = config.code;
    }
  }, [config.code]);

  // Only call onConfigChange when code actually changes (not on every render)
  useEffect(() => {
    if (code !== previousCodeRef.current) {
      previousCodeRef.current = code;
      onConfigChange({
        code,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]); // onConfigChange intentionally omitted to prevent infinite loop

  const insertAtCursor = (text: string) => {
    const view = editorViewRef.current;
    if (!view) {
      // Fallback: append to end if editor not ready
      setCode(code + text);
      return;
    }
    
    try {
      // Get current selection
      const { from, to } = view.state.selection.main;
      
      // Insert text at cursor position using CodeMirror transaction
      view.dispatch({
        changes: {
          from,
          to,
          insert: text,
        },
        selection: {
          anchor: from + text.length,
          head: from + text.length,
        },
      });
      
      // Update local state to match
      const newCode = code.slice(0, from) + text + code.slice(to);
      setCode(newCode);
    } catch (error) {
      // Fallback if view is not ready
      setCode(code + text);
    }
  };

  // Build preview context for variable tree
  const previewContext = (() => {
    const incoming = edges.find(e => e.target === currentNodeId);
    const prev = nodes.find(n => n.id === incoming?.source);
    return prev?.data || {};
  })();

  return (
    <div className="space-y-4">
      {/* Code Editor with Variable Tree Integration */}
      <div ref={containerRef}>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            JavaScript Code *
          </label>
          <button
            type="button"
            className="px-2 py-1.5 text-xs bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            onClick={() => setShowVars(!showVars)}
            title="Insert variables ({{ }})"
          >
            Variables
          </button>
        </div>
        <div className="relative border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
          <CodeMirror
            value={code}
            height="400px"
            theme="light"
            extensions={[javascript({ jsx: false, typescript: false })]}
            onChange={(value, viewUpdate) => {
              setCode(value);
              // Store view reference for variable insertion
              if (viewUpdate?.view) {
                editorViewRef.current = viewUpdate.view;
              }
            }}
            placeholder="// Write your JavaScript code here
// Access input data from previous nodes using variables
// Example: const data = {{steps.start.json}};

// Your code here
return data;"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              bracketMatching: true,
              foldGutter: true,
              dropCursor: false,
              allowMultipleSelections: false,
              indentOnInput: true,
              syntaxHighlighting: true,
              autocompletion: true,
              closeBrackets: true,
              closeBracketsKeymap: true,
              searchKeymap: true,
              foldKeymap: true,
            }}
            className="text-sm"
          />
        </div>
        {showVars && (
          <VariableTreePopover
            anchorEl={containerRef.current as any}
            nodes={nodes as any}
            edges={edges as any}
            currentNodeId={currentNodeId || ''}
            data={previewContext}
            debugSteps={debugSteps}
            onPick={(p) => insertAtCursor(`{{${p}}}`)}
            onClose={() => setShowVars(false)}
          />
        )}
        <p className="text-xs text-gray-500 mt-1">
          Write JavaScript code to process your data. Use the Variables button to insert data from previous nodes.
        </p>
      </div>

      {/* Help Section */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-blue-600">💡</span>
          <div className="text-xs text-gray-700">
            <strong>How it works:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Click "Variables" to insert data from previous nodes</li>
              <li>Write JavaScript code to process the data</li>
              <li>Use <code className="bg-blue-100 px-1 rounded">return</code> to output the result</li>
              <li>The output will be passed to the next node</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Examples Section */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-xs text-gray-700">
          <strong>Examples:</strong>
          <div className="mt-2 space-y-3">
            <div>
              <strong className="text-gray-800">Transform data:</strong>
              <pre className="mt-1 bg-gray-100 p-2 rounded overflow-x-auto text-[11px]">
{`const input = {{steps.start.json}};
return {
  processed: true,
  timestamp: new Date().toISOString(),
  data: input
};`}
              </pre>
            </div>
            <div>
              <strong className="text-gray-800">Filter and transform:</strong>
              <pre className="mt-1 bg-gray-100 p-2 rounded overflow-x-auto text-[11px]">
{`const items = {{steps.start.json.items}};
const filtered = items.filter(item => item.status === 'active');
return filtered.map(item => ({
  ...item,
  processed: true
}));`}
              </pre>
            </div>
            <div>
              <strong className="text-gray-800">Combine multiple nodes:</strong>
              <pre className="mt-1 bg-gray-100 p-2 rounded overflow-x-auto text-[11px]">
{`const userData = {{steps.start.json}};
const apiResponse = {{steps.http-request.json}};
return {
  user: userData,
  api: apiResponse,
  combined: true
};`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

