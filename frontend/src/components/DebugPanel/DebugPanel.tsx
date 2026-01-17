/**
 * Professional Debug Panel Component
 * 
 * VS Code-inspired debug panel with syntax highlighting and professional UI
 */

import React, { useState } from 'react';
import { Code, Maximize2, Minimize2, Search, X, Database } from 'lucide-react';
import type { ExecutionStep } from '../../types/workflow';
import type { Node, Edge } from '@xyflow/react';
import { DebugNode } from './DebugNode';
import { InputSchemaFormModal } from './InputSchemaFormModal';
import { testInputStorage } from '../../utils/testInputStorage';

interface DebugPanelProps {
  executionSteps: ExecutionStep[];
  isVisible: boolean;
  onClose: () => void;
  workflowId?: string;
  onStepUpdate?: (nodeId: string, updatedStep: ExecutionStep) => void;
  nodes?: Node[]; // Workflow nodes to access node configs (e.g., inputSchema)
  edges?: Edge[]; // Workflow edges to determine node context (branch, loop, etc.)
  onTestResult?: (result: any, originalStep: ExecutionStep) => void;
  onTestStart?: (nodeId: string, step: ExecutionStep) => void; // Called immediately when Play button is clicked
}

export function DebugPanel({ executionSteps, isVisible, onClose, workflowId, onStepUpdate, nodes, edges, onTestResult, onTestStart }: DebugPanelProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [localSteps, setLocalSteps] = useState<ExecutionStep[]>(executionSteps);
  const [showInputModal, setShowInputModal] = useState(false);

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

    // Extract data from response structure: { success: true, data: { output: {...}, execution: {...} } }
    const responseData = result.data || result;
    const execution = responseData.execution || result.execution;

    if (Array.isArray(execution?.trace) && execution.trace.length > 0) {
      execution.trace.forEach((traceEntry: any) => {
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
      // Get output from responseData.output (NodeData format: { json, metadata })
      // Do NOT use result directly as fallback - it contains the full response structure
      const outputPayload = responseData.output || execution?.trace?.find((t: any) => t.nodeId === currentStep.nodeId)?.output;
      const outputPreview = outputPayload !== undefined ? JSON.stringify(outputPayload, null, 2) : 'undefined';
      handleStepUpdate(currentStep.nodeId, {
        ...currentStep,
        status: responseData.success !== false ? 'completed' : 'failed',
        input: execution?.trace?.find((t: any) => t.nodeId === currentStep.nodeId)?.input || responseData.input || result.input || currentStep.input,
        output: outputPayload, // NodeData: { json, metadata }
        error: responseData.error || result.error || currentStep.error,
        duration: execution?.trace?.find((t: any) => t.nodeId === currentStep.nodeId)?.duration || responseData.duration || result.duration || currentStep.duration,
        startedAt: execution?.trace?.find((t: any) => t.nodeId === currentStep.nodeId)?.timestamp || responseData.timestamp || result.timestamp || new Date().toISOString(),
        completedAt: execution?.trace?.find((t: any) => t.nodeId === currentStep.nodeId)?.timestamp || responseData.timestamp || result.timestamp || new Date().toISOString(),
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

  // Find start node with webhook entry type
  const findStartNodeWithWebhook = (): { node: Node | null; nodeId: string | null } => {
    if (!nodes) {
      return { node: null, nodeId: null };
    }
    
    const startNode = nodes.find(n => n.type === 'start');
    if (!startNode) {
      return { node: null, nodeId: null };
    }
    
    const entryType = startNode.data?.entryType;
    const hasWebhookEntryType = entryType === 'webhook';
    
    return hasWebhookEntryType ? { node: startNode, nodeId: startNode.id } : { node: null, nodeId: null };
  };

  const { node: startNodeWithWebhook, nodeId: startNodeId } = findStartNodeWithWebhook();
  const hasStartNodeWithWebhook = !!startNodeWithWebhook && !!startNodeId;

  // Get input schema for start node
  const getStartNodeInputSchema = (): any => {
    return startNodeWithWebhook?.data?.inputSchema || null;
  };

  // Get start node label
  const getStartNodeLabel = (): string => {
    if (startNodeWithWebhook) {
      const label = startNodeWithWebhook.data?.label;
      if (typeof label === 'string' && label.trim()) {
        return label.trim();
      }
      return 'Start Node';
    }
    return 'Start Node';
  };

  // Handle opening input modal
  const handleOpenInputModal = () => {
    setShowInputModal(true);
  };

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

      {/* Configure Test Input Button for Webhook Start Node */}
      {hasStartNodeWithWebhook && workflowId && (
        <div className="px-3 py-2 border-b border-blue-200 bg-blue-50">
          <button
            onClick={handleOpenInputModal}
            className="w-full px-3 py-2 text-sm font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors flex items-center justify-center gap-2"
            title="Configure test input for webhook"
          >
            <Database className="w-4 h-4" />
            <span>Configure Test Input</span>
          </button>
        </div>
      )}

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
              edges={edges}
            />
          ))
        )}
      </div>

      {/* Input Schema Form Modal for Start Node */}
      {showInputModal && hasStartNodeWithWebhook && workflowId && startNodeId && (
        <InputSchemaFormModal
          isOpen={showInputModal}
          onClose={() => setShowInputModal(false)}
          schema={getStartNodeInputSchema()}
          workflowId={workflowId}
          nodeId={startNodeId}
          nodeLabel={getStartNodeLabel()}
          initialData={workflowId ? testInputStorage.load(workflowId, startNodeId) : undefined}
        />
      )}
    </div>
  );
}
