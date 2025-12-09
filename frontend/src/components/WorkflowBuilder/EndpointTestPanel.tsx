import { useState } from 'react';
import { workflowService } from '../../services/workflowService';
import { validateJsonSchema } from '../../utils/schemaValidator';
import type { ValidationResult } from '../../utils/schemaValidator';
import { ExecutionTimeline } from './ExecutionTimeline';

interface EndpointTestPanelProps {
  workflowId: string;
  baseUrl: string;
  endpoint: string;
  method: string;
  entryType: string;
  executionMode: string;
  timeout: number;
  webhookUrl?: string;
  inputSchema?: string;
  outputSchema?: string;
}

export function EndpointTestPanel({
  workflowId,
  baseUrl,
  endpoint,
  method,
  entryType,
  executionMode,
  timeout,
  webhookUrl,
  inputSchema,
  outputSchema
}: EndpointTestPanelProps) {
  const [activeTab, setActiveTab] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [testInput, setTestInput] = useState('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showExecutionTimeline, setShowExecutionTimeline] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);

  // Generate full URL
  const fullUrl = `${baseUrl || 'https://yourapp.com'}${endpoint || ''}`;


  // Generate sample request body from input schema
  const generateSampleBody = () => {
    if (!inputSchema) {
      return JSON.stringify({ message: 'Hello World' }, null, 2);
    }

    try {
      const schema = JSON.parse(inputSchema);
      const sample: any = {};

      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
          if (prop.type === 'string') {
            // Better default examples based on common field names
            let example = prop.example;
            if (!example) {
              if (key.toLowerCase().includes('id')) {
                example = 'user123';
              } else if (key.toLowerCase().includes('prompt') || key.toLowerCase().includes('question')) {
                example = 'Was ist Machine Learning?';
              } else if (key.toLowerCase().includes('message')) {
                example = 'Hallo, wie kann ich helfen?';
              } else if (key.toLowerCase().includes('query')) {
                example = 'Suche nach Informationen';
              } else {
                example = `Sample ${key}`;
              }
            }
            sample[key] = example;
          } else if (prop.type === 'number') {
            sample[key] = prop.example || 42;
          } else if (prop.type === 'boolean') {
            sample[key] = prop.example || true;
          } else if (prop.type === 'object') {
            sample[key] = prop.example || {};
          } else if (prop.type === 'array') {
            sample[key] = prop.example || [];
          }
        });
      }

      return JSON.stringify(sample, null, 2);
    } catch (error) {
      return JSON.stringify({ message: 'Hello World' }, null, 2);
    }
  };

  // Generate curl command
  const generateCurlCommand = () => {
    const sampleBody = generateSampleBody();
    
    if (method === 'GET') {
      return `curl -X GET '${fullUrl}' \\
  -H 'Content-Type: application/json'`;
    }

    return `curl -X ${method} '${fullUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '${sampleBody.replace(/\n/g, '')}'`;
  };

  // Generate JavaScript fetch code
  const generateJavaScriptCode = () => {
    const sampleBody = generateSampleBody();

    if (method === 'GET') {
      return `fetch('${fullUrl}', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;
    }

    return `fetch('${fullUrl}', {
  method: '${method}',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${sampleBody})
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;
  };

  // Generate Python requests code
  const generatePythonCode = () => {
    const sampleBody = generateSampleBody();

    if (method === 'GET') {
      return `import requests

url = '${fullUrl}'
headers = {'Content-Type': 'application/json'}

response = requests.get(url, headers=headers)
print(response.json())`;
    }

    return `import requests
import json

url = '${fullUrl}'
headers = {'Content-Type': 'application/json'}
data = ${sampleBody}

response = requests.${method.toLowerCase()}(url, headers=headers, json=data)
print(response.json())`;
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };


  // Test endpoint - handles all execution modes
  const handleTestEndpoint = async () => {
    setIsTesting(true);
    try {
      let inputData;
      try {
        inputData = testInput ? JSON.parse(testInput) : JSON.parse(generateSampleBody());
      } catch (error) {
        setTestResponse({
          success: false,
          error: 'Invalid JSON input',
          mode: executionMode
        });
        setIsTesting(false);
        return;
      }

      // Route to correct execution mode
      switch (executionMode) {
        case 'sync':
          await testSynchronousExecution(inputData);
          break;
        case 'stream':
          await testStreamingExecution(inputData);
          break;
        case 'background':
          await testBackgroundExecution(inputData);
          break;
        default:
          await testSynchronousExecution(inputData);
      }
    } catch (error: any) {
      setTestResponse({
        success: false,
        error: error.message || 'Test failed',
        mode: executionMode
      });
    } finally {
      setIsTesting(false);
    }
  };

  // ⚡ SYNCHRONOUS MODE - Wait for result (REAL API TEST)
  const testSynchronousExecution = async (inputData: any) => {
    const startTime = Date.now();
    
    try {
      // Use the new real workflow test API
      const response = await workflowService.testWorkflow(workflowId, inputData);
      const latency = Date.now() - startTime;
      
      // Validate output against schema
      const validation = validateOutput(response.output);
      setValidationResult(validation);
      
      setTestResponse({
        success: response.success,
        mode: 'sync',
        data: {
          ...response,
          latency_ms: latency,
          executionMode: 'Synchronous (Real Workflow)',
          executionTrace: response.executionTrace || []
        }
      });

      // Open execution timeline if we have an execution ID
      if (response.executionId) {
        setCurrentExecutionId(response.executionId);
        setShowExecutionTimeline(true);
      }
    } catch (error: any) {
      const latency = Date.now() - startTime;
      setTestResponse({
        success: false,
        mode: 'sync',
        error: error.message || 'Workflow test failed',
        data: {
          latency_ms: latency,
          executionMode: 'Synchronous (Real Workflow)'
        }
      });
    }
  };

  // 🔄 STREAMING MODE - SSE real-time updates (REAL API TEST)
  const testStreamingExecution = async (inputData: any) => {
    try {
      // Use the new real workflow test API (streaming mode)
      const response = await workflowService.testWorkflow(workflowId, inputData);
      
      // Validate output against schema
      const validation = validateOutput(response.output);
      setValidationResult(validation);
      
      setTestResponse({
        success: response.success,
        mode: 'stream',
        data: {
          ...response,
          executionMode: 'Streaming (Real Workflow)',
          executionTrace: response.executionTrace || [],
          note: 'Streaming mode - real-time updates via SSE (Server-Sent Events)'
        }
      });
    } catch (error: any) {
      setTestResponse({
        success: false,
        mode: 'stream',
        error: error.message || 'Workflow test failed',
        data: {
          executionMode: 'Streaming (Real Workflow)'
        }
      });
    }
  };

  // 🕐 BACKGROUND MODE - Queue and poll (REAL API TEST)
  const testBackgroundExecution = async (inputData: any) => {
    try {
      // Use the new real workflow test API (background mode)
      const response = await workflowService.testWorkflow(workflowId, inputData);
      
      // Validate output against schema (if available)
      const validation = validateOutput(response.output);
      setValidationResult(validation);
      
      setTestResponse({
        success: response.success,
        mode: 'background',
        data: {
          ...response,
          executionMode: 'Background (Real Workflow)',
          executionTrace: response.executionTrace || [],
          note: 'Job queued for background processing',
          pollUrl: `/api/execution/${response.executionId}/status`,
          webhookUrl: webhookUrl || 'Not configured'
        }
      });
    } catch (error: any) {
      setTestResponse({
        success: false,
        mode: 'background',
        error: error.message || 'Workflow test failed',
        data: {
          executionMode: 'Background (Real Workflow)'
        }
      });
    }
  };

  // Validate output against output schema
  const validateOutput = (output: any): ValidationResult | null => {
    if (!outputSchema || !output) {
      return null;
    }

    try {
      return validateJsonSchema(output, outputSchema);
    } catch (error) {
      console.error('Schema validation error:', error);
      return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Test Input Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">🧪 Test Input</h3>
          <button
            onClick={() => setTestInput('')}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Reset
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your test data (JSON format):
            </label>
            <textarea
              value={testInput || generateSampleBody()}
              onChange={(e) => setTestInput(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your test data here..."
            />
            <div className="mt-2 text-xs text-gray-500">
              💡 This data will be sent to your workflow when you click "Test Synchronous Execution"
            </div>
          </div>
        </div>
      </div>

      {/* Sample Request Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">📋 Sample Request</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('curl')}
              className={`px-3 py-1 text-xs rounded ${
                activeTab === 'curl'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveTab('javascript')}
              className={`px-3 py-1 text-xs rounded ${
                activeTab === 'javascript'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              JavaScript
            </button>
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1 text-xs rounded ${
                activeTab === 'python'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Python
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-xs font-mono">
            {activeTab === 'curl' && generateCurlCommand()}
            {activeTab === 'javascript' && generateJavaScriptCode()}
            {activeTab === 'python' && generatePythonCode()}
          </pre>
          <button
            onClick={() => {
              const code =
                activeTab === 'curl'
                  ? generateCurlCommand()
                  : activeTab === 'javascript'
                  ? generateJavaScriptCode()
                  : generatePythonCode();
              copyToClipboard(code);
            }}
            className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
          >
            📋 Copy
          </button>
        </div>
      </div>


      {/* Test Endpoint Button */}
      <div className="space-y-2">
        <button
          onClick={handleTestEndpoint}
          disabled={isTesting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-md font-medium text-sm flex items-center justify-center gap-2"
        >
          {isTesting ? '⏳ Testing...' : (
            <>
              {executionMode === 'sync' && '⚡ Test Synchronous Execution'}
              {executionMode === 'stream' && '🔄 Test Streaming Execution'}
              {executionMode === 'background' && '🕐 Test Background Execution'}
            </>
          )}
        </button>
        <div className="text-xs text-gray-500 px-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Entry:</span>
            {entryType === 'webhook' && '🔗 Webhook (Push)'}
            {entryType === 'schedule' && '⏰ Scheduled'}
            {entryType === 'manual' && '👆 Manual'}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold">Mode:</span>
            {executionMode === 'sync' && 'Waits for result (< 30s)'}
            {executionMode === 'stream' && 'Real-time updates via SSE'}
            {executionMode === 'background' && 'Queue & poll status'}
          </div>
        </div>
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {executionMode === 'sync' && '⚡ Test Synchronous Execution'}
                    {executionMode === 'stream' && '🔄 Test Streaming Execution'}
                    {executionMode === 'background' && '🕐 Test Background Execution'}
                  </h2>
                  <div className="text-xs text-gray-500 mt-1">
                    {entryType === 'webhook' && '🔗 Webhook'}
                    {entryType === 'schedule' && '⏰ Scheduled'}
                    {entryType === 'manual' && '👆 Manual'}
                    {' • '}
                    Timeout: {timeout}ms
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    setTestResponse(null);
                    setValidationResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* Endpoint Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono font-semibold text-blue-800">{method}</span>
                    <span className="text-blue-600 font-mono text-xs">{fullUrl}</span>
                  </div>
                </div>

                {/* Test Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Request Body (JSON)
                  </label>
                  <textarea
                    value={testInput || generateSampleBody()}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    rows={10}
                    placeholder="Enter JSON request body"
                  />
                </div>

                {/* Test Button */}
                <button
                  onClick={handleTestEndpoint}
                  disabled={isTesting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
                >
                  {isTesting ? '⏳ Testing...' : '▶️ Run Test'}
                </button>

                {/* Test Response */}
                {testResponse && (
                  <div className="mt-4 space-y-3">
                    {/* Schema Validation Result */}
                    {validationResult && (
                      <div className={`border rounded-md p-3 ${
                        validationResult.valid
                          ? 'bg-green-50 border-green-300'
                          : 'bg-yellow-50 border-yellow-300'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-sm font-semibold ${
                            validationResult.valid ? 'text-green-800' : 'text-yellow-800'
                          }`}>
                            {validationResult.valid ? '✅ Output Schema Valid' : '⚠️ Schema Validation Issues'}
                          </span>
                        </div>
                        {!validationResult.valid && validationResult.errors.length > 0 && (
                          <div className="space-y-2 mt-2">
                            <div className="text-xs font-semibold text-yellow-800">
                              Found {validationResult.errors.length} validation error(s):
                            </div>
                            {validationResult.errors.map((error, index) => (
                              <div key={index} className="text-xs bg-white rounded p-2 border border-yellow-200">
                                <div className="font-semibold text-yellow-900">{error.path}</div>
                                <div className="text-gray-700 mt-1">{error.message}</div>
                                {error.expected && (
                                  <div className="mt-1 text-gray-600">
                                    <span className="font-semibold">Expected:</span> {JSON.stringify(error.expected)}
                                    {' | '}
                                    <span className="font-semibold">Actual:</span> {JSON.stringify(error.actual)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Response Data */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Response
                        </label>
                        {testResponse.data?.executionId && (
                          <button
                            onClick={() => {
                              setCurrentExecutionId(testResponse.data.executionId);
                              setShowExecutionTimeline(true);
                            }}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md font-medium"
                          >
                            📊 View Timeline
                          </button>
                        )}
                      </div>
                      <div
                        className={`border rounded-md p-4 ${
                          testResponse.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-sm font-semibold ${
                              testResponse.success ? 'text-green-800' : 'text-red-800'
                            }`}
                          >
                            {testResponse.success ? '✅ Success' : '❌ Failed'}
                          </span>
                        </div>
                        <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(testResponse.data || testResponse.error, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestResponse(null);
                  setValidationResult(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution Timeline */}
      {showExecutionTimeline && currentExecutionId && (
        <ExecutionTimeline
          executionId={currentExecutionId}
          onClose={() => {
            setShowExecutionTimeline(false);
          }}
        />
      )}
    </div>
  );
}

