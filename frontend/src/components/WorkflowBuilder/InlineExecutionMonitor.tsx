import { useState, useEffect } from 'react';
import { workflowService } from '../../services/workflowService';
import type { Execution, ExecutionStep } from '../../types/workflow';

interface InlineExecutionMonitorProps {
  executionId?: string;
  onClose: () => void;
}

export function InlineExecutionMonitor({ executionId, onClose }: InlineExecutionMonitorProps) {
  const [execution, setExecution] = useState<Execution | null>(null);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!executionId) return;

    const pollExecution = async () => {
      try {
        const exec = await workflowService.getExecution(executionId);
        setExecution(exec);
        setSteps(exec.executionTrace || []);
        setError(null);

        // Stop polling if execution is completed or failed
        if (exec.status === 'completed' || exec.status === 'failed' || exec.status === 'cancelled') {
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch execution status');
        setLoading(false);
      }
    };

    // Initial fetch
    pollExecution();

    // Poll every 1 second for live updates
    const interval = setInterval(pollExecution, 1000);

    return () => clearInterval(interval);
  }, [executionId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'running': return 'text-blue-600 bg-blue-100 animate-pulse';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
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

  if (!executionId) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Live Execution</h3>
            <p className="text-sm text-gray-600">ID: {executionId}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-xs text-gray-600 mb-1">Status</div>
          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution?.status || 'pending')}`}>
            {execution?.status?.toUpperCase() || 'PENDING'}
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-xs text-gray-600 mb-1">Duration</div>
          <div className="text-sm font-medium">
            {execution?.startedAt && execution?.completedAt ? 
              `${Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s` :
              execution?.startedAt ? 
              `${Math.round((Date.now() - new Date(execution.startedAt).getTime()) / 1000)}s` :
              '-'
            }
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-xs text-gray-600 mb-1">Steps</div>
          <div className="text-sm font-medium">{steps.length}</div>
        </div>
      </div>
      {error && (
        <div className="mb-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Execution Steps - Live Progress */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Execution Steps</h4>
        {loading && steps.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-blue-800 text-sm">Starting execution...</div>
          </div>
        ) : steps.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-gray-600 text-sm">No steps executed yet</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {steps.map((step, index) => (
              <div key={`${step.nodeId}-${index}`} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStepStatusIcon(step.status)}</span>
                    <div>
                      <div className="font-medium text-sm text-gray-800">
                        {step.nodeType.charAt(0).toUpperCase() + step.nodeType.slice(1)} Node
                      </div>
                      <div className="text-xs text-gray-600">
                        {step.nodeId}
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

                {step.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                    <div className="text-xs text-red-800 font-medium">Error:</div>
                    <div className="text-xs text-red-700">{step.error}</div>
                  </div>
                )}

                {step.output && (
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                      View Output
                    </summary>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                      {typeof step.output === 'string' 
                        ? step.output 
                        : JSON.stringify(step.output, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Final Output */}
      {execution?.output && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Final Output</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(execution.output, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Error Details */}
      {execution?.error && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Error Details</h4>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <pre className="text-xs text-red-700 whitespace-pre-wrap">
              {execution.error}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

