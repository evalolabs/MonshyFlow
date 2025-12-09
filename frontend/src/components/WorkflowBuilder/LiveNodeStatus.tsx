import { useState, useEffect } from 'react';
import type { ExecutionStep } from '../../types/workflow';

interface LiveNodeStatusProps {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  executionSteps: ExecutionStep[];
  isExecuting: boolean;
}

export function LiveNodeStatus({ 
  nodeId, 
  nodeType, 
  nodeLabel, 
  executionSteps, 
  isExecuting 
}: LiveNodeStatusProps) {
  const [currentStep, setCurrentStep] = useState<ExecutionStep | null>(null);

  useEffect(() => {
    // Find the execution step for this node
    const step = executionSteps.find(s => s.nodeId === nodeId);
    setCurrentStep(step || null);
  }, [nodeId, executionSteps]);

  const getStatus = () => {
    if (currentStep) {
      return currentStep.status;
    }
    if (isExecuting) {
      return 'pending';
    }
    return 'idle';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'pending': return 'bg-yellow-500';
      case 'idle': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'running': return '🔄';
      case 'pending': return '⏳';
      case 'idle': return '⚪';
      default: return '⚪';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'running': return 'Running...';
      case 'pending': return 'Waiting...';
      case 'idle': return 'Ready';
      default: return 'Ready';
    }
  };

  return (
    <div className="relative">
      {/* Live Status Indicator */}
      <div className="absolute -top-2 -right-2 z-10">
        <div className={`w-4 h-4 rounded-full ${getStatusColor(getStatus())} flex items-center justify-center text-xs`}>
          {getStatusIcon(getStatus())}
        </div>
      </div>

      {/* Node Content */}
      <div className="bg-white border-2 rounded-lg p-3 shadow-sm transition-all duration-300"
           style={{
             borderColor: getStatus() === 'running' ? '#3b82f6' : 
                         getStatus() === 'completed' ? '#10b981' : 
                         getStatus() === 'failed' ? '#ef4444' : '#e5e7eb'
           }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {nodeType === 'start' && '🚀'}
            {nodeType === 'llm' && '🤖'}
            {nodeType === 'api' && '🌐'}
            {nodeType === 'end' && '🏁'}
            {!['start', 'llm', 'api', 'end'].includes(nodeType) && '⚙️'}
          </span>
          <div className="flex-1">
            <div className="font-medium text-sm text-gray-800">
              {nodeLabel || nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
            </div>
            <div className="text-xs text-gray-600">
              {getStatusText(getStatus())}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {getStatus() === 'running' && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        )}

        {/* Duration */}
        {currentStep?.duration && (
          <div className="mt-1 text-xs text-gray-500">
            {currentStep.duration}ms
          </div>
        )}

        {/* Error Message */}
        {currentStep?.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {currentStep.error}
          </div>
        )}

        {/* Output Preview */}
        {currentStep?.output && (
          <details className="mt-2">
            <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
              View Output
            </summary>
            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto max-h-20">
              {typeof currentStep.output === 'string' 
                ? currentStep.output.substring(0, 100) + (currentStep.output.length > 100 ? '...' : '')
                : JSON.stringify(currentStep.output, null, 2).substring(0, 100) + '...'}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

