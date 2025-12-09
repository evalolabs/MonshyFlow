/**
 * Workflow Settings Panel
 * 
 * Panel for configuring workflow-level Agents SDK settings
 */

import { useState, useEffect } from 'react';
import { X, Settings, Zap, Shield, Play, Pause } from 'lucide-react';
import { workflowService } from '../../services/workflowService';

interface WorkflowSettingsPanelProps {
  workflow: {
    id?: string;
    name: string;
    description?: string;
    useAgentsSDK?: boolean;
    enableStreaming?: boolean;
    isActive?: boolean;
    guardrails?: {
      input?: string;
      output?: string;
    };
  };
  onClose: () => void;
  onUpdateWorkflow: (updates: Partial<WorkflowSettingsPanelProps['workflow']>) => void;
}

export function WorkflowSettingsPanel({ 
  workflow, 
  onClose, 
  onUpdateWorkflow 
}: WorkflowSettingsPanelProps) {
  const [config, setConfig] = useState({
    useAgentsSDK: workflow.useAgentsSDK || false,
    enableStreaming: workflow.enableStreaming || false,
    isActive: workflow.isActive ?? true,
    guardrails: {
      input: workflow.guardrails?.input || '',
      output: workflow.guardrails?.output || '',
    },
  });

  // Auto-save when config changes
  useEffect(() => {
    onUpdateWorkflow({
      useAgentsSDK: config.useAgentsSDK,
      enableStreaming: config.enableStreaming,
      isActive: config.isActive,
      guardrails: config.guardrails,
    });

    // Save isActive to backend
    if (workflow.id && config.isActive !== workflow.isActive) {
      workflowService.updateWorkflowActivation(workflow.id, config.isActive)
        .catch((error: unknown) => {
          console.error('Error updating workflow activation:', error);
        });
    }
  }, [config, onUpdateWorkflow, workflow.id, workflow.isActive]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Workflow Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Workflow Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {workflow.name}
              </h3>
              <p className="text-sm text-gray-600">
                {workflow.description || 'No description provided'}
              </p>
            </div>

            {/* Workflow Activation */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {config.isActive ? (
                  <Play className="h-5 w-5 text-green-600" />
                ) : (
                  <Pause className="h-5 w-5 text-gray-400" />
                )}
                <h3 className="text-lg font-medium text-gray-900">
                  Workflow Status
                </h3>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Workflow Active
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {config.isActive 
                        ? 'Workflow is active and can be executed. Scheduled workflows will run automatically.'
                        : 'Workflow is inactive. It cannot be executed and scheduled workflows will not run.'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.isActive}
                      onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                {!config.isActive && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-800">
                      ⚠️ <strong>Inactive workflows</strong> cannot be executed manually or automatically. 
                      Activate the workflow to enable execution.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Agents SDK Configuration */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Agents SDK Configuration
                </h3>
              </div>

              {/* Enable Agents SDK */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Enable Agents SDK Orchestration
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Use OpenAI Agents SDK for intelligent workflow orchestration, 
                      automatic tool coordination, and enhanced tracing.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.useAgentsSDK}
                      onChange={(e) => setConfig({ ...config, useAgentsSDK: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Streaming Configuration */}
              {config.useAgentsSDK && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        Enable Real-time Streaming
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Stream execution updates in real-time for better user experience.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableStreaming}
                        onChange={(e) => setConfig({ ...config, enableStreaming: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Guardrails Configuration */}
              {config.useAgentsSDK && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <h4 className="text-md font-medium text-gray-900">
                      Guardrails Configuration
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Input Guardrails
                      </label>
                      <textarea
                        value={config.guardrails.input}
                        onChange={(e) => setConfig({
                          ...config,
                          guardrails: { ...config.guardrails, input: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={3}
                        placeholder="Define input validation rules (e.g., must not contain profanity, must be under 1000 characters)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Rules to validate input before agent execution
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Output Guardrails
                      </label>
                      <textarea
                        value={config.guardrails.output}
                        onChange={(e) => setConfig({
                          ...config,
                          guardrails: { ...config.guardrails, output: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={3}
                        placeholder="Define output validation rules (e.g., must be JSON format, must not contain sensitive data)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Rules to validate output after agent execution
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits Info */}
              {config.useAgentsSDK && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-900">
                        Agents SDK Benefits
                      </h4>
                      <ul className="mt-2 text-sm text-blue-800 space-y-1">
                        <li>• Automatic multi-agent orchestration</li>
                        <li>• Built-in execution tracing and monitoring</li>
                        <li>• Intelligent tool coordination</li>
                        <li>• Enhanced error handling and recovery</li>
                        <li>• Real-time streaming capabilities</li>
                        <li>• Input/output validation with guardrails</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
