import { useState, useEffect } from 'react';
import { workflowService } from '../../services/workflowService';
import type { Execution } from '../../types/workflow';
import { DebugPanel } from '../DebugPanel/DebugPanel';

interface ExecutionMonitorProps {
  executionId: string;
  onClose: () => void;
}

export function ExecutionMonitor({ executionId, onClose }: ExecutionMonitorProps) {
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  useEffect(() => {
    const pollExecution = async () => {
      try {
        const exec = await workflowService.getExecution(executionId);
        setExecution(exec);
        setError(null);

        // Stop polling if execution is completed or failed
        if (exec.status === 'completed' || exec.status === 'failed' || exec.status === 'cancelled') {
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to fetch execution status');
        setLoading(false);
      }
    };

    // Initial fetch
    pollExecution();

    // Poll every 2 seconds
    const interval = setInterval(pollExecution, 2000);

    return () => clearInterval(interval);
  }, [executionId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'running': return '🔄';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  if (loading && !execution) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading execution...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!execution) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Execution Monitor</h2>
            <p className="text-gray-600">Execution ID: {executionId}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Status</div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(execution.status)}`}>
              {execution.status.toUpperCase()}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Started</div>
            <div className="text-sm font-medium">
              {execution.startedAt ? new Date(execution.startedAt).toLocaleString() : 'Not started'}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Duration</div>
            <div className="text-sm font-medium">
              {execution.startedAt && execution.completedAt ? 
                `${Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s` :
                execution.startedAt ? 
                `${Math.round((Date.now() - new Date(execution.startedAt).getTime()) / 1000)}s` :
                '-'
              }
            </div>
          </div>
        </div>

        {/* Execution Steps */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Execution Steps</h3>
          {(!execution.executionTrace || execution.executionTrace.length === 0) ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-blue-800 text-sm">
                {execution.status === 'running' ? (
                  <>🔄 Execution in progress... Trace data will appear here.</>
                ) : execution.status === 'pending' ? (
                  <>⏳ Waiting for execution to start...</>
                ) : (
                  <>ℹ️ No execution trace available yet.</>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {execution.executionTrace.map((step) => (
                <div key={step.nodeId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getStepStatusIcon(step.status)}</span>
                    <div>
                      <div className="font-medium text-gray-800 flex items-center gap-2">
                        {step.agentName ? '🤖' : ''} 
                        {step.agentName || (step.nodeType.charAt(0).toUpperCase() + step.nodeType.slice(1) + ' Node')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {step.agentName ? `Agent` : `Node ID: ${step.nodeId}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(step.status)}`}>
                      {step.status.toUpperCase()}
                    </div>
                    {step.duration && (
                      <div className="text-xs text-gray-500 mt-1">
                        {step.duration}ms
                      </div>
                    )}
                  </div>
                </div>

                {/* Agents SDK: Tool Calls */}
                {step.toolCalls && step.toolCalls.length > 0 && (
                  <div className="mt-3 pl-11 space-y-2">
                    <div className="text-xs font-semibold text-gray-700 mb-1">🔧 Tool Calls:</div>
                    {step.toolCalls.map((toolCall, idx) => (
                      <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-blue-800">
                            {toolCall.toolName}
                          </div>
                          {toolCall.duration && (
                            <div className="text-xs text-blue-600">
                              {toolCall.duration}ms
                            </div>
                          )}
                        </div>
                        <details className="mt-1">
                          <summary className="text-xs text-blue-600 cursor-pointer">
                            View Details
                          </summary>
                          <div className="mt-1 text-xs">
                            <div className="text-gray-600 font-medium">Input:</div>
                            <pre className="bg-white p-1 rounded text-xs overflow-x-auto">
                              {JSON.stringify(toolCall.input, null, 2)}
                            </pre>
                            <div className="text-gray-600 font-medium mt-1">Output:</div>
                            <pre className="bg-white p-1 rounded text-xs overflow-x-auto">
                              {JSON.stringify(toolCall.output, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                )}

                {/* Agents SDK: Handoffs */}
                {step.handoffs && step.handoffs.length > 0 && (
                  <div className="mt-3 pl-11 space-y-2">
                    <div className="text-xs font-semibold text-gray-700 mb-1">🔄 Agent Handoffs:</div>
                    {step.handoffs.map((handoff, idx) => (
                      <div key={idx} className="bg-purple-50 border border-purple-200 rounded p-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-purple-800">{handoff.fromAgent}</span>
                          <span className="text-purple-600">→</span>
                          <span className="font-medium text-purple-800">{handoff.toAgent}</span>
                          <span className="text-xs text-purple-600 ml-auto">
                            {new Date(handoff.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {step.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                    <div className="text-sm text-red-800 font-medium">Error:</div>
                    <div className="text-sm text-red-700">{step.error}</div>
                  </div>
                )}

                {step.output && (
                  <details className="mt-2">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                      View Output
                    </summary>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto">
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Final Output */}
        {execution.output && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Final Output</h3>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(execution.output, null, 2)}
            </pre>
          </div>
        )}

        {/* Error Details */}
        {execution.error && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-4">Error Details</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <pre className="text-sm text-red-700 whitespace-pre-wrap">
                {execution.error}
              </pre>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Close
          </button>
        </div>
      </div>

      {/* Debug Panel */}
      <DebugPanel
        executionSteps={execution.executionTrace || []}
        isVisible={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />
    </div>
  );
}
