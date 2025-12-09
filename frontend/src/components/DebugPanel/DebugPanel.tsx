/**
 * Professional Debug Panel Component
 * 
 * VS Code-inspired debug panel with syntax highlighting and professional UI
 */

import React, { useState } from 'react';
import { 
  ChevronDown, ChevronRight, Copy, Eye, EyeOff, Download, Code, Database, 
  Play, CheckCircle, XCircle, Clock, Maximize2, Minimize2, 
  Search,  X
} from 'lucide-react';
// Simple JSON syntax highlighting without external dependencies
import type { ExecutionStep } from '../../types/workflow';
import { workflowService } from '../../services/workflowService';
import type { Node } from '@xyflow/react';
import { InputSchemaFormModal } from './InputSchemaFormModal';
import { testInputStorage } from '../../utils/testInputStorage';

// Simple JSON syntax highlighter component
const JsonHighlighter = ({ children }: { children: string | undefined | null }) => {
  const highlightJson = (json: string | undefined | null) => {
    if (json === undefined || json === null) {
      return '<span class="text-gray-500">undefined</span>';
    }
    
    const jsonString = typeof json === 'string' ? json : String(json);
    
    return jsonString
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'text-gray-300';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-blue-400'; // key
          } else {
            cls = 'text-green-400'; // string value
          }
        } else if (/^(true|false)$/.test(match)) {
          cls = 'text-purple-400'; // boolean
        } else if (/^(null)$/.test(match)) {
          cls = 'text-gray-500'; // null
        } else if (/^-?\d+/.test(match)) {
          cls = 'text-yellow-400'; // number
        }
        return `<span class="${cls}">${match}</span>`;
      })
      .replace(/([{}[\]])/g, '<span class="text-white font-bold">$1</span>')
      .replace(/(,)/g, '<span class="text-gray-400">$1</span>');
  };

  return (
    <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words">
      <code 
        className="block"
        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
        dangerouslySetInnerHTML={{ 
          __html: highlightJson(children) 
        }} 
      />
    </pre>
  );
};

interface DebugPanelProps {
  executionSteps: ExecutionStep[];
  isVisible: boolean;
  onClose: () => void;
  workflowId?: string;
  onStepUpdate?: (nodeId: string, updatedStep: ExecutionStep) => void;
  nodes?: Node[]; // Workflow nodes to access node configs (e.g., inputSchema)
  onTestResult?: (result: any, originalStep: ExecutionStep) => void;
  onTestStart?: (nodeId: string, step: ExecutionStep) => void; // Called immediately when Play button is clicked
}

interface DebugNodeProps {
  step: ExecutionStep;
  isExpanded: boolean;
  onToggle: () => void;
  workflowId?: string;
  onStepUpdate?: (nodeId: string, updatedStep: ExecutionStep) => void;
  onTestResult?: (result: any, currentStep: ExecutionStep) => void;
  onTestStart?: (nodeId: string, step: ExecutionStep) => void; // Called immediately when Play button is clicked
  nodes?: Node[]; // Workflow nodes to access node configs
}

function DebugNode({ step, isExpanded, onToggle, workflowId, onStepUpdate, onTestResult, onTestStart, nodes }: DebugNodeProps) {
  const [showRawData, setShowRawData] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('output');
  const [isRunning, setIsRunning] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [targetNodeIdForTest, setTargetNodeIdForTest] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadData = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />;
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />;
      case 'running':
        return <Clock className="w-3.5 h-3.5 text-yellow-500 animate-spin flex-shrink-0" />;
      case 'pending':
        return <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'running':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'pending':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Shorten node ID for display (e.g., "start-1761914401703" -> "start-...703")
  const shortenNodeId = (nodeId: string): string => {
    const parts = nodeId.split('-');
    if (parts.length > 1) {
      const prefix = parts[0];
      const id = parts.slice(1).join('-');
      if (id.length > 6) {
        return `${prefix}-...${id.slice(-3)}`;
      }
    }
    return nodeId.length > 15 ? `${nodeId.slice(0, 12)}...` : nodeId;
  };

  // Format node type for display (e.g., "ifelse" -> "IfElse", "set-state" -> "Set State")
  const formatNodeType = (nodeType: string): string => {
    // Handle special cases
    if (nodeType === 'ifelse') return 'IfElse';
    if (nodeType === 'llm') return 'LLM';
    if (nodeType === 'api') return 'API';
    
    // Handle kebab-case (e.g., "set-state" -> "Set State")
    if (nodeType.includes('-')) {
      return nodeType
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // Handle camelCase or single word (e.g., "start" -> "Start")
    return nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
  };

  // Find start node with webhook schema
  const findStartNodeWithWebhookSchema = (): { node: Node | null; nodeId: string | null } => {
    if (!nodes) {
      return { node: null, nodeId: null };
    }
    
    const startNode = nodes.find(n => n.type === 'start');
    if (!startNode) {
      return { node: null, nodeId: null };
    }
    
    const entryType = startNode.data?.entryType;
    const inputSchema = startNode.data?.inputSchema;
    
    const hasWebhookSchema = entryType === 'webhook' && 
                            !!inputSchema && 
                            typeof inputSchema === 'object' && 
                            'properties' in inputSchema &&
                            !!inputSchema.properties;
    
    return hasWebhookSchema ? { node: startNode, nodeId: startNode.id } : { node: null, nodeId: null };
  };

  // Check if this is a start node with webhook entry type and inputSchema
  const isStartNodeWithWebhookSchema = (): boolean => {
    if (step.nodeType !== 'start') {
      return false;
    }

    const node = nodes?.find(n => n.id === step.nodeId);
    if (!node) {
      return false;
    }

    const entryType = node.data?.entryType;
    const inputSchema = node.data?.inputSchema;

    return entryType === 'webhook' && 
           !!inputSchema && 
           typeof inputSchema === 'object' && 
           'properties' in inputSchema &&
           !!inputSchema.properties;
  };

  // Check if we should show the input modal (for downstream nodes when start node needs input)
  const shouldShowInputModal = (): boolean => {
    // Check if we're testing a downstream node and start node needs input
    const { node: startNode, nodeId: startNodeId } = findStartNodeWithWebhookSchema();
    if (startNode && startNodeId && step.nodeId !== startNodeId) {
      // Check if we have saved input data
      const savedInput = workflowId ? testInputStorage.load(workflowId, startNodeId) : null;
      if (!savedInput) {
        // Need to show modal for start node
        return true;
      }
    }
    
    return false;
  };

  // Handle opening input modal for start node
  const handleOpenInputModal = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling the node
    setShowInputModal(true);
  };

  // Get the input schema for this node (or start node if testing downstream)
  const getInputSchema = (): any => {
    // If we're testing a downstream node, get start node's schema
    if (targetNodeIdForTest) {
      const { node: startNode } = findStartNodeWithWebhookSchema();
      return startNode?.data?.inputSchema || null;
    }
    
    // For start node, get its own schema
    if (step.nodeType === 'start') {
      const node = nodes?.find(n => n.id === step.nodeId);
      return node?.data?.inputSchema || null;
    }
    
    return null;
  };

  // Get the node label (or start node label if testing downstream)
  const getNodeLabel = (): string => {
    // If we're testing a downstream node, get start node's label
    if (targetNodeIdForTest) {
      const { node: startNode } = findStartNodeWithWebhookSchema();
      if (startNode) {
        const label = startNode.data?.label;
        if (typeof label === 'string') return label;
        return 'Start Node';
      }
    }
    
    // For start node, get its own label
    if (step.nodeType === 'start') {
      const node = nodes?.find(n => n.id === step.nodeId);
      const label = node?.data?.label;
      if (typeof label === 'string') {
        return label;
      }
      if (typeof step.nodeLabel === 'string') {
        return step.nodeLabel;
      }
      return 'Start Node';
    }
    
    // Otherwise, get this node's label
    const node = nodes?.find(n => n.id === step.nodeId);
    const label = node?.data?.label;
    if (typeof label === 'string') {
      return label;
    }
    if (typeof step.nodeLabel === 'string') {
      return step.nodeLabel;
    }
    return 'Start Node';
  };


  const handlePlayNode = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling the node when clicking play
    
    if (!workflowId) {
      console.warn('No workflowId provided, cannot test node');
      return;
    }

    // Validate input data against schema
  const validateInputData = (data: any, schema: any): string[] => {
    const errors: string[] = [];
    if (!schema || !schema.properties) {
      return errors;
    }

    const required = schema.required || [];
    Object.keys(schema.properties).forEach((name: string) => {
      if (required.includes(name)) {
        if (data[name] === undefined || data[name] === null || data[name] === '') {
          errors.push(`${name} is required`);
        }
      }
    });

    return errors;
  };

  // For start nodes with webhook schema, check if we have saved input data
    if (isStartNodeWithWebhookSchema()) {
      const savedInput = testInputStorage.load(workflowId, step.nodeId);
      if (!savedInput) {
        // No saved data - show modal
        setShowInputModal(true);
        return;
      }
      
      // Validate saved input data
      const inputSchema = getInputSchema();
      if (inputSchema) {
        const validationErrors = validateInputData(savedInput, inputSchema);
        if (validationErrors.length > 0) {
          // Show modal with validation errors
          setShowInputModal(true);
          return;
        }
      }
      
      // Use saved input data (validated)
      setIsRunning(true);
      
      // ✅ Start animation IMMEDIATELY (before backend call)
      if (onTestStart) {
        onTestStart(step.nodeId, step);
      }
      
      try {
        const result = await workflowService.testNode(workflowId, step.nodeId, savedInput);
        if (onTestResult) {
          onTestResult(result, step);
        } else if (onStepUpdate) {
          const outputPayload = result.output || result;
          const outputPreview = JSON.stringify(outputPayload, null, 2);
          const updatedStep: ExecutionStep = {
            ...step,
            status: result.success ? 'completed' : 'failed',
            input: result.input || step.input,
            output: outputPayload,
            error: result.error || step.error,
            duration: result.duration || step.duration,
            startedAt: result.timestamp || new Date().toISOString(),
            completedAt: result.timestamp || new Date().toISOString(),
            debugInfo: {
              ...step.debugInfo,
              outputPreview,
              size: outputPreview.length,
            },
          };
          onStepUpdate(step.nodeId, updatedStep);
        }
      } catch (error: any) {
        console.error('Error testing node:', error);
        
        const errorResult = {
          success: false,
          error: error.response?.data?.error || error.message || 'Unknown error',
          nodeId: step.nodeId,
        };
        
        // Call onTestResult even on error so testingNodeId can be reset
        if (onTestResult) {
          onTestResult(errorResult, step);
        }
        
        const errorStep: ExecutionStep = {
          ...step,
          status: 'failed',
          error: error.response?.data?.error || error.message || 'Unknown error',
          debugInfo: {
            ...step.debugInfo,
            outputPreview: `Error: ${error.response?.data?.error || error.message || 'Unknown error'}`,
          },
        };
        if (onStepUpdate) {
          onStepUpdate(step.nodeId, errorStep);
        }
      } finally {
        setIsRunning(false);
      }
      return;
    }

    // Check if we should show the input modal (for downstream nodes)
    if (shouldShowInputModal()) {
      // If testing downstream node, track which node we're actually testing
      const { nodeId: startNodeId } = findStartNodeWithWebhookSchema();
      if (startNodeId && step.nodeId !== startNodeId) {
        setTargetNodeIdForTest(step.nodeId);
      }
      setShowInputModal(true);
      return;
    }

    // If testing a downstream node, check if start node needs input
    const { node: startNode, nodeId: startNodeId } = findStartNodeWithWebhookSchema();
    let inputDataToUse: any = {};
    
    if (startNode && startNodeId && step.nodeId !== startNodeId) {
      // Testing a downstream node - check if start node has saved input data
      const savedInput = testInputStorage.load(workflowId, startNodeId);
      
      if (!savedInput) {
        // No saved data - show modal
        setTargetNodeIdForTest(step.nodeId);
        setShowInputModal(true);
        return;
      }
      
      // Validate saved input data for start node
      const startNodeSchema = startNode.data?.inputSchema;
      if (startNodeSchema) {
        const validationErrors = validateInputData(savedInput, startNodeSchema);
        if (validationErrors.length > 0) {
          // Show modal with validation errors
          setTargetNodeIdForTest(step.nodeId);
          setShowInputModal(true);
          return;
        }
      }
      
      // Use validated saved input data for start node
      inputDataToUse = savedInput;
    }

    // Test with input data (empty object if no start node or no saved data)
    setIsRunning(true);
    console.log('[DebugPanel] Testing node:', step.nodeId, 'type:', step.nodeType);
    
    // ✅ Start animation IMMEDIATELY (before backend call)
    if (onTestStart) {
      onTestStart(step.nodeId, step);
    }
    
    try {
      const result = await workflowService.testNode(workflowId, step.nodeId, inputDataToUse);
      console.log('[DebugPanel] Node test completed:', result);
      
      if (onTestResult) {
        onTestResult(result, step);
      } else if (onStepUpdate) {
        const outputPayload = result.output || result;
        const outputPreview = JSON.stringify(outputPayload, null, 2);
        const updatedStep: ExecutionStep = {
          ...step,
          status: result.success ? 'completed' : 'failed',
          input: result.input || step.input,
          output: outputPayload,
          error: result.error || step.error,
          duration: result.duration || step.duration,
          startedAt: result.timestamp || new Date().toISOString(),
          completedAt: result.timestamp || new Date().toISOString(),
          debugInfo: {
            ...step.debugInfo,
            outputPreview,
            size: outputPreview.length,
          },
        };
        onStepUpdate(step.nodeId, updatedStep);
      }
    } catch (error: any) {
      console.error('Error testing node:', error);
      
      const errorResult = {
        success: false,
        error: error.response?.data?.error || error.message || 'Unknown error',
        nodeId: step.nodeId,
      };
      
      // Call onTestResult even on error so testingNodeId can be reset
      if (onTestResult) {
        onTestResult(errorResult, step);
      }
      
      const errorStep: ExecutionStep = {
        ...step,
        status: 'failed',
        error: error.response?.data?.error || error.message || 'Unknown error',
        debugInfo: {
          ...step.debugInfo,
          outputPreview: `Error: ${error.response?.data?.error || error.message || 'Unknown error'}`,
        },
      };

      if (onStepUpdate) {
        onStepUpdate(step.nodeId, errorStep);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Input Button for Start Node with Webhook Schema - kompakt aber klar erkennbar */}
      {isStartNodeWithWebhookSchema() && workflowId && (
        <div className="px-2 py-1 border-b border-blue-200 bg-blue-50/50">
          <button
            onClick={handleOpenInputModal}
            className="w-full px-2 py-1 text-xs font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors flex items-center justify-center gap-1.5"
            title="Configure test input for webhook"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Configure Test Input</span>
          </button>
        </div>
      )}
      
      {/* Node Header */}
      <div 
        className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
        title={step.nodeId} // Show full ID on hover
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          )}
          
          <div className="flex items-center space-x-1.5 min-w-0 flex-1">
            {getStatusIcon(step.status)}
            {step.nodeLabel ? (
              <span className="font-medium text-gray-900 text-sm truncate">
                {step.nodeLabel}
              </span>
            ) : (
              <span className="font-medium text-gray-900 text-sm truncate">
                {formatNodeType(step.nodeType)}
              </span>
            )}
            {step.nodeLabel && (
              <span className="text-xs text-gray-400 truncate">
                ({formatNodeType(step.nodeType)})
              </span>
            )}
            <span className="text-xs text-gray-400 truncate">
              {shortenNodeId(step.nodeId)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${getStatusColor(step.status)}`}>
            {step.status.slice(0, 1).toUpperCase()}
          </span>
          
          <div className="flex items-center space-x-1 text-[10px] text-gray-500">
            <Database className="w-2.5 h-2.5" />
            <span className="whitespace-nowrap">{formatBytes(step.debugInfo?.size || 0)}</span>
            <span>•</span>
            <Clock className="w-2.5 h-2.5" />
            <span className="whitespace-nowrap">{formatDuration(step.duration || 0)}</span>
          </div>
          
          {/* Play Button - ganz rechts */}
          {workflowId && (
            <button
              onClick={handlePlayNode}
              disabled={isRunning}
              className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                isRunning ? 'cursor-not-allowed' : ''
              }`}
              title={`Test ${step.nodeLabel || formatNodeType(step.nodeType)} node`}
              aria-label="Play node"
            >
              {isRunning ? (
                <Clock className="w-3.5 h-3.5 text-blue-700 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 text-blue-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Node Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('input')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'input'
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Input Data
            </button>
            <button
              onClick={() => setActiveTab('output')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'output'
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Output Data
            </button>
          </div>

          {/* Data Display */}
          <div className="p-4">
            {activeTab === 'input' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">Input Schema</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowRawData(!showRawData)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Toggle raw view"
                    >
                      {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(step.input, null, 2))}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Copy input data"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadData(step.input, `${step.nodeId}-input.json`)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Download input data"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg overflow-hidden p-4 overflow-x-auto">
                  <JsonHighlighter>
                    {step.input !== undefined ? JSON.stringify(step.input, null, 2) : 'undefined'}
                  </JsonHighlighter>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">Output Data</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowRawData(!showRawData)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Toggle raw view"
                    >
                      {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(step.output, null, 2))}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Copy output data"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadData(step.output, `${step.nodeId}-output.json`)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Download output data"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {step.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <h5 className="text-sm font-medium text-red-800">Error</h5>
                    </div>
                    <p className="mt-2 text-sm text-red-700">{step.error}</p>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-lg overflow-hidden p-4 overflow-x-auto">
                    <JsonHighlighter>
                      {step.output !== undefined ? JSON.stringify(step.output, null, 2) : 'undefined'}
                    </JsonHighlighter>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Schema Form Modal */}
      {(showInputModal || shouldShowInputModal()) && workflowId && (
        <InputSchemaFormModal
          isOpen={showInputModal}
          onClose={() => {
            setShowInputModal(false);
            setTargetNodeIdForTest(null);
          }}
          schema={getInputSchema()}
          workflowId={workflowId}
          nodeId={targetNodeIdForTest ? (findStartNodeWithWebhookSchema().nodeId || step.nodeId) : step.nodeId}
          nodeLabel={getNodeLabel()}
        />
      )}
    </div>
  );
}

export function DebugPanel({ executionSteps, isVisible, onClose, workflowId, onStepUpdate, nodes, onTestResult, onTestStart }: DebugPanelProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [localSteps, setLocalSteps] = useState<ExecutionStep[]>(executionSteps);

  // Update local steps when executionSteps prop changes
  React.useEffect(() => {
    setLocalSteps(executionSteps);
  }, [executionSteps]);

  const handleStepUpdate = (nodeId: string, updatedStep: ExecutionStep) => {
    setLocalSteps(prevSteps => 
      prevSteps.map(step => step.nodeId === nodeId ? updatedStep : step)
    );
    
    // Also call the parent callback if provided
    if (onStepUpdate) {
      onStepUpdate(nodeId, updatedStep);
    }
  };

  const handleTestResult = React.useCallback((result: any, currentStep: ExecutionStep) => {
    let updatedFromTrace = false;

    if (Array.isArray(result?.execution?.trace) && result.execution.trace.length > 0) {
      result.execution.trace.forEach((traceEntry: any) => {
        const existingStep = localSteps.find(step => step.nodeId === traceEntry.nodeId);
        const outputPayload = traceEntry.output;
        const outputPreview =
          outputPayload !== undefined ? JSON.stringify(outputPayload, null, 2) : existingStep?.debugInfo?.outputPreview;

        const derivedStep: ExecutionStep = {
          nodeId: traceEntry.nodeId || existingStep?.nodeId || currentStep.nodeId,
          nodeType: existingStep?.nodeType || traceEntry.type || currentStep.nodeType,
          nodeLabel: existingStep?.nodeLabel || currentStep.nodeLabel,
          status: traceEntry.error ? 'failed' : 'completed',
          input: traceEntry.input ?? existingStep?.input,
          output: traceEntry.output ?? existingStep?.output,
          error: traceEntry.error ?? existingStep?.error,
          duration: traceEntry.duration ?? existingStep?.duration,
          startedAt: traceEntry.timestamp || existingStep?.startedAt,
          completedAt: traceEntry.timestamp || existingStep?.completedAt,
          debugInfo: {
            ...existingStep?.debugInfo,
            outputPreview,
            size: outputPreview ? outputPreview.length : existingStep?.debugInfo?.size,
          },
        };

        handleStepUpdate(derivedStep.nodeId, derivedStep);

        if (traceEntry.nodeId === currentStep.nodeId) {
          updatedFromTrace = true;
        }
      });
    }

    if (!updatedFromTrace) {
      const outputPayload = result.output ?? result;
      const outputPreview = outputPayload !== undefined ? JSON.stringify(outputPayload, null, 2) : 'undefined';
      handleStepUpdate(currentStep.nodeId, {
        ...currentStep,
        status: result.success ? 'completed' : 'failed',
        input: result.input || currentStep.input,
        output: outputPayload,
        error: result.error || currentStep.error,
        duration: result.duration || currentStep.duration,
        startedAt: result.timestamp || new Date().toISOString(),
        completedAt: result.timestamp || new Date().toISOString(),
        debugInfo: {
          ...currentStep.debugInfo,
          outputPreview,
          size: outputPreview.length,
        },
      });
    }
  }, [localSteps, handleStepUpdate]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    setExpandedNodes(new Set(executionSteps.map(step => step.nodeId)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Format node type for search matching
  const formatNodeTypeForSearch = (nodeType: string): string => {
    return nodeType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredSteps = localSteps.filter(step => {
    // Skip tool nodes (they are part of Agent node execution, not workflow flow)
    if (step.nodeType === 'tool' || (typeof step.nodeType === 'string' && step.nodeType.startsWith('tool-'))) {
      return false;
    }
    
    const formattedType = formatNodeTypeForSearch(step.nodeType);
    const matchesSearch = step.nodeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         step.nodeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formattedType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (step.nodeLabel && step.nodeLabel.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || step.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (!isVisible) return null;

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Professional Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Code className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Debug Console</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={expandAll}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Expand All"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={collapseAll}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Collapse All"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="p-2.5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Done</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredSteps.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <Code className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-700 mb-2">No execution steps</h4>
            <p className="text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'No steps match your search criteria' 
                : 'Start a workflow to see debug information'
              }
            </p>
          </div>
        ) : (
          filteredSteps.map((step, index) => (
            <DebugNode
              key={`${step.nodeId}-${index}`}
              step={step}
              isExpanded={expandedNodes.has(step.nodeId)}
              onToggle={() => toggleNode(step.nodeId)}
              workflowId={workflowId}
              onStepUpdate={handleStepUpdate}
              onTestResult={onTestResult || handleTestResult}
              onTestStart={onTestStart}
              nodes={nodes}
            />
          ))
        )}
      </div>
    </div>
  );
}
