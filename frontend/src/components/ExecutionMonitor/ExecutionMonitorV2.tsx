/**
 * Enhanced Execution Monitor V2
 * 
 * Supports:
 * - Polling for background jobs
 * - SSE streaming for real-time updates
 * - Automatic mode detection
 */

import { useState, useEffect, useRef } from 'react';
import { workflowService } from '../../services/workflowService';
import { createSSEConnection, SSEConnection } from '../../services/sseService';
import type { Execution, ExecutionStep } from '../../types/workflow';

interface ExecutionMonitorV2Props {
  executionId?: string;
  mode?: 'polling' | 'streaming' | 'auto';
  streamUrl?: string;
  onClose: () => void;
}

export function ExecutionMonitorV2({ executionId, mode = 'auto', streamUrl, onClose }: ExecutionMonitorV2Props) {
  const [execution, setExecution] = useState<Execution | null>(null);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const sseConnectionRef = useRef<SSEConnection | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sseConnectionRef.current) {
        sseConnectionRef.current.disconnect();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Start monitoring
  useEffect(() => {
    if (mode === 'streaming' || (mode === 'auto' && streamUrl)) {
      startStreaming();
    } else if (executionId) {
      startPolling();
    }
  }, [executionId, mode, streamUrl]);

  /**
   * Start SSE streaming
   */
  const startStreaming = () => {
    if (!streamUrl) {
      setError('No stream URL provided');
      return;
    }

    console.log('🔄 Starting SSE streaming...');
    setIsStreaming(true);
    setLoading(true);

    const sse = createSSEConnection(streamUrl);
    sseConnectionRef.current = sse;

    // Handle run events
    sse.on('run.created', (event) => {
      console.log('📝 Run created:', event.data);
      setExecution({
        id: event.data.run_id,
        workflowId: event.data.workflow_id,
        status: event.data.status || 'running',
        input: event.data.input || {},
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        executionTrace: []
      });
      setLoading(false);
    });

    sse.on('run.started', (event) => {
      console.log('▶️  Run started:', event.data);
      setExecution(prev => prev ? { ...prev, status: 'running' } : null);
    });

    sse.on('run.completed', (event) => {
      console.log('✅ Run completed:', event.data);
      setExecution(prev => prev ? {
        ...prev,
        status: 'completed',
        output: event.data.output,
        completedAt: new Date().toISOString()
      } : null);
      setLoading(false);
      sseConnectionRef.current?.disconnect();
    });

    sse.on('run.failed', (event) => {
      console.log('❌ Run failed:', event.data);
      setExecution(prev => prev ? {
        ...prev,
        status: 'failed',
        error: event.data.error?.message || 'Execution failed',
        completedAt: new Date().toISOString()
      } : null);
      setLoading(false);
      sseConnectionRef.current?.disconnect();
    });

    // Handle node events
    sse.on('node.start', (event) => {
      console.log('🔧 Node started:', event.data);
      const newStep: ExecutionStep = {
        nodeId: event.data.node_id,
        nodeType: event.data.node_type || 'unknown',
        status: 'running',
        startedAt: new Date().toISOString()
      };
      setSteps(prev => [...prev, newStep]);
    });

    sse.on('node.end', (event) => {
      console.log('✔️  Node ended:', event.data);
      setSteps(prev => prev.map(step =>
        step.nodeId === event.data.node_id
          ? { ...step, status: 'completed', output: event.data.output, completedAt: new Date().toISOString() }
          : step
      ));
    });

    // Handle message deltas (for streaming text)
    sse.on('message.delta', (event) => {
      console.log('💬 Message delta:', event.data);
      // Append to latest step's output
      setSteps(prev => {
        if (prev.length === 0) return prev;
        const lastStep = prev[prev.length - 1];
        const currentText = lastStep.output?.text || '';
        return [
          ...prev.slice(0, -1),
          {
            ...lastStep,
            output: {
              ...lastStep.output,
              text: currentText + (event.data.text || '')
            }
          }
        ];
      });
    });

    // Error handling
    sse.onError((error) => {
      console.error('SSE error:', error);
      setError('Streaming connection lost');
      setLoading(false);
    });

    // Connect
    sse.connect();
  };

  /**
   * Start polling
   */
  const startPolling = () => {
    if (!executionId) return;

    console.log('🔄 Starting polling...');
    setIsStreaming(false);

    const pollExecution = async () => {
      try {
        const exec = await workflowService.getExecution(executionId);
        setExecution(exec);
        setSteps(exec.executionTrace || []);
        setError(null);

        // Stop polling if execution is completed or failed
        if (exec.status === 'completed' || exec.status === 'failed' || exec.status === 'cancelled') {
          setLoading(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch execution status');
        setLoading(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      }
    };

    // Initial fetch
    pollExecution();

    // Poll every 2 seconds
    pollingIntervalRef.current = setInterval(pollExecution, 2000) as unknown as number;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'running': return 'text-blue-600 bg-blue-100 animate-pulse';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'queued': return 'text-purple-600 bg-purple-100';
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
            <span className="ml-3 text-gray-600">
              {isStreaming ? 'Connecting to stream...' : 'Loading execution...'}
            </span>
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
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Execution Monitor
              {isStreaming && <span className="text-blue-600 text-sm">🔄 Live</span>}
            </h2>
            <p className="text-gray-600">Execution ID: {executionId || execution.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
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
          {steps.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-blue-800 text-sm">
                {execution.status === 'pending' ? (
                  <>⏳ Waiting for execution to start...</>
                ) : execution.status === 'running' ? (
                  <>🔄 Execution in progress... Steps will appear here.</>
                ) : (
                  <>ℹ️ No execution steps available yet.</>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={`${step.nodeId}-${index}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getStepStatusIcon(step.status)}</span>
                      <div>
                        <div className="font-medium text-gray-800">
                          {step.nodeType.charAt(0).toUpperCase() + step.nodeType.slice(1)} Node
                        </div>
                        <div className="text-sm text-gray-600">
                          Node ID: {step.nodeId}
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
    </div>
  );
}

