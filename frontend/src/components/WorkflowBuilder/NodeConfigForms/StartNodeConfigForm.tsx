/**
 * StartNodeConfigForm Component
 * 
 * Configuration form for Start nodes with validation.
 */

import { useState, useEffect } from 'react';
import type { StartNodeConfig } from '../../../types/startNode';
import { EXECUTION_MODE_LABELS, EXECUTION_MODE_DESCRIPTIONS, DEFAULT_INPUT_SCHEMA } from '../../../types/startNode';
import { SchemaBuilderModal } from '../NodeConfigPanel/SchemaBuilderModal';
import { ScheduleConfigModal } from '../NodeConfigPanel/ScheduleConfigModal';
import { Settings } from 'lucide-react';

// Helper function to generate example JSON from schema (same logic as in SchemaBuilder)
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
        if (prop.items?.type === 'object' && prop.items?.properties) {
          // Array of objects - generate one example object
          example[name] = [generateExampleFromSchema(prop.items)];
        } else {
          example[name] = [];
        }
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

interface StartNodeConfigFormProps {
  config: StartNodeConfig;
  validationResult: { isValid: boolean; errors: string[]; warnings: string[] } | null;
  onConfigChange: (config: Partial<StartNodeConfig>) => void;
  workflowId?: string;
}

// Helper function to format schedule description
const formatScheduleDescription = (cronExpression: string, timezone?: string): string => {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return cronExpression;
  
  const [min, hour, day, month, weekday] = parts;
  
  // Parse common patterns
  if (month === '*' && day === '*') {
    if (weekday === '*') {
      if (hour === '*') {
        return `Every hour at minute ${min}`;
      } else {
        const time = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
        return `Daily at ${time}${timezone ? ` (${timezone})` : ''}`;
      }
    } else if (weekday !== '*' && hour !== '*' && min !== '*') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[parseInt(weekday) % 7] || `Day ${weekday}`;
      const time = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
      return `Every ${dayName} at ${time}${timezone ? ` (${timezone})` : ''}`;
    }
  } else if (month === '*' && day !== '*' && weekday === '*' && hour !== '*' && min !== '*') {
    const time = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
    return `Monthly on day ${day} at ${time}${timezone ? ` (${timezone})` : ''}`;
  }
  
  return cronExpression;
};

export function StartNodeConfigForm({
  config,
  validationResult,
  onConfigChange,
  workflowId,
}: StartNodeConfigFormProps) {
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [pendingSchema, setPendingSchema] = useState<any>(config.inputSchema || DEFAULT_INPUT_SCHEMA);
  const [hasInitializedDefault, setHasInitializedDefault] = useState(false);

  // Initialize default schema if none exists and entryType is webhook
  useEffect(() => {
    if (config.entryType === 'webhook' && !config.inputSchema && !hasInitializedDefault) {
      onConfigChange({ inputSchema: DEFAULT_INPUT_SCHEMA });
      setPendingSchema(DEFAULT_INPUT_SCHEMA);
      setHasInitializedDefault(true);
    }
  }, [config.entryType, config.inputSchema, hasInitializedDefault, onConfigChange]);

  // Sync pendingSchema when config.inputSchema changes externally
  useEffect(() => {
    setPendingSchema(config.inputSchema || DEFAULT_INPUT_SCHEMA);
  }, [config.inputSchema]);

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      {validationResult && (
        <div className={`p-3 rounded-md text-sm ${
          validationResult.isValid 
            ? validationResult.warnings.length > 0 
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
              : 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="font-medium mb-1">
            {validationResult.isValid 
              ? validationResult.warnings.length > 0 ? '⚠️ Valid with warnings' : '✅ Configuration valid'
              : '❌ Configuration errors'
            }
          </div>
          {validationResult.errors.length > 0 && (
            <ul className="list-disc list-inside space-y-1">
              {validationResult.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}
          {validationResult.warnings.length > 0 && (
            <ul className="list-disc list-inside space-y-1 mt-2">
              {validationResult.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Start Node Name
        </label>
        <input
          type="text"
          value={config.label || ''}
          onChange={(e) => onConfigChange({ label: e.target.value })}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            validationResult?.errors.some(e => e.includes('Label')) 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300'
          }`}
          placeholder="Enter start node name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Entry Type
        </label>
        <select
          value={config.entryType || 'webhook'}
          onChange={(e) => onConfigChange({ entryType: e.target.value as any })}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            validationResult?.errors.some(e => e.includes('Entry type')) 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300'
          }`}
        >
          <option value="webhook">🔗 Webhook (Your application sends data automatically)</option>
          <option value="schedule">⏰ Scheduled (Runs automatically at set times)</option>
          <option value="manual">👆 Manual (Started by user action)</option>
        </select>
        <div className="mt-1 text-xs text-gray-500">
          {config.entryType === 'webhook' && 'Your application sends data to this workflow automatically (e.g., when a user sends a message, submits a form, or triggers an action)'}
          {config.entryType === 'schedule' && 'Workflow runs automatically at specific times (e.g., daily at 9 AM, every hour)'}
          {config.entryType === 'manual' && 'Workflow is started manually by a user (e.g., clicking a button, submitting a form)'}
        </div>
      </div>
      
      {/* Schedule Configuration - only for schedule entry type */}
      {(() => {
        // Debug logging
        console.log('[StartNodeConfigForm] Schedule section check:', {
          entryType: config.entryType,
          workflowId,
          scheduleConfig: config.scheduleConfig,
          shouldShow: config.entryType === 'schedule' && workflowId,
        });
        
        if (config.entryType === 'schedule' && workflowId) {
          return (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">⏰ Schedule</h3>
                  {config.scheduleConfig?.enabled && config.scheduleConfig?.cronExpression ? (
                    <p className="text-xs text-gray-600 mt-1">
                      {formatScheduleDescription(config.scheduleConfig.cronExpression, config.scheduleConfig.timezone)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">No schedule configured</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configure
                </button>
              </div>
              
              <ScheduleConfigModal
                isOpen={scheduleModalOpen}
                onClose={() => setScheduleModalOpen(false)}
                workflowId={workflowId}
                initialConfig={config.scheduleConfig}
                onConfigChange={(scheduleConfig) => {
                  onConfigChange({ scheduleConfig });
                }}
              />
            </div>
          );
        }
        return null;
      })()}

      {/* Endpoint URL and HTTP Method - only for manual entry type */}
      {config.entryType === 'manual' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endpoint URL
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.baseUrl || 'https://yourapp.com'}
                  onChange={(e) => onConfigChange({ baseUrl: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="https://yourapp.com"
                />
                <input
                  type="text"
                  value={config.endpoint || ''}
                  onChange={(e) => onConfigChange({ endpoint: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="/trigger/manual-start"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-gray-600">Generated URL:</div>
                  <button
                    type="button"
                    onClick={() => {
                      const fullUrl = `${config.baseUrl || 'https://yourapp.com'}${config.endpoint || ''}`;
                      navigator.clipboard.writeText(fullUrl);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    📋 Copy
                  </button>
                </div>
                <div className="text-sm font-mono text-gray-800 break-all">
                  {config.baseUrl || 'https://yourapp.com'}{config.endpoint || ''}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Users will trigger this URL manually
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTTP Method
            </label>
            <select
              value={config.method || 'POST'}
              onChange={(e) => onConfigChange({ method: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="GET">GET (Read data)</option>
              <option value="POST">POST (Send data)</option>
              <option value="PUT">PUT (Update data)</option>
              <option value="PATCH">PATCH (Partial update)</option>
            </select>
            <div className="mt-1 text-xs text-gray-500">
              Usually POST (form submission or button click)
            </div>
          </div>
        </>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={config.description || ''}
          onChange={(e) => onConfigChange({ description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Describe what triggers this workflow"
        />
      </div>

      {/* Execution Mode */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">⚙️ Execution Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Execution Mode
            </label>
            <select
              value={config.executionMode || 'sync'}
              onChange={(e) => onConfigChange({ executionMode: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(EXECUTION_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <div className="mt-1 text-xs text-gray-500">
              {config.executionMode && EXECUTION_MODE_DESCRIPTIONS[config.executionMode as keyof typeof EXECUTION_MODE_DESCRIPTIONS]}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeout (ms)
            </label>
            <input
              type="number"
              value={config.timeout || 120000}
              onChange={(e) => onConfigChange({ timeout: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="120000"
              min="1000"
              max="600000"
            />
            <div className="mt-1 text-xs text-gray-500">
              Maximum execution time (default: 120000ms = 2 minutes)
            </div>
          </div>

          {config.executionMode === 'background' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL (Optional)
              </label>
              <input
                type="url"
                value={config.webhookUrl || ''}
                onChange={(e) => onConfigChange({ webhookUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourapp.com/webhook/callback"
              />
              <div className="mt-1 text-xs text-gray-500">
                Optional: Get notified when execution completes
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Schema Section */}
      {config.entryType === 'webhook' && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">📋 Input Data Structure</h3>
              <p className="text-xs text-gray-500 mt-1">
                Define what data your application should send
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSchemaModal(true)}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              {config.inputSchema ? '✏️ Edit Schema' : '+ Configure Schema'}
            </button>
          </div>
          {config.inputSchema && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-xs text-green-800 font-medium">
                    Schema is configured ({Object.keys(config.inputSchema?.properties || {}).length} field{Object.keys(config.inputSchema?.properties || {}).length !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>
              
              {/* Example Input Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-800">💡 Example Input (for your application):</span>
                  <button
                    type="button"
                    onClick={() => {
                      const example = generateExampleFromSchema(config.inputSchema);
                      navigator.clipboard.writeText(JSON.stringify(example, null, 2));
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    📋 Copy Example
                  </button>
                </div>
                <pre className="text-xs text-blue-700 overflow-x-auto bg-white p-2 rounded border border-blue-200 max-h-48 overflow-y-auto">
                  {JSON.stringify(generateExampleFromSchema(config.inputSchema), null, 2)}
                </pre>
                <p className="text-xs text-blue-600 mt-2">
                  This is an example of the data structure your application should send to the webhook URL.
                </p>
              </div>
            </div>
          )}
          {!config.inputSchema && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                No schema defined - any data format will be accepted
              </p>
            </div>
          )}
        </div>
      )}

      {/* Schema Builder Modal */}
      {config.entryType === 'webhook' && (
        <SchemaBuilderModal
          isOpen={showSchemaModal}
          onClose={() => {
            // Save schema when closing modal
            onConfigChange({ inputSchema: pendingSchema });
            setShowSchemaModal(false);
          }}
          schema={pendingSchema}
          onChange={(schema) => {
            // Update pending schema (not saved yet)
            setPendingSchema(schema);
          }}
          schemaType="input"
          nodeType="start"
        />
      )}

      {/* Webhook Connection Section */}
      {config.entryType === 'webhook' && workflowId && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">🔗 Connect Your Application</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-blue-800">Webhook URL:</label>
                <button
                  type="button"
                  onClick={() => {
                    // Use relative URL (Nginx will proxy /api)
                    const apiUrl = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : window.location.origin;
                    const webhookUrl = `${apiUrl}/api/webhook/${workflowId}`;
                    navigator.clipboard.writeText(webhookUrl);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                >
                  📋 Copy URL
                </button>
              </div>
              <div className="bg-white border border-blue-300 rounded p-2">
                <code className="text-xs font-mono text-blue-900 break-all">
                  {(import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : window.location.origin)}/api/webhook/{workflowId}
                </code>
              </div>
            </div>
            
            <div className="text-xs text-blue-700 space-y-1">
              <p className="font-medium">📝 How to connect your application:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Copy the webhook URL above</li>
                <li>In your application, configure it to send data to this URL</li>
                <li>When your app sends data to this URL, the workflow will automatically start</li>
                <li>The workflow will process the data and return a response (if Execution Mode is set to "Sync")</li>
              </ol>
              <p className="mt-2 text-blue-600">
                ⚠️ <strong>Important:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Make sure the workflow is <strong>published</strong> before using it</li>
                  <li>Your application can send data using any HTTP method (POST, GET, PUT, etc.)</li>
                  <li>Send your data in the request body (for POST/PUT requests) or as query parameters (for GET requests)</li>
                </ul>
              </p>
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                <p className="font-medium mb-1">💡 For real-time applications (chat, voice, interactive apps):</p>
                <p>Set <strong>Execution Mode = "Sync"</strong> above to receive the Agent's response immediately in your application.</p>
                <p className="mt-1">Your app will wait for the workflow to complete and receive the full response with the Agent's output.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

