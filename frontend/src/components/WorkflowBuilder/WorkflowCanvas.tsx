/**
 * WorkflowCanvas Component (Refactored)
 * 
 * Main canvas component for the workflow builder.
 * This refactored version uses custom hooks for better code organization and maintainability.
 * 
 * Key Features:
 * - Visual workflow editor with drag & drop
 * - Auto-save and auto-layout
 * - Node and edge operations
 * - Execution monitoring
 * - Context menus and modals
 */

import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Node Registry
import { createNodeTypesMap } from './nodeRegistry';

// Edge Types
import { ButtonEdge } from './EdgeTypes/ButtonEdge';
import { LoopEdge } from './EdgeTypes/LoopEdge';

// Components
import { ResizableWorkflowLayout } from './ResizableWorkflowLayout';
import { EdgeContextMenu } from './EdgeContextMenu';

// Custom Hooks
import {
  useAutoSave,
  useAutoLayout,
  useNodeOperations,
  useEdgeHandling,
  useNodeSelector,
  useWorkflowExecution,
  useAgentToolPositioning,
  useUndoRedo,
  useKeyboardShortcuts,
  useClipboard,
} from './hooks';
import { useWorkflowAnimation } from './hooks/useWorkflowAnimation';
import { useSecrets } from './hooks/useSecrets';

// Services & Utils
import { workflowService } from '../../services/workflowService';
import { createSSEConnection, type SSEConnection } from '../../services/sseService';
import { findAllChildNodes, isParentNode, getNodeGroup, findLoopBlockNodes } from '../../utils/nodeGroupingUtils';
import { generateEdgeId } from '../../utils/edgeUtils';
import type { NodeChange } from '@xyflow/react';
import type { EdgeChange } from '@xyflow/react';
import type { WorkflowNode, WorkflowEdge } from '../../types/workflow';
import { computeReconnectForRemovedSet } from './utils/reconnectEdges';
import { expandPositionChangesWithGroupedChildren } from './utils/groupDrag';
import { ENABLE_LAYOUT_LOCK } from '../../utils/layoutLock';

// Constants
import {
  DEFAULT_EDGE_STYLE,
  DEFAULT_EDGE_MARKER,
  FIT_VIEW_PADDING,
  FIT_VIEW_DURATION,
} from './constants';

// ============================================================================
// NODE AND EDGE TYPE DEFINITIONS
// ============================================================================

// Node types are now automatically loaded from the registry
// No manual registration needed - just add to nodeRegistry/nodeMetadata.ts

const edgeTypes = {
  buttonEdge: ButtonEdge,
  loopEdge: LoopEdge,
};

const compareNodesByPosition = (a: Node, b: Node) => {
  const ax = a.position?.x ?? 0;
  const bx = b.position?.x ?? 0;
  if (ax !== bx) {
    return ax - bx;
  }
  const ay = a.position?.y ?? 0;
  const by = b.position?.y ?? 0;
  if (ay !== by) {
    return ay - by;
  }
  return a.id.localeCompare(b.id);
};

export const buildNodeOrderForDebugPanel = (nodes: Node[], edges: Edge[]): Node[] => {
  if (!nodes.length) {
    return [];
  }

  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach(node => {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edges.forEach(edge => {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
      return;
    }
    adjacency.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  const queue: Node[] = nodes
    .filter(node => (inDegree.get(node.id) || 0) === 0)
    .sort(compareNodesByPosition);
  const ordered: Node[] = [];
  const inDegreeCopy = new Map(inDegree);

  while (queue.length > 0) {
    const current = queue.shift()!;
    ordered.push(current);

    const neighbours = adjacency.get(current.id) || [];
    neighbours.forEach(neighbourId => {
      const neighbourNode = nodeMap.get(neighbourId);
      if (!neighbourNode) return;
      const updated = (inDegreeCopy.get(neighbourId) || 0) - 1;
      inDegreeCopy.set(neighbourId, updated);
      if (updated === 0) {
        queue.push(neighbourNode);
        queue.sort(compareNodesByPosition);
      }
    });
  }

  if (ordered.length < nodes.length) {
    const remaining = nodes.filter(node => !ordered.includes(node));
    remaining.sort(compareNodesByPosition);
    ordered.push(...remaining);
  }

  return ordered;
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface WorkflowCanvasProps {
  initialNodes?: WorkflowNode[];
  initialEdges?: WorkflowEdge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onExecute?: () => void;
  workflowId?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WorkflowCanvas({
  initialNodes = [],
  initialEdges = [],
  onSave,
  workflowId,
}: WorkflowCanvasProps) {
  const { fitView } = useReactFlow();
  const { x: viewportX, y: viewportY, zoom } = useViewport();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [nodes, setNodes, onNodesChangeBase] = useNodesState(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState(initialEdges as Edge[]);

  // We keep a thin wrapper so we can extend edge-change behavior in the future if needed.
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChangeBase(changes);
  }, [onEdgesChangeBase]);

  // Wrapper for onNodesChange that handles multi-select delete with grouping support
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // --------------------------------------------------------------------------
    // Group-selection (optional): selecting a parent selects children; selecting a child selects its parent.
    // Keeps multi-select behavior, but expands selection to whole groups.
    // --------------------------------------------------------------------------
    const selectionChanges = changes.filter(c => c.type === 'select') as Array<{ id: string; type: 'select'; selected: boolean }>;
    if (selectionChanges.length > 0) {
      const additionalSelectChanges: Array<{ id: string; type: 'select'; selected: boolean }> = [];
      const alreadyChanged = new Set(selectionChanges.map(c => c.id));

      for (const change of selectionChanges) {
        const node = nodes.find(n => n.id === change.id);
        if (!node) continue;

        if (change.selected) {
          // If a parent is selected, select all children.
          if (isParentNode(node, edges)) {
            const childIds = findAllChildNodes(node.id, node.type, edges, nodes);
            childIds.forEach(childId => {
              if (!alreadyChanged.has(childId)) {
                additionalSelectChanges.push({ id: childId, type: 'select', selected: true });
                alreadyChanged.add(childId);
              }
            });
          }
        } else {
          // If a parent is deselected, deselect all children.
          if (isParentNode(node, edges)) {
            const childIds = findAllChildNodes(node.id, node.type, edges, nodes);
            childIds.forEach(childId => {
              if (!alreadyChanged.has(childId)) {
                additionalSelectChanges.push({ id: childId, type: 'select', selected: false });
                alreadyChanged.add(childId);
              }
            });
          }
        }
      }

      if (additionalSelectChanges.length > 0) {
        changes = [...changes, ...additionalSelectChanges];
      }
    }

    // --------------------------------------------------------------------------
    // Group-drag: moving a parent moves its children by same delta (loops/ifelse/tools).
    // --------------------------------------------------------------------------
    changes = expandPositionChangesWithGroupedChildren(changes, nodes, edges);

    // Find all nodes that are being removed
    const nodesToRemove = new Set<string>();
    
    changes.forEach(change => {
      if (change.type === 'remove') {
        nodesToRemove.add(change.id);
      }
    });

    // If there are nodes to remove, check for parent-child relationships
    if (nodesToRemove.size > 0) {
      const additionalRemovals: NodeChange[] = [];
      const processedParents = new Set<string>();

      nodesToRemove.forEach(nodeId => {
        // Skip if already processed (might be a child of another parent being deleted)
        if (processedParents.has(nodeId)) {
          return;
        }

        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Check if this is a parent node
        if (isParentNode(node, edges)) {
          // Find all children
          const childIds = findAllChildNodes(nodeId, node.type, edges, nodes);
          
          // Add children to removal set (only if not already being removed)
          childIds.forEach(childId => {
            if (!nodesToRemove.has(childId)) {
              nodesToRemove.add(childId);
              additionalRemovals.push({
                id: childId,
                type: 'remove',
              });
            }
          });

          processedParents.add(nodeId);
        }
      });

      // If we found additional children to remove, add them to the changes
      if (additionalRemovals.length > 0) {
        changes = [...changes, ...additionalRemovals];
      }
    }

    // Call the base onNodesChange with all changes (including children)
    onNodesChangeBase(changes);
  }, [nodes, edges, onNodesChangeBase]);

  // Update nodes when initialNodes changes (e.g., workflow loaded from backend)
  React.useEffect(() => {
    // console.log('[WorkflowCanvas] initialNodes changed:', {
    //   count: initialNodes?.length || 0,
    //   nodes: initialNodes?.map(n => ({
    //     id: n.id,
    //     type: n.type,
    //     dataKeys: Object.keys(n.data || {}),
    //     data: n.data,
    //     data_url: n.data?.url
    //   }))
    // });
    if (initialNodes && initialNodes.length > 0) {
      // CRITICAL: Ensure node.data is always an object, not a stringified JSON.
      // This is a safeguard against data corruption from various sources.
      const sanitizedNodes = initialNodes.map(node => {
        if (typeof node.data === 'string') {
          try {
            return { ...node, data: JSON.parse(node.data) };
          } catch (e) {
            console.error(`Failed to parse node.data for node ${node.id}`, e);
            return { ...node, data: {} }; // Fallback to empty object on parse error
          }
        }
        return node;
      });
      setNodes(sanitizedNodes as Node[]);
      // console.log('[WorkflowCanvas] Updated nodes state with sanitized data');
    }
  }, [initialNodes, setNodes]);

  // Update edges when initialEdges changes
  React.useEffect(() => {
    if (initialEdges && initialEdges.length >= 0) {
      setEdges(initialEdges as Edge[]);
    }
  }, [initialEdges, setEdges]);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const lastNodeClickRef = useRef<{ nodeId: string; ts: number } | null>(null);
  
  // SSE connection for real-time events (used for node tests)
  const [sseConnection, setSseConnection] = useState<SSEConnection | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: Node } | null>(null);
  const [edgeContextMenu, setEdgeContextMenu] = useState<{
    x: number;
    y: number;
    edgeId: string;
    sourceNodeId: string;
    targetNodeId: string;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ node: Node } | null>(null);
  
  // Debug panel state
  const [showDebugPanel, setShowDebugPanel] = useState(true); // Set to true for testing
  const [debugSteps, setDebugSteps] = useState<any[]>([]);
  
  // State for single node testing animation
  const [testingNodeId, setTestingNodeId] = useState<string | null>(null);
  const autoDebugEnabled = false; // Disabled by default - user can test nodes manually with play buttons
  
  // State for showing/hiding node overlays
  const [showOverlays, setShowOverlays] = useState(true);

  // Build debug steps - either initial empty steps (if autoDebugEnabled is false) or full steps (if true)
  React.useEffect(() => {
    if (!autoDebugEnabled) {
      // Create initial empty steps for all nodes so they appear in debug panel
      // But preserve existing tested steps (status !== 'pending')
      if (nodes.length) {
        const orderedNodes = buildNodeOrderForDebugPanel(nodes, edges);
        setDebugSteps(prevSteps => {
          // Create a map of existing tested steps (status !== 'pending')
          const testedStepsMap = new Map<string, any>();
          prevSteps.forEach(step => {
            if (step.status !== 'pending') {
              testedStepsMap.set(step.nodeId, step);
            }
          });

          // Create initial steps for all nodes, but keep tested steps
          const initialSteps = orderedNodes.map((node: Node) => {
            // If this node was already tested, keep the tested step
            const existingTestedStep = testedStepsMap.get(node.id);
            if (existingTestedStep) {
              return existingTestedStep;
            }

            // Otherwise create a new pending step
            return {
              nodeId: node.id,
              nodeType: node.type,
              nodeLabel: node.data?.label || undefined,
              status: 'pending' as const,
              input: undefined,
              output: undefined,
              debugInfo: {
                outputPreview: 'Click play button to test this node',
                size: 0,
              },
              startedAt: undefined,
              completedAt: undefined,
              duration: 0,
            };
          });

          // console.log('[WorkflowCanvas] Updating debug steps:', initialSteps.length, 'nodes, preserving', testedStepsMap.size, 'tested steps');
          return initialSteps;
        });
      } else {
        setDebugSteps([]);
      }
      return;
    }

    // If autoDebugEnabled is true, build full debug steps from nodes
    const buildDebugStepsFromNodes = async () => {
      const steps: any[] = [];
      const outputsByNodeId: Record<string, any> = {};

      // Helper to resolve expression fields in a node
      const resolveExpressionFields = async (n: any, context: any) => {
        try {
          // Dynamic import to avoid circular dependency
          const { NODE_FIELD_CONFIG } = await import('./nodeFieldConfig');
          const { transformData } = await import('../../utils/templateEngine');
          
          const fieldConfig = NODE_FIELD_CONFIG[n.type];
          if (!fieldConfig) return n.data || {};

          const resolved: any = {};
          for (const [fieldName, fieldDef] of Object.entries(fieldConfig)) {
            const fieldValue = n.data?.[fieldName];
            if (!fieldValue) continue;

            // Only resolve expression fields
            if (fieldDef.type === 'expression' && typeof fieldValue === 'string' && fieldValue.includes('{{')) {
              try {
                resolved[fieldName] = transformData(context, fieldValue);
              } catch (e: any) {
                resolved[fieldName] = `[Error: ${e.message}]`;
              }
            } else {
              resolved[fieldName] = fieldValue;
            }
          }

          // Merge with non-expression fields
          return { ...n.data, ...resolved };
        } catch (e) {
          console.warn('Failed to resolve expression fields:', e);
          return n.data || {};
        }
      };

      // Helper to estimate realistic duration based on node type
      const estimateDuration = (nodeType: string): number => {
        // Realistic duration estimates in milliseconds for different node types
        const durationMap: Record<string, number> = {
          'start': 5,
          'api': 200, // API calls typically take longer
          'llm': 1500, // LLM calls are usually slowest
          'agent': 1200, // Agent calls also slow
          'web-search': 800,
          'file-search': 300,
          'email': 150,
          'transform': 50,
        };
        return durationMap[nodeType] || 50; // Default duration
      };

      // Helper to create generic step with previews from node.data
      const createGenericStep = (n: any, resolvedData?: any) => {
        const data = resolvedData || n.data || {};
        const dataKeys = Object.keys(data);
        const preview = JSON.stringify(data, null, 2);
        const duration = estimateDuration(n.type);
        const startedAt = new Date().toISOString();
        const completedAt = new Date(Date.now() + duration).toISOString();
        
        return {
          nodeId: n.id,
          nodeType: n.type,
          nodeLabel: n.data?.label || undefined,
          status: 'completed',
          input: undefined,
          output: data,
          debugInfo: {
            inputSchema: undefined,
            outputSchema: { type: 'object', keys: dataKeys, keyCount: dataKeys.length },
            inputPreview: undefined,
            outputPreview: preview,
            dataType: 'object',
            size: preview.length,
          },
          startedAt,
          completedAt,
          duration,
        };
      };

      // Topological order so that upstream outputs are available for downstream nodes
      const indeg: Record<string, number> = {};
      nodes.forEach(n => indeg[n.id] = 0);
      edges.forEach(e => { if (indeg[e.target] !== undefined) indeg[e.target] += 1; });
      const queue: any[] = nodes.filter(n => indeg[n.id] === 0);
      const topo: any[] = [];
      const outAdj: Record<string, string[]> = {};
      nodes.forEach(n => outAdj[n.id] = []);
      edges.forEach(e => outAdj[e.source]?.push(e.target));
      while (queue.length) {
        const n = queue.shift();
        topo.push(n);
        for (const t of outAdj[n.id] || []) {
          indeg[t] -= 1;
          if (indeg[t] === 0) {
            const nodeObj = nodes.find(nn => nn.id === t);
            if (nodeObj) queue.push(nodeObj);
          }
        }
        }
      const ordered = topo.length === nodes.length ? topo : nodes;

      for (const n of ordered) {
        // Skip tool nodes (they are part of Agent node execution, not workflow flow)
        if (n.type === 'tool' || (typeof n.type === 'string' && n.type.startsWith('tool-'))) {
          continue;
        }
        // Start node: simple static output
        if (n.type === 'start') {
          const duration = estimateDuration('start');
          const startedAt = new Date().toISOString();
          const completedAt = new Date(Date.now() + duration).toISOString();
          
          steps.push({
            nodeId: n.id,
            nodeType: n.type,
            nodeLabel: n.data?.label || n.label || undefined,
            status: 'completed',
            input: { message: 'Workflow started' },
            output: { message: 'Workflow started' },
            debugInfo: {
              inputSchema: { type: 'object', keys: ['message'], keyCount: 1 },
              outputSchema: { type: 'object', keys: ['message'], keyCount: 1 },
              inputPreview: '{"message": "Workflow started"}',
              outputPreview: '{"message": "Workflow started"}',
              dataType: 'object',
              size: 32,
            },
            startedAt,
            completedAt,
            duration,
          });
          continue;
        }

        // Default: show configuration as preview for any node type
        // But resolve expression fields first if they exist
        const context: any = { input: {}, steps: {} };
        const incoming = edges.find(e => e.target === n.id);
        if (incoming?.source) {
          const upstreamId = incoming.source;
          context.input = outputsByNodeId[upstreamId] || {};
      }
        // Add all upstream outputs to steps
        for (const [nodeId, output] of Object.entries(outputsByNodeId)) {
          context.steps[nodeId] = output;
        }

        const resolvedData = await resolveExpressionFields(n, context);
        const defStep = createGenericStep(n, resolvedData);
        steps.push(defStep);
        outputsByNodeId[n.id] = resolvedData;
      }

      setDebugSteps(steps);
    };

    buildDebugStepsFromNodes();
  }, [nodes.length, edges.length, autoDebugEnabled]); // Only depend on counts, not the full arrays to avoid unnecessary re-runs

  // Handler to update debug steps when a node is tested via play button
  const handleDebugStepUpdate = useCallback((nodeId: string, updatedStep: any) => {
    setDebugSteps(prevSteps => {
      const existingIndex = prevSteps.findIndex(step => step.nodeId === nodeId);
      if (existingIndex >= 0) {
        // Update existing step
        const newSteps = [...prevSteps];
        newSteps[existingIndex] = updatedStep;
        return newSteps;
      } else {
        // Add new step if it doesn't exist
        return [...prevSteps, updatedStep];
      }
    });
  }, []);

  // Handler to start animation immediately when Play button is clicked
  const handleDebugTestStart = useCallback((nodeId: string, step: any) => {
    // Start animation IMMEDIATELY when Play button is clicked (before backend call)
    // Set testing state to trigger animation
    // This will trigger animation for all nodes from Start to this node
    
    // LOG 1: Workflow-Elemente
    const fullOrder = edges.length > 0 
      ? buildNodeOrderForDebugPanel(nodes, edges)
      : nodes;
    console.log('[Animation] 📋 Workflow-Elemente:', {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      executionOrder: fullOrder.map(n => ({
        id: n.id,
        type: n.type,
        label: n.data?.label || n.type
      })),
      testedNodeId: nodeId,
      testedNodeType: step?.nodeType || 'unknown',
      testedNodeLabel: step?.nodeLabel || step?.nodeType || nodeId
    });
    
    // LOG 2: Welcher Node wurde geklickt
    const clickedNode = nodes.find(n => n.id === nodeId);
    console.log('[Animation] 🖱️ Node geklickt:', {
      nodeId,
      nodeType: step?.nodeType || clickedNode?.type || 'unknown',
      nodeLabel: step?.nodeLabel || clickedNode?.data?.label || nodeId,
      position: clickedNode?.position,
      hasInput: clickedNode?.data?.hasInput,
      hasOutput: clickedNode?.data?.hasOutput
    });
    
    setTestingNodeId(nodeId);
    
    // Create SSE connection for real-time events (if not already connected)
    if (!sseConnection) {
      // Use Gateway (Port 5000) instead of direct service (Port 5002)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const eventsStreamUrl = `${API_URL}/api/events/stream`;
      const sse = createSSEConnection(eventsStreamUrl);
      sse.connect();
      setSseConnection(sse);
    }
    
    // Calculate animation duration based on number of nodes in the path
    // This is a fallback estimate - actual duration comes from SSE events
    // fullOrder is already defined above for LOG 1
    const testNodeIndex = fullOrder.findIndex(n => n.id === nodeId);
    const nodesInPath = testNodeIndex >= 0 ? testNodeIndex + 1 : 1;
    
    // Calculate duration: fast nodes (200ms) + slow nodes (will use real duration from SSE)
    // For node tests with SSE, slow nodes will wait for real events
    // Estimate: 200ms for fast nodes, 1500ms for slow nodes (fallback), plus 1s buffer
    // Count fast vs slow nodes in path
    const fastNodeTypes = ['start', 'end', 'transform'];
    const slowNodeTypes = ['agent', 'llm', 'http-request', 'api', 'email', 'tool'];
    let fastCount = 0;
    let slowCount = 0;
    const pathNodes = fullOrder.slice(0, testNodeIndex + 1);
    pathNodes.forEach(node => {
      if (node.type && fastNodeTypes.includes(node.type)) {
        fastCount++;
      } else if (node.type && slowNodeTypes.includes(node.type)) {
        slowCount++;
      } else {
        slowCount++; // Default to slow
      }
    });
    // Use fallback duration (will be overridden by real SSE events for slow nodes)
    const estimatedDuration = (fastCount * 200) + (slowCount * 1500) + 2000; // Fast nodes + slow nodes (fallback) + buffer
    
    // Debug logging (uncomment to see duration estimates)
    if (false) { // Change to true to enable debug logging
      console.log('[WorkflowCanvas] Animation duration for node test path (fallback):', estimatedDuration, 'ms', 'nodes in path:', nodesInPath);
    }
    
    // Note: SSE connection cleanup is handled in useEffect below
    // We don't disconnect here because the connection might be reused for multiple tests
  }, [nodes, edges, sseConnection]);

  // Cleanup SSE connection when testing completes or component unmounts
  useEffect(() => {
    if (!testingNodeId && sseConnection) {
      // Testing completed - disconnect SSE connection
      // console.log('[WorkflowCanvas] Testing completed, disconnecting SSE connection');
      sseConnection.disconnect();
      setSseConnection(null);
    }
  }, [testingNodeId, sseConnection]);

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (sseConnection) {
        // console.log('[WorkflowCanvas] Component unmounting, cleaning up SSE connection');
        sseConnection.disconnect();
        setSseConnection(null);
      }
    };
  }, [sseConnection]);

  const handleDebugTestResult = useCallback((result: any, originalStep: any) => {
    // This is called AFTER the backend test completes
    // Animation should already be running from handleDebugTestStart
    // console.log('[WorkflowCanvas] Node test result:', result, 'nodeId:', originalStep.nodeId);
    
    // Reset testingNodeId after a longer delay to allow animation to complete
    // This ensures the animation finishes before we reset the state
    // For fast nodes: 200ms timeout + 1000ms additional visibility = 1200ms total
    setTimeout(() => {
      setTestingNodeId(prevTestingNodeId => {
        if (prevTestingNodeId === originalStep.nodeId) {
          // console.log('[WorkflowCanvas] Resetting testingNodeId after test completion');
          return null;
        }
        return prevTestingNodeId; // Keep current value if it changed (new test started)
      });
    }, 1500); // Longer delay to allow animation to complete (200ms + 1000ms + buffer)
    
    // Extract data from response structure: { success: true, data: { output: {...}, execution: {...} } }
    const responseData = result.data || result;
    const execution = responseData.execution || result.execution;
    
    // Update debug steps with test result
    setDebugSteps(prevSteps => {
      return prevSteps.map(step => {
        if (step.nodeId === originalStep.nodeId) {
          // Get output from responseData.output (NodeData format: { json, metadata })
          const outputPayload = responseData.output || result.output;
          return {
            ...step,
            status: responseData.success !== false ? 'completed' : 'failed',
            input: execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.input || responseData.input || result.input || step.input,
            output: outputPayload, // NodeData: { json, metadata }
            error: responseData.error || result.error || step.error,
            duration: execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.duration || responseData.duration || result.duration || step.duration,
            startedAt: execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.timestamp || responseData.timestamp || result.timestamp || new Date().toISOString(),
            completedAt: execution?.trace?.find((t: any) => t.nodeId === step.nodeId)?.timestamp || responseData.timestamp || result.timestamp || new Date().toISOString(),
            debugInfo: {
              ...step.debugInfo,
              outputPreview: JSON.stringify(outputPayload || {}, null, 2),
              size: JSON.stringify(outputPayload || {}).length,
            },
          };
        }
        return step;
      });
    });
    
    // Process the trace from the backend and update all relevant steps
    if (execution?.trace && Array.isArray(execution.trace)) {
      setDebugSteps(prevSteps => {
        const newStepsMap = new Map<string, any>();
        
        // Create a map of existing steps
        const existingStepsMap = new Map(prevSteps.map(step => [step.nodeId, step]));
        
        // Process each trace entry
        execution.trace.forEach((traceEntry: any) => {
          const existingStep = existingStepsMap.get(traceEntry.nodeId);
          const outputPayload = traceEntry.output;
          const outputPreview = outputPayload !== undefined 
            ? JSON.stringify(outputPayload, null, 2) 
            : existingStep?.debugInfo?.outputPreview || '';

          const derivedStep = {
            nodeId: traceEntry.nodeId || existingStep?.nodeId || originalStep.nodeId,
            nodeType: existingStep?.nodeType || traceEntry.type || originalStep.nodeType,
            nodeLabel: existingStep?.nodeLabel || originalStep.nodeLabel,
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
              size: outputPreview.length,
            },
          };
          
          newStepsMap.set(derivedStep.nodeId, derivedStep);
        });

        // Update existing steps and add new ones
        const updatedSteps = prevSteps.map(step => newStepsMap.get(step.nodeId) || step);
        newStepsMap.forEach(newStep => {
          if (!updatedSteps.some(s => s.nodeId === newStep.nodeId)) {
            updatedSteps.push(newStep);
          }
        });

        return updatedSteps;
      });
    } else {
      // Fallback: update single step
      const outputPayload = responseData.output || result.output;
      handleDebugStepUpdate(originalStep.nodeId, {
        ...originalStep,
        status: responseData.success !== false ? 'completed' : 'failed',
        input: responseData.input || result.input || originalStep.input,
        output: outputPayload, // NodeData: { json, metadata }
        error: responseData.error || result.error || originalStep.error,
        duration: responseData.duration || result.duration || originalStep.duration,
        startedAt: responseData.timestamp || result.timestamp || new Date().toISOString(),
        completedAt: responseData.timestamp || result.timestamp || new Date().toISOString(),
        debugInfo: {
          ...originalStep.debugInfo,
          outputPreview: JSON.stringify(outputPayload || {}, null, 2),
          size: JSON.stringify(outputPayload || {}, null, 2).length,
        },
      });
    }
  }, [handleDebugStepUpdate, testingNodeId]);

  // ============================================================================
  // CUSTOM HOOKS
  // ============================================================================

  // Auto-save hook
  const { autoSaving, manualSave, triggerImmediateSave } = useAutoSave({
    workflowId,
    nodes,
    edges,
    onSave: onSave ? async (nodes, edges) => { await onSave(nodes, edges); } : undefined,
  });

  // Auto-layout hook
  const { enabled: autoLayoutEnabled, toggleEnabled: toggleAutoLayout, applyLayout } = useAutoLayout({
    nodes,
    edges,
    onNodesChange: setNodes,
    onEdgesChange: setEdges,
  });

  const hasLayoutLocks = useMemo(() => {
    if (!ENABLE_LAYOUT_LOCK) return false;
    return nodes.some(n => Boolean((n.data as any)?.layoutLocked));
  }, [nodes]);

  const unlockAllLayoutLocks = useCallback(() => {
    if (!ENABLE_LAYOUT_LOCK) return;
    setNodes(prev =>
      prev.map(n => {
        if (!Boolean((n.data as any)?.layoutLocked)) return n;
        return { ...n, data: { ...n.data, layoutLocked: false } };
      })
    );
    triggerImmediateSave();
  }, [setNodes, triggerImmediateSave]);

  // Node selector hook
  const {
    popup: nodeSelectorPopup,
    combinedPopup,
    openPopupBetweenNodes,
    openPopupFromOutput,
    selectNodeType,
    selectApiEndpoint,
    closePopup: closeNodeSelector,
    closeCombinedPopup,
  } = useNodeSelector({
    nodes,
    edges,
    onNodesChange: setNodes,
    onEdgesChange: setEdges,
    autoLayoutEnabled,
  });
  
  // Create a ref for default edge options (used when connecting nodes manually)
  const addNodeCallbackRef = useCallback((edgeId: string, source: string, target: string) => {
    openPopupBetweenNodes(edgeId, source, target);
  }, [openPopupBetweenNodes]);

  // Node operations hook
  const { addNode, deleteNode, duplicateNode, updateNode } = useNodeOperations({
    nodes,
    edges,
    workflowId,
    onNodesChange: setNodes,
    onEdgesChange: setEdges,
    onAddNodeCallback: openPopupBetweenNodes,
    deleteNodeFromBackend: workflowService.deleteNode,
  });

  // Handle comment updates from node overlay
  const handleUpdateComment = useCallback((nodeId: string, comment: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      updateNode(nodeId, {
        ...node.data,
        comment,
      });
    }
  }, [nodes, updateNode]);

  // Edge handling hook
  const { handleConnect } = useEdgeHandling({
    nodes,
    edges,
    onEdgesChange: setEdges,
    onAddNodeCallback: openPopupBetweenNodes,
  });

  // Agent tool positioning hook - maintains relative positions when agent moves
  useAgentToolPositioning({
    nodes,
    edges,
    onNodesChange: setNodes,
  });

  // Clipboard hook
  const {
    copyNodes,
    cutNodes,
    pasteNodes,
    pasteNodesBetween,
    hasClipboardData,
  } = useClipboard({
    nodes,
    edges,
    onNodesChange: setNodes,
    onEdgesChange: setEdges,
  });

  // Keep latest edges in a ref so callbacks can be stable (important for edge.data function injection)
  const edgesRef = useRef<Edge[]>(edges);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const handleOpenEdgePasteMenu = useCallback(
    ({ edgeId, sourceNode, targetNode, x, y }: { edgeId: string; sourceNode: string; targetNode: string; x: number; y: number }) => {
      setSelectedEdge(edgesRef.current.find(e => e.id === edgeId) || null);
      setEdgeContextMenu({
        x,
        y,
        edgeId,
        sourceNodeId: sourceNode,
        targetNodeId: targetNode,
      });
    },
    []
  );

  // Ensure ButtonEdge always has the context-menu callbacks available via edge.data
  // (existing edges from DB or edges normalized by useEdgeHandling may not include these).
  useEffect(() => {
    const needsEnhancement = edges.some(
      edge =>
        edge.type === 'buttonEdge' &&
        (typeof (edge.data as any)?.onOpenPasteMenu !== 'function' || typeof (edge.data as any)?.hasClipboardData !== 'function')
    );

    if (!needsEnhancement) return;

    setEdges(prevEdges =>
      prevEdges.map(edge => {
        if (edge.type !== 'buttonEdge') return edge;
        const data = (edge.data ?? {}) as any;
        return {
          ...edge,
          data: {
            ...data,
            onOpenPasteMenu: data.onOpenPasteMenu ?? handleOpenEdgePasteMenu,
            hasClipboardData: data.hasClipboardData ?? hasClipboardData,
          },
        };
      })
    );
  }, [edges, setEdges, handleOpenEdgePasteMenu, hasClipboardData]);

  // Undo/Redo hook
  const { 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    clearHistory, 
    initializeHistory,
    getUndoActionDescription,
    getRedoActionDescription,
  } = useUndoRedo({
    nodes,
    edges,
    onNodesChange: setNodes,
    onEdgesChange: setEdges,
    enabled: true,
  });

  // Initialize history when workflow loads (only once per workflow)
  const workflowIdRef = useRef<string | undefined>(workflowId);
  const historyInitializedRef = useRef(false);
  
  useEffect(() => {
    // If workflow changed, clear and reinitialize
    if (workflowId !== workflowIdRef.current) {
      workflowIdRef.current = workflowId;
      historyInitializedRef.current = false;
      clearHistory();
    }
    
    // Initialize after nodes are loaded (only once per workflow)
    // Check both nodes.length and that nodes array is actually populated
    if (nodes.length > 0 && !historyInitializedRef.current) {
      console.log('[WorkflowCanvas] Preparing to initialize history', {
        nodesCount: nodes.length,
        edgesCount: edges.length,
        workflowId,
        firstNodeId: nodes[0]?.id,
      });
      
      historyInitializedRef.current = true;
      
      // Initialize immediately, no delay needed
      console.log('[WorkflowCanvas] Initializing undo/redo history NOW', {
        nodesCount: nodes.length,
        edgesCount: edges.length,
        workflowId,
      });
      initializeHistory();
    } else if (nodes.length === 0 && historyInitializedRef.current) {
      // If nodes become empty, reset initialization flag
      historyInitializedRef.current = false;
    }
  }, [workflowId, nodes.length, edges.length, clearHistory, initializeHistory, nodes]);

  // Keyboard shortcuts - centralized management
  useKeyboardShortcuts({
    enabled: true,
    shortcuts: {
      // Delete/Backspace: custom delete to preserve linear chains (reconnect prev -> next)
      delete: () => {
        const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
        if (selectedNodeIds.length === 0) return;

        const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
        const idsToRemove = new Set<string>(selectedNodeIds);
        for (const node of selectedNodes) {
          const childIds = findAllChildNodes(node.id, node.type, edges, nodes);
          childIds.forEach(id => idsToRemove.add(id));
        }

        const reconnect = computeReconnectForRemovedSet(edges, idsToRemove);

        const remainingNodes = nodes
          .filter(n => !idsToRemove.has(n.id))
          .map(n => ({ ...n, selected: false }));

        const remainingEdges = edges.filter(e => !idsToRemove.has(e.source) && !idsToRemove.has(e.target));
        const updatedEdges = reconnect
          ? [
              ...remainingEdges,
              {
                id: generateEdgeId(reconnect.source, reconnect.target),
                source: reconnect.source,
                target: reconnect.target,
                type: 'buttonEdge',
                data: {},
              } as Edge,
            ]
          : remainingEdges;

        setNodes(remainingNodes);
        setEdges(updatedEdges);

        setSelectedNode(null);
        setShowConfigPanel(false);
        setSelectedEdge(null);
        setContextMenu(null);
        setEdgeContextMenu(null);
      },
      backspace: () => {
        // same behavior as delete (but still blocked in input fields by useKeyboardShortcuts)
        const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
        if (selectedNodeIds.length === 0) return;

        const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
        const idsToRemove = new Set<string>(selectedNodeIds);
        for (const node of selectedNodes) {
          const childIds = findAllChildNodes(node.id, node.type, edges, nodes);
          childIds.forEach(id => idsToRemove.add(id));
        }

        const reconnect = computeReconnectForRemovedSet(edges, idsToRemove);

        const remainingNodes = nodes
          .filter(n => !idsToRemove.has(n.id))
          .map(n => ({ ...n, selected: false }));

        const remainingEdges = edges.filter(e => !idsToRemove.has(e.source) && !idsToRemove.has(e.target));
        const updatedEdges = reconnect
          ? [
              ...remainingEdges,
              {
                id: generateEdgeId(reconnect.source, reconnect.target),
                source: reconnect.source,
                target: reconnect.target,
                type: 'buttonEdge',
                data: {},
              } as Edge,
            ]
          : remainingEdges;

        setNodes(remainingNodes);
        setEdges(updatedEdges);

        setSelectedNode(null);
        setShowConfigPanel(false);
        setSelectedEdge(null);
        setContextMenu(null);
        setEdgeContextMenu(null);
      },
      enter: () => {
        if (selectedNode) {
          setShowConfigPanel(true);
          setContextMenu(null);
          setEdgeContextMenu(null);
        }
      },
      'ctrl+z': () => {
        if (canUndo) undo();
      },
      'ctrl+shift+z': () => {
        if (canRedo) redo();
      },
      'ctrl+y': () => {
        if (canRedo) redo();
      },
      // Copy/Paste shortcuts
      'ctrl+c': () => {
        const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
        if (selectedNodeIds.length > 0) {
          copyNodes(selectedNodeIds);
        }
      },
      'ctrl+x': () => {
        const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
        if (selectedNodeIds.length > 0) {
          cutNodes(selectedNodeIds);
          setSelectedNode(null);
          setShowConfigPanel(false);
          setSelectedEdge(null);
          setContextMenu(null);
          setEdgeContextMenu(null);
        }
      },
      'ctrl+v': () => {
        if (!hasClipboardData()) return;
        
        // Check if an edge is selected (for paste-between)
        if (selectedEdge) {
          pasteNodesBetween(
            selectedEdge.source,
            selectedEdge.target,
            selectedEdge.id
          );
          setSelectedEdge(null); // Clear selection after paste
        } else {
          // Paste on canvas - use viewport center
          // Calculate viewport center in flow coordinates
          // Formula: flowX = (screenX - viewportX) / zoom
          const viewportCenter = {
            x: (window.innerWidth / 2 - viewportX) / zoom,
            y: (window.innerHeight / 2 - viewportY) / zoom,
          };
          pasteNodes(viewportCenter);
        }
      },
    },
    shouldDisable: () => {
      // Disable shortcuts when modals are open
      return showConfigPanel || contextMenu !== null || edgeContextMenu !== null || deleteModal !== null;
    },
  });

  // Workflow execution hook
  const {
    executing,
    publishing,
    currentExecutionId,
    showExecutionMonitor,
    execute,
    publish,
    closeExecutionMonitor,
  } = useWorkflowExecution({ workflowId });

  // Use executing for animation, and convert debugSteps to executionSteps format
  // Also support single node testing animation
  // MUST be declared after executing is available, but before useEffect that uses it (line 599)
  const isExecuting = executing || testingNodeId !== null;

  // Update debugSteps in real-time based on SSE events (like Activepieces updates run.steps)
  useEffect(() => {
    if (!sseConnection || !isExecuting) {
      return;
    }

    // Track animation start times for duration calculation
    const nodeAnimationStartTimes = new Map<string, number>();

    const handleNodeStart = (event: any) => {
      const nodeId = event.data?.node_id || event.data?.nodeId;
      if (!nodeId) return;

      // LOG 3: Animation start - track start time
      const startTime = Date.now();
      nodeAnimationStartTimes.set(nodeId, startTime);
      
      const nodeLabel = event.data?.nodeLabel || event.data?.node_label || nodeId;
      console.log(`[Animation] ▶️ Node-Animation gestartet: ${nodeLabel} (${nodeId})`, {
        nodeId,
        nodeType: event.data?.nodeType || event.data?.node_type || 'unknown',
        nodeLabel,
        startTime: new Date(startTime).toISOString(),
        timestamp: startTime
      });

      // Update debugSteps in real-time - mark node as 'running'
      setDebugSteps(prevSteps => {
        const existingIndex = prevSteps.findIndex(step => step.nodeId === nodeId);
        if (existingIndex >= 0) {
          // Update existing step
          const newSteps = [...prevSteps];
          newSteps[existingIndex] = {
            ...newSteps[existingIndex],
            status: 'running',
            startedAt: event.data?.startedAt || new Date().toISOString(),
          };
          return newSteps;
        } else {
          // Add new step if it doesn't exist
          return [...prevSteps, {
            nodeId,
            nodeType: event.data?.nodeType || event.data?.node_type || 'unknown',
            nodeLabel: event.data?.nodeLabel || event.data?.node_label,
            status: 'running',
            startedAt: event.data?.startedAt || new Date().toISOString(),
            completedAt: null,
            duration: 0,
          }];
        }
      });
    };

    const handleNodeEnd = (event: any) => {
      const nodeId = event.data?.node_id || event.data?.nodeId;
      if (!nodeId) return;

      // LOG 3: Animation end - calculate duration
      const endTime = Date.now();
      const startTime = nodeAnimationStartTimes.get(nodeId);
      const animationDuration = startTime ? endTime - startTime : event.data?.duration || 0;
      
      // Clean up start time
      if (startTime) {
        nodeAnimationStartTimes.delete(nodeId);
      }
      
      const nodeLabel = event.data?.nodeLabel || event.data?.node_label || nodeId;
      console.log(`[Animation] ⏹️ Node-Animation beendet: ${nodeLabel} (${nodeId})`, {
        nodeId,
        nodeType: event.data?.nodeType || event.data?.node_type || 'unknown',
        nodeLabel,
        animationDuration: `${animationDuration}ms`,
        backendDuration: event.data?.duration ? `${event.data.duration}ms` : 'N/A',
        endTime: new Date(endTime).toISOString(),
        timestamp: endTime
      });

      // Update debugSteps in real-time - mark node as 'completed'
      setDebugSteps(prevSteps => {
        const existingIndex = prevSteps.findIndex(step => step.nodeId === nodeId);
        if (existingIndex >= 0) {
          // Update existing step
          const newSteps = [...prevSteps];
          newSteps[existingIndex] = {
            ...newSteps[existingIndex],
            status: 'completed',
            output: event.data?.output,
            completedAt: event.data?.completedAt || new Date().toISOString(),
            duration: event.data?.duration || 0,
          };
          return newSteps;
        } else {
          // Add new step if it doesn't exist
          return [...prevSteps, {
            nodeId,
            nodeType: event.data?.nodeType || event.data?.node_type || 'unknown',
            nodeLabel: event.data?.nodeLabel || event.data?.node_label,
            status: 'completed',
            output: event.data?.output,
            startedAt: event.data?.startedAt || new Date().toISOString(),
            completedAt: event.data?.completedAt || new Date().toISOString(),
            duration: event.data?.duration || 0,
          }];
        }
      });
    };

    // Register SSE event handlers
    sseConnection.on('node.start', handleNodeStart);
    sseConnection.on('node.end', handleNodeEnd);

    return () => {
      // Cleanup handlers (SSE connection handles cleanup on disconnect)
    };
  }, [sseConnection, isExecuting]);

  // Load secrets for validation
  const { secrets: allSecrets } = useSecrets();
  // Convert to simplified format for node components
  const secrets = allSecrets.map(s => ({ key: s.name, isActive: s.isActive }));

  const executionSteps = useMemo(() => {
    // Convert debugSteps to executionSteps format for animation
    return debugSteps.map(step => ({
      nodeId: step.nodeId,
      status: step.status || 'pending',
      nodeType: step.nodeType,
      nodeLabel: step.nodeLabel,
      input: step.input,
      output: step.output,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      duration: step.duration,
    }));
  }, [debugSteps, isExecuting]);

  // Update debug steps when executing
  React.useEffect(() => {
    if (executing) {
      // Show live execution steps
      setDebugSteps([
        {
          nodeId: 'start',
          nodeType: 'start',
          status: 'running',
          input: { message: 'Workflow started' },
          output: null,
          debugInfo: {
            inputSchema: { type: 'object', keys: ['message'], keyCount: 1 },
            outputSchema: null,
            inputPreview: '{"message": "Workflow started"}',
            outputPreview: 'Executing...',
            dataType: 'object',
            size: 32
          },
          startedAt: new Date().toISOString(),
          completedAt: null,
          duration: 0
        }
      ]);
    }
  }, [executing]);


  // Simplified workflow animation - status-based (like Activepieces)
  // executionSteps wird in Echtzeit aktualisiert durch SSE-Events oben
  const { currentAnimatedNodeId, isNodeAnimating } = useWorkflowAnimation({
    executionSteps,
    isExecuting,
  });

  // Debug log for animation state
  useEffect(() => {
    // console.log('[WorkflowCanvas] Animation state:', {
    //   isExecuting,
    //   executing, // Also log the original executing state
    //   currentAnimatedNodeId,
    //   executionStepsCount: executionSteps.length,
    //   nodesCount: nodes.length,
    //   debugStepsCount: debugSteps.length,
    // });
  }, [isExecuting, executing, currentAnimatedNodeId, executionSteps.length, nodes.length, debugSteps.length]);

  // Get node types from registry (automatically includes all registered nodes)
  // Memoize with stable reference to avoid React Flow warnings
  const nodeTypes = useMemo(() => {
    const types = createNodeTypesMap(isExecuting, executionSteps, currentAnimatedNodeId, handleUpdateComment, secrets, showOverlays, isNodeAnimating);
    // Return a stable reference
    return types;
  }, [isExecuting, executionSteps.length, currentAnimatedNodeId, handleUpdateComment, secrets, showOverlays, isNodeAnimating]);

  // Calculate which nodes need add-node buttons
  const nodesWithAddButtons = useMemo(() => {
    const result: Array<{ nodeId: string; sourceHandle?: string }> = [];
    
    // Helper: Check if a specific handle has an outgoing edge
    const hasEdgeFromHandle = (nodeId: string, handleId?: string) => {
      return edges.some(
        e => e.source === nodeId && (handleId ? e.sourceHandle === handleId : !e.sourceHandle)
      );
    };
    
    nodes.forEach(node => {
      // Skip End nodes (no outputs)
      if (node.type === 'end') return;

      // Skip tool nodes, they shouldn't have an add button
      if (node.type?.startsWith('tool')) return;
      
      // Special handling for loop nodes (while and foreach) - check loop handles
      if (node.type === 'while' || node.type === 'foreach') {
        // Check default output
        if (!hasEdgeFromHandle(node.id)) {
          result.push({ nodeId: node.id });
        }
        
        // Check loop handle
        if (!hasEdgeFromHandle(node.id, 'loop')) {
          result.push({ nodeId: node.id, sourceHandle: 'loop' });
        }
        
        // Note: 'back' is a target handle, so we don't add a button for it
        // The loop-back edge will be created automatically when connecting to it
      } else {
        // Handle all other nodes - check default output
        if (!hasEdgeFromHandle(node.id)) {
          result.push({ nodeId: node.id });
        }
      }
    });
    
    return result;
  }, [nodes, edges]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Add node with auto-save
  const handleAddNode = useCallback((type: string) => {
    const node = addNode(type);
    if (node) {
      triggerImmediateSave();
    }
  }, [addNode, triggerImmediateSave]);

  // Delete node with auto-save
  const handleDeleteNode = useCallback(async (nodeId: string) => {
    await deleteNode(nodeId);
    triggerImmediateSave();
  }, [deleteNode, triggerImmediateSave]);

  // Duplicate node with auto-save
  const handleDuplicateNode = useCallback((node: Node) => {
    duplicateNode(node);
    triggerImmediateSave();
  }, [duplicateNode, triggerImmediateSave]);

  // Node click handler
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Check if Ctrl/Cmd is pressed (Multi-Select mode)
    const isMultiSelect = event.ctrlKey || event.metaKey;
    
    // Always get the latest node from the nodes state to ensure we have the latest data
    const latestNode = nodes.find(n => n.id === node.id) || node;
    
    if (isMultiSelect) {
      // Multi-Select mode: Don't open config panel, just toggle selection
      // React Flow handles the selection state automatically
      setContextMenu(null);
      // Don't open config panel in multi-select mode
      return;
    }
    
    // Single-Select mode:
    // - Click = selection (no auto-open)
    // - Double-click = configure
    //
    // NOTE: We detect double-click here via event.detail because ReactFlow's onNodeDoubleClick
    // doesn't always fire unless the node was already selected (browser/interaction quirks).
    const now = Date.now();
    const last = lastNodeClickRef.current;
    const isDoubleClick = event.detail >= 2 || (last?.nodeId === latestNode.id && now - last.ts < 350);
    lastNodeClickRef.current = { nodeId: latestNode.id, ts: now };

    setSelectedNode(latestNode);
    setContextMenu(null);

    if (isDoubleClick) {
      setShowConfigPanel(true);
    }
    // Don't close debug panel when opening config panel
  }, [nodes]);

  // Node double-click handler: explicit "configure"
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const latestNode = nodes.find(n => n.id === node.id) || node;
    setSelectedNode(latestNode);
    setShowConfigPanel(true);
    setContextMenu(null);
  }, [nodes]);

  // Node context menu handler
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, node });
  }, []);

  // Edge click handler (for paste-between functionality)
  const handleEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    // Select edge for paste-between functionality
    setSelectedEdge(edge);
    setEdgeContextMenu(null);
    // Deselect all nodes when edge is clicked
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({ ...node, selected: false }))
    );
  }, [setNodes]);

  // Pane click handler (close panels and deselect nodes)
  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
    setEdgeContextMenu(null);
    setShowConfigPanel(false);
    setSelectedNode(null);
    setSelectedEdge(null); // Also deselect edge
    
    // Deselect all nodes (React Flow handles this via onNodesChange)
    // We need to explicitly deselect all nodes
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({ ...node, selected: false }))
    );
  }, [setNodes]);

  // Close config panel
  const handleCloseConfigPanel = useCallback(() => {
    setShowConfigPanel(false);
    setSelectedNode(null);
  }, []);

  // Fit view to canvas
  const handleFitView = useCallback(() => {
    fitView({ padding: FIT_VIEW_PADDING, duration: FIT_VIEW_DURATION });
  }, [fitView]);

  // Suppress phantom edge warnings (these are intentional UI elements, not real edges)
  const handleReactFlowError = useCallback((errorCode: string, errorMessage: string) => {
    // Suppress error 008: "Couldn't create edge for target handle id"
    // This happens for phantom edges (+ buttons) which don't have real handles
    if (errorCode === '008' && errorMessage.includes('phantom-')) {
      return; // Silently ignore phantom edge handle warnings
    }
    // Suppress error 002: "It looks like you've created a new nodeTypes or edgeTypes object"
    // This is a false positive - nodeTypes is properly memoized with useMemo
    if (errorCode === '002' && errorMessage.includes('nodeTypes')) {
      return; // Silently ignore - nodeTypes is memoized and stable
    }
    // Log other errors normally
    console.error(`[React Flow Error ${errorCode}]:`, errorMessage);
  }, []);

  // ============================================================================
  // TESTING: Node Grouping Utilities (temporary - for testing)
  // ============================================================================
  // Expose test function to window for console testing
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testNodeGrouping = () => {
        console.log('🧪 Testing nodeGroupingUtils with current workflow...');
        console.log(`📊 Total nodes: ${nodes.length}, Total edges: ${edges.length}`);
        
        // Test 1: Find all parent nodes
        console.log('\n1️⃣ Testing isParentNode()...');
        const parentNodes = nodes.filter(node => isParentNode(node, edges));
        console.log(`Found ${parentNodes.length} parent nodes:`, parentNodes.map(n => `${n.type} (${n.id})`));
        
        // Test 2: For each parent, find children
        console.log('\n2️⃣ Testing findAllChildNodes()...');
        for (const parent of parentNodes) {
          const childIds = findAllChildNodes(parent.id, parent.type, edges, nodes);
          if (childIds.length > 0) {
            console.log(`  ${parent.type} (${parent.id}):`, childIds);
            const childNodes = nodes.filter(n => childIds.includes(n.id));
            console.log(`    Children:`, childNodes.map(n => `${n.type} (${n.id})`));
          }
        }
        
        // Test 3: Test getNodeGroup
        console.log('\n3️⃣ Testing getNodeGroup()...');
        for (const parent of parentNodes) {
          const group = getNodeGroup(parent.id, parent.type, edges, nodes);
          if (group.childIds.length > 0) {
            console.log(`  Group for ${parent.type} (${parent.id}):`, {
              parent: group.parentId,
              children: group.childIds,
              all: group.allIds,
            });
          }
        }
        
        // Test 4: Specific test for ForEach node (from your logs)
        const forEachNodes = nodes.filter(n => n.type === 'foreach');
        if (forEachNodes.length > 0) {
          console.log('\n4️⃣ Testing ForEach Loop-Block...');
          forEachNodes.forEach(forEachNode => {
            const loopBlock = findLoopBlockNodes(forEachNode.id, edges);
            console.log(`  ForEach (${forEachNode.id}): ${loopBlock.length} nodes in loop block`, loopBlock);
            const loopBlockNodes = nodes.filter(n => loopBlock.includes(n.id));
            console.log(`    Loop block nodes:`, loopBlockNodes.map(n => `${n.type} (${n.id})`));
          });
        }
        
        console.log('\n✅ Test completed!');
        return { parentNodes, nodes, edges };
      };
      
      console.log('💡 Test function available: window.testNodeGrouping()');
    }
  }, [nodes, edges]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
    <ResizableWorkflowLayout
      // Canvas props
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      onNodeClick={handleNodeClick}
      onNodeDoubleClick={handleNodeDoubleClick}
      onNodeContextMenu={handleNodeContextMenu}
      onEdgeClick={handleEdgeClick}
      onPaneClick={handlePaneClick}
      onError={handleReactFlowError}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={{
        animated: false,
        // Don't set a default type - let useEdgeHandling determine it based on connection
        style: DEFAULT_EDGE_STYLE,
        markerEnd: { ...DEFAULT_EDGE_MARKER },
        data: { 
          onAddNode: addNodeCallbackRef,
          onOpenPasteMenu: ({ edgeId, sourceNode, targetNode, x, y }: { edgeId: string; sourceNode: string; targetNode: string; x: number; y: number }) => {
            setSelectedEdge(edges.find(e => e.id === edgeId) || null);
            setEdgeContextMenu({
              x,
              y,
              edgeId,
              sourceNodeId: sourceNode,
              targetNodeId: targetNode,
            });
          },
          hasClipboardData: hasClipboardData,
        },
      }}
      nodesWithAddButtons={nodesWithAddButtons}
      
      // Panel states
      showDebugPanel={showDebugPanel}
      showConfigPanel={showConfigPanel}
      selectedNode={selectedNode}
      contextMenu={contextMenu}
      deleteModal={deleteModal}
      showExecutionMonitor={showExecutionMonitor}
      currentExecutionId={currentExecutionId}
      nodeSelectorPopup={nodeSelectorPopup}
      combinedPopup={combinedPopup}
      onSelectNode={selectNodeType}
      onSelectApiEndpoint={selectApiEndpoint}
      onCloseCombinedPopup={closeCombinedPopup}
      
      // Debug panel props
      debugSteps={debugSteps}
      onDebugStepUpdate={handleDebugStepUpdate}
      onDebugTestResult={handleDebugTestResult}
      onDebugTestStart={handleDebugTestStart}
      
      // Toolbar props
      onAddNode={handleAddNode}
      onSave={manualSave}
      onExecute={execute}
      onPublish={publish}
      onAutoLayout={applyLayout}
      autoLayoutEnabled={autoLayoutEnabled}
      onToggleAutoLayout={toggleAutoLayout}
      hasLayoutLocks={hasLayoutLocks}
      onUnlockAllLayoutLocks={ENABLE_LAYOUT_LOCK ? unlockAllLayoutLocks : undefined}
      onFitView={handleFitView}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      undoDescription={getUndoActionDescription()}
      redoDescription={getRedoActionDescription()}
      onToggleDebug={() => {
        setShowDebugPanel(!showDebugPanel);
        // Allow both panels to be open simultaneously
      }}
      showOverlays={showOverlays}
      onToggleOverlays={() => setShowOverlays(!showOverlays)}
      saving={false}
      executing={executing}
      autoSaving={autoSaving}
      publishing={publishing}
      
      // Node operations
      onUpdateNode={updateNode}
      onDeleteNode={handleDeleteNode}
      onDuplicateNode={handleDuplicateNode}
      onSelectNodeType={selectNodeType}
      onOpenPopupFromOutput={openPopupFromOutput}
      onCloseNodeSelector={closeNodeSelector}
      onCloseConfigPanel={handleCloseConfigPanel}
      onCloseExecutionMonitor={closeExecutionMonitor}
      
      // Modal handlers
      onSetContextMenu={setContextMenu}
      onSetDeleteModal={setDeleteModal}
      onSetSelectedNode={setSelectedNode}
      onSetShowConfigPanel={setShowConfigPanel}
      
      // Workflow props
      workflowId={workflowId}
    />
    {edgeContextMenu && (
      <EdgeContextMenu
        x={edgeContextMenu.x}
        y={edgeContextMenu.y}
        canPaste={hasClipboardData()}
        onPaste={() => {
          pasteNodesBetween(edgeContextMenu.sourceNodeId, edgeContextMenu.targetNodeId, edgeContextMenu.edgeId);
          setSelectedEdge(null);
          setEdgeContextMenu(null);
        }}
        onClose={() => setEdgeContextMenu(null)}
      />
    )}
    </>
  );
}

