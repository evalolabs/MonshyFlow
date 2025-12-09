import { useState, useEffect } from 'react';
import { workflowService } from '../../services/workflowService';
import type { Execution, ExecutionStep } from '../../types/workflow';
import { SchemaVisualization } from './SchemaVisualization';

interface ExecutionTimelineProps {
  executionId?: string;
  onClose: () => void;
}

export function ExecutionTimeline({ executionId, onClose }: ExecutionTimelineProps) {
  const [execution, setExecution] = useState<Execution | null>(null);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!executionId) return;

    const pollExecution = async () => {
      try {
        console.log('🔍 Fetching execution for ID:', executionId);
        const exec = await workflowService.getExecution(executionId);
        console.log('🔍 Execution data:', exec);
        console.log('🔍 Execution steps:', exec.steps);
        console.log('🔍 Execution trace:', exec.executionTrace);
        console.log('🔍 Execution status:', exec.status);
        
        setExecution(exec);
        setSteps(exec.steps || exec.executionTrace || []);
        setError(null);

        // Stop polling if execution is completed or failed
        if (exec.status === 'completed' || exec.status === 'failed' || exec.status === 'cancelled') {
          setLoading(false);
        }
      } catch (err: any) {
        console.error('❌ Execution fetch error:', err);
        console.error('❌ Error details:', err.response?.data);
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

  // Animate through steps
  useEffect(() => {
    if (steps.length === 0) return;

    const timer = setInterval(() => {
      setCurrentStepIndex(prev => {
        const next = prev + 1;
        return next >= steps.length ? prev : next;
      });
    }, 2000); // Show each step for 2 seconds

    return () => clearInterval(timer);
  }, [steps.length]);

  const getStepStatus = (index: number) => {
    // If execution is completed, all steps should be completed
    if (execution?.status === 'completed') {
      return 'completed';
    }
    
    // If execution failed, mark current step as failed
    if (execution?.status === 'failed' && index === currentStepIndex) {
      return 'failed';
    }
    
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'running';
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    if (status === 'completed') return '✅';
    if (status === 'running') return '🔄';
    if (status === 'failed') return '❌';
    return '⏳';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  if (!executionId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Live Execution Timeline</h2>
                <p className="text-blue-100">ID: {executionId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStepColor(execution?.status || 'pending')}`}></div>
                <span className="font-semibold text-gray-700">
                  {execution?.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Duration: {execution?.startedAt && execution?.completedAt ? 
                  `${Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s` :
                  execution?.startedAt ? 
                  `${Math.round((Date.now() - new Date(execution.startedAt).getTime()) / 1000)}s` :
                  '-'
                }
              </div>
              <div className="text-sm text-gray-600">
                Steps: {steps.length}
              </div>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">Live updates...</span>
              </div>
            )}
          </div>
          {error && (
            <div className="mt-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && steps.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Starting execution...</p>
              </div>
            </div>
          ) : steps.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">⚡</div>
                <p className="text-lg">No execution steps yet</p>
                <p className="text-sm">Steps will appear here as they execute</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Timeline */}
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {steps.map((step, index) => {
                  const status = getStepStatus(index);
                  const isActive = index === currentStepIndex;
                  
                  return (
                    <div key={`${step.nodeId}-${index}`} className="relative flex items-start gap-6">
                      {/* Timeline Dot */}
                      <div className={`relative z-10 w-16 h-16 rounded-full ${getStepColor(status)} flex items-center justify-center text-white text-xl shadow-lg transition-all duration-500 ${
                        isActive ? 'scale-110 shadow-xl' : ''
                      }`}>
                        {getStepIcon(status)}
                      </div>

                      {/* Step Content */}
                      <div className={`flex-1 bg-white rounded-lg shadow-md p-6 transition-all duration-500 ${
                        isActive ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-lg'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {step.nodeType.charAt(0).toUpperCase() + step.nodeType.slice(1)} Node
                            </h3>
                            <span className="text-sm text-gray-500">#{step.nodeId}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              status === 'completed' ? 'bg-green-100 text-green-800' :
                              status === 'running' ? 'bg-blue-100 text-blue-800' :
                              status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {status.toUpperCase()}
                            </span>
                            {step.duration && (
                              <span className="text-sm text-gray-500">
                                {step.duration}ms
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Error Message */}
                        {step.error && (
                          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-red-600">❌</span>
                              <span className="font-semibold text-red-800">Error</span>
                            </div>
                            <p className="text-red-700 text-sm">{step.error}</p>
                          </div>
                        )}

                        {/* Input/Output Schemas (dynamically generated) */}
                        {(step.inputSchema || step.outputSchema) && (
                          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {step.inputSchema && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                  Input Schema
                                  <span className="text-xs text-gray-500 font-normal">(generated)</span>
                                </h4>
                                <SchemaVisualization 
                                  schema={step.inputSchema} 
                                  title=""
                                  showEmpty={false}
                                />
                              </div>
                            )}
                            {step.outputSchema && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                  Output Schema
                                  <span className="text-xs text-gray-500 font-normal">(generated)</span>
                                </h4>
                                <SchemaVisualization 
                                  schema={step.outputSchema} 
                                  title=""
                                  showEmpty={false}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Input/Output */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {step.input && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Input</h4>
                              <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto max-h-32">
                                {typeof step.input === 'string' 
                                  ? step.input 
                                  : JSON.stringify(step.input, null, 2)}
                              </pre>
                            </div>
                          )}
                          {step.output && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Output</h4>
                              <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto max-h-32">
                                {typeof step.output === 'string' 
                                  ? step.output 
                                  : JSON.stringify(step.output, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {steps.length > 0 && (
              <span>Step {currentStepIndex + 1} of {steps.length}</span>
            )}
          </div>
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
