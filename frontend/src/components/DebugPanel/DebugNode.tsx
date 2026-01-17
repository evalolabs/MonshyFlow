/**
 * Debug Node Component
 * 
 * Individual node display component for the debug panel
 */

import React, { useState } from 'react';
import { 
  ChevronDown, ChevronRight, Copy, Eye, EyeOff, Download, Database, 
  Play, CheckCircle, XCircle, Clock
} from 'lucide-react';
import type { ExecutionStep } from '../../types/workflow';
import { workflowService } from '../../services/workflowService';
import type { Node, Edge } from '@xyflow/react';
import { InputSchemaFormModal } from './InputSchemaFormModal';
import { testInputStorage } from '../../utils/testInputStorage';
import { JsonHighlighter } from './JsonHighlighter';
import { formatNodeType, getNodeMetadata, getCategoryColor, getNodeContext } from './debugPanelUtils';

export interface DebugNodeProps {
  step: ExecutionStep;
  isExpanded: boolean;
  onToggle: () => void;
  workflowId?: string;
  onStepUpdate?: (nodeId: string, updatedStep: ExecutionStep) => void;
  onTestResult?: (result: any, currentStep: ExecutionStep) => void;
  onTestStart?: (nodeId: string, step: ExecutionStep) => void;
  nodes?: Node[];
  edges?: Edge[];
}

export function DebugNode({ step, isExpanded, onToggle, workflowId, onStepUpdate, onTestResult, onTestStart, nodes, edges }: DebugNodeProps) {
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

  // Get node metadata for icon and category
  const nodeMetadata = getNodeMetadata(step.nodeType, nodes);
  const categoryColors = getCategoryColor(nodeMetadata.category || 'utility');

  // Get the actual node label from nodes array (prioritize this over step.nodeLabel)
  const actualNode = nodes?.find(n => n.id === step.nodeId);
  const nodeLabelFromData = actualNode?.data?.label;
  const displayLabel = typeof nodeLabelFromData === 'string' && nodeLabelFromData.trim() 
    ? nodeLabelFromData.trim() 
    : (step.nodeLabel || nodeMetadata.name);
  
  // Determine if we should show the ID more prominently (when no custom label)
  const hasCustomLabel = typeof nodeLabelFromData === 'string' && nodeLabelFromData.trim() && 
                         nodeLabelFromData.trim() !== nodeMetadata.name;
  
  // Get node context for tooltip
  const nodeContext = getNodeContext(step.nodeId, nodes, edges);
  const tooltipText = nodeContext ? `Position: ${nodeContext}` : `Node ID: ${step.nodeId}`;

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
    const { node: startNode, nodeId: startNodeId } = findStartNodeWithWebhookSchema();
    if (startNode && startNodeId && step.nodeId !== startNodeId) {
      const savedInput = workflowId ? testInputStorage.load(workflowId, startNodeId) : null;
      if (!savedInput) {
        return true;
      }
    }
    return false;
  };

  // Handle opening input modal for start node
  const handleOpenInputModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInputModal(true);
  };

  // Get the input schema for this node (or start node if testing downstream)
  const getInputSchema = (): any => {
    if (targetNodeIdForTest) {
      const { node: startNode } = findStartNodeWithWebhookSchema();
      return startNode?.data?.inputSchema || null;
    }
    
    if (step.nodeType === 'start') {
      const node = nodes?.find(n => n.id === step.nodeId);
      return node?.data?.inputSchema || null;
    }
    
    return null;
  };

  // Get the node label (or start node label if testing downstream)
  const getNodeLabel = (): string => {
    if (targetNodeIdForTest) {
      const { node: startNode } = findStartNodeWithWebhookSchema();
      if (startNode) {
        const label = startNode.data?.label;
        if (typeof label === 'string') return label;
        return 'Start Node';
      }
    }
    
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
    e.stopPropagation();
    
    const nodeLabel = step.nodeLabel || formatNodeType(step.nodeType);
    console.log(`Play clicked: ${nodeLabel} (${step.nodeType}, id: ${step.nodeId})`);
    
    if (!workflowId) {
      console.warn('No workflowId provided, cannot test node');
      return;
    }

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
        setShowInputModal(true);
        return;
      }
      
      const inputSchema = getInputSchema();
      if (inputSchema) {
        const validationErrors = validateInputData(savedInput, inputSchema);
        if (validationErrors.length > 0) {
          setShowInputModal(true);
          return;
        }
      }
      
      setIsRunning(true);
      
      if (onTestStart) {
        onTestStart(step.nodeId, step);
      }
      
      try {
        const result = await workflowService.testNode(workflowId, step.nodeId, savedInput);
        if (onTestResult) {
          onTestResult(result, step);
        } else if (onStepUpdate) {
          const responseData = result.data || result;
          const execution = responseData.execution || result.execution;
          const outputPayload = responseData.output || execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.output;
          const outputPreview = outputPayload !== undefined ? JSON.stringify(outputPayload, null, 2) : 'undefined';
          const updatedStep: ExecutionStep = {
            ...step,
            status: responseData.success !== false ? 'completed' : 'failed',
            input: execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.input || responseData.input || result.input || step.input,
            output: outputPayload,
            error: responseData.error || result.error || step.error,
            duration: execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.duration || responseData.duration || result.duration || step.duration,
            startedAt: execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.timestamp || responseData.timestamp || result.timestamp || new Date().toISOString(),
            completedAt: execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.timestamp || responseData.timestamp || result.timestamp || new Date().toISOString(),
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
      const savedInput = testInputStorage.load(workflowId, startNodeId);
      
      if (!savedInput) {
        setTargetNodeIdForTest(step.nodeId);
        setShowInputModal(true);
        return;
      }
      
      const startNodeSchema = startNode.data?.inputSchema;
      if (startNodeSchema) {
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
        const validationErrors = validateInputData(savedInput, startNodeSchema);
        if (validationErrors.length > 0) {
          setTargetNodeIdForTest(step.nodeId);
          setShowInputModal(true);
          return;
        }
      }
      
      inputDataToUse = savedInput;
    }

    setIsRunning(true);
    
    if (onTestStart) {
      onTestStart(step.nodeId, step);
    }
    
    try {
      const result = await workflowService.testNode(workflowId, step.nodeId, inputDataToUse);
      
      if (onTestResult) {
        onTestResult(result, step);
      } else if (onStepUpdate) {
        const responseData = result.data || result;
        const execution = responseData.execution || result.execution;
        const outputPayload = responseData.output || execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.output || responseData.previousOutputs?.find((p: any) => p.nodeId === step.nodeId)?.output;
        const outputPreview = outputPayload !== undefined ? JSON.stringify(outputPayload, null, 2) : 'undefined';
        const updatedStep: ExecutionStep = {
          ...step,
          status: responseData.success !== false ? 'completed' : 'failed',
          input: execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.input || responseData.input || result.input || step.input,
          output: outputPayload,
          error: responseData.error || result.error || step.error,
          duration: execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.duration || responseData.duration || result.duration || step.duration,
          startedAt: execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.timestamp || responseData.timestamp || result.timestamp || new Date().toISOString(),
          completedAt: execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.timestamp || responseData.timestamp || result.timestamp || new Date().toISOString(),
          debugInfo: {
            ...step.debugInfo,
            outputPreview,
            size: outputPreview.length,
          },
        };
        onStepUpdate(step.nodeId, updatedStep);
        
        if (responseData.previousOutputs && Array.isArray(responseData.previousOutputs)) {
          responseData.previousOutputs.forEach((prevOutput: any) => {
            if (prevOutput.nodeId !== step.nodeId) {
              const prevStep: ExecutionStep = {
                nodeId: prevOutput.nodeId,
                nodeType: prevOutput.nodeType,
                nodeLabel: prevOutput.label,
                status: 'completed',
                output: prevOutput.output,
                startedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                duration: 0,
                debugInfo: {
                  outputPreview: JSON.stringify(prevOutput.output, null, 2),
                  size: JSON.stringify(prevOutput.output).length,
                },
              };
              onStepUpdate(prevOutput.nodeId, prevStep);
            }
          });
        }
      }
    } catch (error: any) {
      console.error('Error testing node:', error);
      
      const errorResult = {
        success: false,
        error: error.response?.data?.error || error.message || 'Unknown error',
        nodeId: step.nodeId,
      };
      
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
      {/* Node Header */}
      <div 
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
        title={tooltipText}
      >
        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
          {/* Expand/Collapse */}
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
          )}
          
          {/* Node Icon */}
          <div className={`flex-shrink-0 w-5 h-5 rounded ${categoryColors.bg} ${categoryColors.border} border flex items-center justify-center text-[10px] leading-none`}>
            {nodeMetadata.icon}
          </div>

          {/* Status Icon */}
          {getStatusIcon(step.status)}

          {/* Name/Label and Type */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="font-medium text-gray-900 text-xs truncate" title={displayLabel}>
              {displayLabel}
            </span>
            <span className={`px-1 py-0.5 text-[9px] font-medium rounded ${categoryColors.bg} ${categoryColors.text} border ${categoryColors.border} flex-shrink-0 whitespace-nowrap`}>
              {formatNodeType(step.nodeType)}
            </span>
            <span className={`text-[9px] truncate max-w-[80px] ${hasCustomLabel ? 'text-gray-400' : 'text-gray-500 font-medium'}`} title={step.nodeId}>
              {shortenNodeId(step.nodeId)}
            </span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-1 flex-shrink-0 ml-1.5">
          {/* Status Badge */}
          <span className={`px-1 py-0.5 text-[9px] font-semibold rounded border ${getStatusColor(step.status)} whitespace-nowrap`}>
            {step.status === 'completed' ? '✓' : step.status === 'failed' ? '✗' : step.status === 'running' ? '⟳' : '○'}
          </span>
          
          {/* Metrics */}
          <div className="flex items-center space-x-0.5 text-[9px] text-gray-500">
            <Database className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{formatBytes(step.debugInfo?.size || 0)}</span>
            <span>•</span>
            <Clock className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{formatDuration(step.duration || 0)}</span>
          </div>
          
          {/* Play Button */}
          {workflowId && (
            <button
              onClick={handlePlayNode}
              disabled={isRunning}
              className={`p-0.5 rounded hover:bg-gray-100 transition-colors ${
                isRunning ? 'cursor-not-allowed opacity-50' : ''
              }`}
              title={`Test ${step.nodeLabel || formatNodeType(step.nodeType)} node`}
              aria-label="Play node"
            >
              {isRunning ? (
                <Clock className="w-3 h-3 text-blue-600 animate-spin" />
              ) : (
                <Play className="w-3 h-3 text-blue-600" />
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

