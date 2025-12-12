// @ts-nocheck
import { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { 
  StartNode, EndNode, AgentNode, LLMNode, IfElseNode, APINode, NoteNode,
  FileSearchNode, GuardrailsNode, MCPNode, UserApprovalNode, SetStateNode, WebSearchNode, DocumentUploadNode, ImageGenerationNode, TextToSpeechNode, SpeechToTextNode, CodeInterpreterNode, EmailNode, DatabaseQueryNode, TransformNode
} from './NodeTypes';
import { Toolbar } from './Toolbar';
import { NodeConfigPanel } from './NodeConfigPanel';
import { NodeContextMenu } from './NodeContextMenu';
import { DeleteNodeModal } from './DeleteNodeModal';
import { ExecutionMonitor } from '../ExecutionMonitor/ExecutionMonitor';
import { NodeSelectorPopup } from './NodeSelectorPopup';
import { ButtonEdge } from './EdgeTypes/ButtonEdge';
import { PhantomAddButtonEdge } from './EdgeTypes/PhantomAddButtonEdge';
import { workflowService } from '../../services/workflowService';
import type { WorkflowNode, WorkflowEdge } from '../../types/workflow';
import { applyVerticalLayout } from '../../utils/autoLayout';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  agent: AgentNode,
  llm: LLMNode,
  ifelse: IfElseNode,
  // tool: ToolNode, // Tools now use separate ToolNodeComponent
  api: APINode,
  note: NoteNode,
  'file-search': FileSearchNode,
  guardrails: GuardrailsNode,
  mcp: MCPNode,
  'user-approval': UserApprovalNode,
  'set-state': SetStateNode,
  'web-search': WebSearchNode,
  'document-upload': DocumentUploadNode,
  'image-generation': ImageGenerationNode,
  'text-to-speech': TextToSpeechNode,
  'speech-to-text': SpeechToTextNode,
  'code-interpreter': CodeInterpreterNode,
  'email': EmailNode,
  'database-query': DatabaseQueryNode,
  'transform': TransformNode,
};

const edgeTypes = {
  buttonEdge: ButtonEdge,
  phantomAddButton: PhantomAddButtonEdge,
};

interface WorkflowCanvasProps {
  initialNodes?: WorkflowNode[];
  initialEdges?: WorkflowEdge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onExecute?: () => void;
  workflowId?: string;
}

export function WorkflowCanvas({ 
  initialNodes = [], 
  initialEdges = [],
  onSave,
  onExecute,
  workflowId
}: WorkflowCanvasProps) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges as Edge[]);
  
  // Update nodes when initialNodes changes (e.g., workflow loaded from backend)
  useEffect(() => {
    console.log('🔄 initialNodes changed:', initialNodes.length, 'nodes');
    if (initialNodes && initialNodes.length > 0) {
      console.log('   ✅ Updating nodes state from initialNodes');
      setNodes(initialNodes as Node[]);
    }
  }, [initialNodes, setNodes]);
  
  // Update edges when initialEdges changes
  useEffect(() => {
    console.log('🔄 initialEdges changed:', initialEdges.length, 'edges');
    if (initialEdges && initialEdges.length > 0) {
      console.log('   ✅ Updating edges state from initialEdges');
      setEdges(initialEdges as Edge[]);
    }
  }, [initialEdges, setEdges]);
  
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [showExecutionMonitor, setShowExecutionMonitor] = useState(false);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const isFirstRenderRef = useRef(true); // Track first render to prevent auto-save
  const componentMountTimeRef = useRef<number>(Date.now()); // Track when component mounted
  
  // Context Menu & Delete Modal
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: Node } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ node: Node } | null>(null);
  
  // Node Selector Popup for adding nodes between edges
  const [nodeSelectorPopup, setNodeSelectorPopup] = useState<{
    x: number;
    y: number;
    edgeId: string;
    sourceNode: string;
    targetNode: string;
  } | null>(null);
  
  // Auto-layout state (enabled by default for better UX)
  const [autoLayoutEnabled, setAutoLayoutEnabled] = useState(true);
  
  // Track previous node count to detect when nodes are added
  const previousNodeCountRef = useRef(nodes.length);
  
  // State for add-node popups from node outputs
  const [addNodePopup, setAddNodePopup] = useState<{
    x: number;
    y: number;
    sourceNode: string;
  } | null>(null);

  // Handler for adding node between edges (declared early for use in onConnect)
  // NOTE: We don't use useCallback with edges/nodes dependencies to avoid stale closures!
  const handleAddNodeBetween = (edgeId: string, sourceNode: string, targetNode: string) => {
    console.log('🎯 [+ BUTTON CLICKED]');
    console.log('   Edge ID:', edgeId);
    console.log('   Source Node:', sourceNode);
    console.log('   Target Node:', targetNode);
    console.log('   Current edges count:', edges.length);
    console.log('   Current nodes count:', nodes.length);
    
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) {
      console.log('   ❌ Edge not found!');
      console.log('   Available edges:', edges.map(e => e.id));
      return;
    }
    console.log('   ✅ Edge found:', edge);

    const sourceNodeData = nodes.find(n => n.id === sourceNode);
    const targetNodeData = nodes.find(n => n.id === targetNode);
    
    if (!sourceNodeData || !targetNodeData) {
      console.log('   ❌ Source or target node not found!');
      console.log('   Source found:', !!sourceNodeData);
      console.log('   Target found:', !!targetNodeData);
      console.log('   Available nodes:', nodes.map(n => n.id));
      return;
    }
    console.log('   ✅ Both nodes found');

    // Show popup in center of screen
    console.log('   ✅ Opening node selector popup...');
    setNodeSelectorPopup({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      edgeId,
      sourceNode,
      targetNode,
    });
  };

  // Custom edge change handler to ensure all edges have button functionality
  const onEdgesChange = useCallback((changes: any) => {
    onEdgesChangeInternal(changes);
  }, [onEdgesChangeInternal]);

  // Store handleAddNodeBetween in a ref to maintain stable reference
  // (We need this because the function is used in edge data which shouldn't change)
  const handleAddNodeBetweenRef = useRef(handleAddNodeBetween);
  handleAddNodeBetweenRef.current = handleAddNodeBetween;

  // Ensure all edges have button functionality whenever edges change
  // Create a dependency string from edge IDs to trigger on any edge change
  const edgeIds = edges.map(e => e.id).sort().join(',');
  
  useEffect(() => {
    console.log('🔍 [EDGE CHECK] useEffect triggered');
    console.log('   Total edges:', edges.length);
    console.log('   Edge IDs:', edgeIds);
    
    edges.forEach((edge, index) => {
      console.log(`   Edge ${index}: ${edge.id}`);
      console.log(`      - type: ${edge.type}`);
      console.log(`      - has onAddNode: ${!!edge.data?.onAddNode}`);
      console.log(`      - source: ${edge.source} → target: ${edge.target}`);
    });
    
    const hasEdgesWithoutButton = edges.some(
      edge => !edge.data?.onAddNode || edge.type !== 'buttonEdge'
    );
    
    console.log('   Has edges without button?', hasEdgesWithoutButton);
    
    if (hasEdgesWithoutButton) {
      console.log('   ✅ Adding button functionality now...');
      setEdges((currentEdges) => {
        const updated = currentEdges.map((edge) => ({
          ...edge,
          type: 'buttonEdge',
          // Clean up null string values from database
          sourceHandle: edge.sourceHandle === 'null' || edge.sourceHandle === null ? undefined : edge.sourceHandle,
          targetHandle: edge.targetHandle === 'null' || edge.targetHandle === null ? undefined : edge.targetHandle,
          data: {
            ...edge.data,
            onAddNode: (edgeId: string, source: string, target: string) => 
              handleAddNodeBetweenRef.current(edgeId, source, target),
          },
        }));
        console.log('   ✅ Updated edges:', updated.length);
        return updated;
      });
    } else {
      console.log('   ✅ All edges already have button functionality');
    }
  }, [edgeIds, setEdges]); // Depend on edge IDs to catch any edge changes
  
  // Find nodes without outgoing edges and create phantom edges with + buttons
  const nodesWithoutOutput = nodes.filter(node => {
    if (node.type === 'end') return false; // End nodes don't need output buttons
    const hasOutgoingEdge = edges.some(e => e.source === node.id && !e.id.startsWith('phantom-'));
    return !hasOutgoingEdge;
  });
  
  // Create phantom edges for normal nodes without output
  const phantomEdges: Edge[] = nodesWithoutOutput.map(node => ({
    id: `phantom-exit-${node.id}`,
    source: node.id,
    sourceHandle: 'output', // Output handle
    target: node.id,
    // No targetHandle - phantom edge points to itself
    type: 'phantomAddButton',
    data: {
      onAddNode: () => {
        setAddNodePopup({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          sourceNode: node.id,
        });
      },
    },
    style: { opacity: 0, pointerEvents: 'none' },
  } as Edge));
  
  // Merge phantom edges with real edges for rendering
  const allEdges = [...edges, ...phantomEdges];

  const onConnect = useCallback(
    (connection: Connection) => {
      console.log('🔗 [MANUAL CONNECTION]');
      console.log('   Source:', connection.source, 'sourceHandle:', connection.sourceHandle);
      console.log('   Target:', connection.target, 'targetHandle:', connection.targetHandle);
      
      const newEdge = {
        ...connection,
        id: `${connection.source}-${connection.target}`,
        type: 'buttonEdge',
        // EXPLICITLY preserve the handles (spread might not always work)
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
        data: { 
          onAddNode: (edgeId: string, source: string, target: string) => 
            handleAddNodeBetweenRef.current(edgeId, source, target) 
        },
      } as Edge;
      
      console.log('   Created edge:', newEdge);
      console.log('   Edge type:', newEdge.type);
      console.log('   Edge sourceHandle:', newEdge.sourceHandle);
      console.log('   Edge targetHandle:', newEdge.targetHandle);
      console.log('   Edge has onAddNode?', !!newEdge.data?.onAddNode);
      
      setEdges((eds) => {
        const updated = addEdge(newEdge, eds);
        console.log('   ✅ Edges after connection:', updated.length);
        return updated;
      });
    },
    [setEdges, nodes]
  );

  const onAddNode = useCallback((type: string) => {
    console.log('🚨🚨🚨 [onAddNode] CALLED WITH TYPE:', type);
    console.log('🚨🚨🚨 This is the NEW validation code!');
    
    // Prevent adding multiple Start nodes using functional state update
    if (type === 'start') {
      setNodes((currentNodes) => {
        const hasStartNode = currentNodes.some(node => node.type === 'start');
        console.log('🔍 [onAddNode] Current nodes:', currentNodes.length);
        console.log('🔍 [onAddNode] Has Start node?', hasStartNode);
        
        if (hasStartNode) {
          alert('⚠️ Es kann nur EINEN Start Node geben!\n\nEin Workflow muss genau einen Einstiegspunkt haben.');
          console.log('❌ Prevented adding second Start node');
          return currentNodes; // Return unchanged state
        }
        
        const newNode: Node = {
          id: `${type}-${Date.now()}`,
          type,
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            label: type.charAt(0).toUpperCase() + type.slice(1),
          },
        };
        
        console.log('✅ [onAddNode] Adding Start node:', newNode.id);
        return [...currentNodes, newNode];
      });
      
      return; // Exit early for Start nodes
    }

    // For non-Start nodes, add normally
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
      },
    };
    
    console.log('✅ [onAddNode] Adding node:', type, newNode.id);
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Always open config panel when clicking a node
    setSelectedNode(node);
    setShowConfigPanel(true);
    // Close context menu if open
    setContextMenu(null);
  }, []);

  const onUpdateNode = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } }
        : node
      )
    );
  }, [setNodes]);

  const onDeleteNode = useCallback(async (nodeId: string) => {
    console.log('🗑️ Deleting node from canvas:', nodeId);
    
    // Warn when deleting Start node
    const nodeToDelete = nodes.find(n => n.id === nodeId);
    if (nodeToDelete?.type === 'start') {
      const confirmDelete = window.confirm(
        '⚠️ ACHTUNG: Du bist dabei, den Start Node zu löschen!\n\n' +
        'Ohne Start Node kann der Workflow nicht ausgeführt werden.\n\n' +
        'Möchtest du wirklich fortfahren?'
      );
      if (!confirmDelete) {
        console.log('❌ Start node deletion cancelled by user');
        return;
      }
    }
    
    try {
      // Find incoming and outgoing edges before deletion
      const incomingEdges = edges.filter(e => e.target === nodeId);
      const outgoingEdges = edges.filter(e => e.source === nodeId);
      
      console.log('   📊 Incoming edges:', incomingEdges.length);
      console.log('   📊 Outgoing edges:', outgoingEdges.length);
      
      // Delete from backend if workflowId exists
      if (workflowId) {
        await workflowService.deleteNode(workflowId, nodeId);
        console.log('✅ Node deleted from backend');
      }
      
      // Delete from local state
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      
      // Update edges: remove old ones and create new connections
      setEdges((eds) => {
        // Remove edges connected to the deleted node
        const filteredEdges = eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
        
        // Create new edges to reconnect the workflow
        const newEdges: Edge[] = [];
        
        // For each incoming edge, connect to each outgoing edge
        incomingEdges.forEach(inEdge => {
          outgoingEdges.forEach(outEdge => {
            const newEdgeId = `${inEdge.source}-${outEdge.target}`;
            
            // Check if this edge doesn't already exist
            if (!filteredEdges.some(e => e.source === inEdge.source && e.target === outEdge.target)) {
              console.log('   🔗 Creating reconnection edge:', newEdgeId);
              newEdges.push({
                id: newEdgeId,
                source: inEdge.source,
                sourceHandle: inEdge.sourceHandle,
                target: outEdge.target,
                targetHandle: outEdge.targetHandle,
                type: 'buttonEdge',
                data: { 
                  onAddNode: (id: string, src: string, tgt: string) => 
                    handleAddNodeBetweenRef.current(id, src, tgt)
                },
              });
            }
          });
        });
        
        console.log('   ✅ Created', newEdges.length, 'reconnection edges');
        return [...filteredEdges, ...newEdges];
      });
      
      console.log('✅ Node deleted successfully with automatic reconnection');
    } catch (error) {
      console.error('❌ Failed to delete node:', error);
      alert('Failed to delete node. Please try again.');
    }
  }, [nodes, edges, setNodes, setEdges, workflowId]);

  // Handler for adding a node directly from a node's output
  const handleAddNodeFromOutput = useCallback((sourceNodeId: string, nodeType: string) => {
    console.log('📝 [ADD NODE FROM OUTPUT]:', nodeType, 'from node:', sourceNodeId);
    
    // Prevent adding multiple Start nodes
    if (nodeType === 'start') {
      const hasStartNode = nodes.some(node => node.type === 'start');
      if (hasStartNode) {
        alert('⚠️ Es kann nur EINEN Start Node geben!');
        setAddNodePopup(null);
        return;
      }
    }
    
    // Close popup
    setAddNodePopup(null);
    
    // Find source node
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return;
    
    // Determine source handle based on source node type
    let sourceHandle: string | undefined = undefined;
    
    // Create new node ID
    const newNodeId = `${nodeType}-${Date.now()}`;
    
    // Position new node below source node
    const newNodePosition = {
      x: sourceNode.position.x,
      y: sourceNode.position.y + 150, // Below
    };
    
    // Create new node
    const newNode: Node = {
      id: newNodeId,
      type: nodeType,
      position: newNodePosition,
      data: {
        label: nodeType ? nodeType.charAt(0).toUpperCase() + nodeType.slice(1) : 'Node',
      },
    };
    
    // Add node
    setNodes((nds) => [...nds, newNode]);
    
    // Create edge
    setEdges((eds) => {
      const newEdge: Edge = {
        id: `${sourceNodeId}-${newNodeId}`,
        source: sourceNodeId,
        sourceHandle: sourceHandle,
        target: newNodeId,
        type: 'buttonEdge',
        data: { 
          onAddNode: (id: string, src: string, tgt: string) => 
            handleAddNodeBetweenRef.current(id, src, tgt)
        },
      };
      return [...eds, newEdge];
    });
    
    console.log('✅ Node added from output with handle:', sourceHandle);
  }, [nodes, setNodes, setEdges]);
  
  // Handler for selecting a node type from popup
  const handleSelectNodeType = useCallback((nodeType: string) => {
    if (!nodeSelectorPopup) return;

    console.log('📝 [NODE TYPE SELECTED]:', nodeType);
    
    // Prevent adding multiple Start nodes
    if (nodeType === 'start') {
      const hasStartNode = nodes.some(node => node.type === 'start');
      if (hasStartNode) {
        alert('⚠️ Es kann nur EINEN Start Node geben!\n\nEin Workflow muss genau einen Einstiegspunkt haben.');
        console.log('❌ Prevented adding second Start node');
        setNodeSelectorPopup(null);
        return;
      }
    }

    const { edgeId, sourceNode, targetNode } = nodeSelectorPopup;

    // Close popup immediately to prevent double-clicks
    setNodeSelectorPopup(null);
    

    // Calculate new node ID and data ONCE outside state updates
    const newNodeId = `${nodeType}-${Date.now()}`;
    
    // Build edge lookup for graph traversal (capture current edges)
    const edgeLookup = new Map<string, string[]>();
    edges.forEach(edge => {
      if (!edgeLookup.has(edge.source)) {
        edgeLookup.set(edge.source, []);
      }
      edgeLookup.get(edge.source)!.push(edge.target);
    });

    // Find all nodes downstream of targetNode using BFS
    const downstreamNodes = new Set<string>();
    const queue = [targetNode];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (downstreamNodes.has(nodeId)) continue;
      downstreamNodes.add(nodeId);
      
      const children = edgeLookup.get(nodeId) || [];
      queue.push(...children);
    }

    console.log('   🔄 Auto-layout: Will shift', downstreamNodes.size, 'downstream nodes');
    
    // Update nodes first (with auto-layout for downstream nodes)
    setNodes((currentNodes) => {
      const sourceNodeData = currentNodes.find(n => n.id === sourceNode);
      const targetNodeData = currentNodes.find(n => n.id === targetNode);
      
      if (!sourceNodeData || !targetNodeData) {
        console.log('   ❌ Nodes not found!');
        return currentNodes;
      }

      // If auto-layout is enabled, use simple temporary position
      // Auto-layout will handle proper positioning
      const newNodePosition = autoLayoutEnabled 
        ? { x: 400, y: 200 } // Temporary position, will be repositioned by auto-layout
        : {
            x: (sourceNodeData.position.x + targetNodeData.position.x) / 2 - 75,
            y: (sourceNodeData.position.y + targetNodeData.position.y) / 2 - 50,
          };

      const newNode: Node = {
        id: newNodeId,
        type: nodeType,
        position: newNodePosition,
        data: {
          label: nodeType ? nodeType.charAt(0).toUpperCase() + nodeType.slice(1) : 'Node',
        },
      };

      console.log('   ✅ Adding node:', newNodeId, 'at position:', newNodePosition);
      
      // Only shift downstream nodes if auto-layout is disabled
      if (!autoLayoutEnabled) {
        const VERTICAL_SPACING = 150;
        const updatedNodes = currentNodes.map(node => {
          if (downstreamNodes.has(node.id)) {
            return {
              ...node,
              position: {
                ...node.position,
                y: node.position.y + VERTICAL_SPACING
              }
            };
          }
          return node;
        });
        return [...updatedNodes, newNode];
      }
      
      // With auto-layout enabled, just add the node
      return [...currentNodes, newNode];
    });

    // Then update edges separately
    setEdges((currentEdges) => {
      console.log('   ✅ Removing edge:', edgeId);
      console.log('   ✅ Creating 2 new edges for node type:', nodeType);
      
      const filteredEdges = currentEdges.filter(e => e.id !== edgeId);
      
      const newEdges = [
        ...filteredEdges,
        {
          id: `${sourceNode}-${newNodeId}`,
          source: sourceNode,
          target: newNodeId,
          type: 'buttonEdge',
          data: { 
            onAddNode: (id: string, src: string, tgt: string) => 
              handleAddNodeBetweenRef.current(id, src, tgt)
          },
        },
        {
          id: `${newNodeId}-${targetNode}`,
          source: newNodeId,
          target: targetNode,
          type: 'buttonEdge',
          data: { 
            onAddNode: (id: string, src: string, tgt: string) => 
              handleAddNodeBetweenRef.current(id, src, tgt)
          },
        },
      ];

      console.log('   ✅ New edges count:', newEdges.length);
      return newEdges;
    });

  }, [nodeSelectorPopup, nodes, edges, setNodes, setEdges, autoLayoutEnabled]);
  
  // Separate effect to apply auto-layout after node was added
  useEffect(() => {
    const currentNodeCount = nodes.length;
    const previousNodeCount = previousNodeCountRef.current;
    
    if (autoLayoutEnabled && currentNodeCount > previousNodeCount && nodes.length > 0 && edges.length >= 0) {
      console.log('🔄 Node added - applying auto-layout');
      console.log('   Previous count:', previousNodeCount, '→ New count:', currentNodeCount);
      console.log('   Nodes available:', nodes.length, 'Edges available:', edges.length);
      
      previousNodeCountRef.current = currentNodeCount;
      
      // Apply layout immediately with current state
      try {
        console.log('   ✅ Executing auto-layout NOW');
        const layouted = applyVerticalLayout(nodes, edges);
        console.log('   ✅ Layout calculated - applying to', layouted.nodes.length, 'nodes');
        setNodes(layouted.nodes);
        setEdges(layouted.edges);
        console.log('   ✅ Auto-layout complete!');
      } catch (error) {
        console.error('   ❌ Auto-layout failed:', error);
      }
    } else if (currentNodeCount !== previousNodeCount) {
      // Just update the ref
      console.log('   📝 Updating node count ref:', previousNodeCount, '→', currentNodeCount);
      previousNodeCountRef.current = currentNodeCount;
    }
  }, [nodes, edges, autoLayoutEnabled, setNodes, setEdges]);

  // Manual Auto-Layout handler
  const handleManualAutoLayout = useCallback(() => {
    console.log('🔄 Applying manual auto-layout...');
    const layouted = applyVerticalLayout(nodes, edges);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [nodes, edges, setNodes, setEdges]);

  const handleFitView = useCallback(() => {
    console.log('📐 Fitting view...');
    fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      node
    });
  }, []);

  const onDuplicateNode = useCallback((node: Node) => {
    console.log('📋 Duplicating node:', node.id);
    
    // Prevent duplicating Start nodes
    if (node.type === 'start') {
      alert('⚠️ Der Start Node kann nicht dupliziert werden!\n\nEin Workflow kann nur einen Einstiegspunkt haben.');
      console.log('❌ Prevented duplicating Start node');
      return;
    }
    
    const newNode: Node = {
      ...node,
      id: `${node.type}-${Date.now()}`,
      position: {
        x: node.position.x + 200,
        y: node.position.y + 100,
      },
      selected: true, // Select the new node
      data: {
        ...node.data,
        label: `${node.data?.label || node.type} (Copy)`
      }
    };
    
    // Deselect all other nodes and add the new one
    setNodes((nds) => [
      ...nds.map(n => ({ ...n, selected: false })),
      newNode
    ]);
    
    console.log('✅ Node duplicated:', newNode.id);
    autoSave();
  }, [setNodes]);

  // Auto-save function with debouncing
  const autoSave = useCallback(async () => {
    if (!workflowId || !onSave) return;
    
    // Prevent auto-save within first 3 seconds of component mount (workflow just created)
    const timeSinceMount = Date.now() - componentMountTimeRef.current;
    if (timeSinceMount < 3000) {
      console.log('⏭️ Skipping auto-save - component just mounted', timeSinceMount, 'ms ago');
      return;
    }
    
    setAutoSaving(true);
    try {
      await onSave(nodes, edges);
      console.log('Auto-saved workflow');
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [workflowId, nodes, edges, onSave]);

  // Update onAddNode to trigger auto-save after adding node
  const onAddNodeWithSave = useCallback((type: string) => {
    console.log('🚨🚨🚨 [onAddNodeWithSave] CALLED WITH TYPE:', type);
    
    // ⚠️ VALIDATION: Prevent adding multiple Start nodes
    if (type === 'start') {
      let nodeWasAdded = false;
      
      setNodes((currentNodes) => {
        const hasStartNode = currentNodes.some(node => node.type === 'start');
        console.log('🔍 [onAddNodeWithSave] Current nodes:', currentNodes.length);
        console.log('🔍 [onAddNodeWithSave] Has Start node?', hasStartNode);
        
        if (hasStartNode) {
          alert('⚠️ Es kann nur EINEN Start Node geben!\n\nEin Workflow muss genau einen Einstiegspunkt haben.');
          console.log('❌ Prevented adding second Start node');
          return currentNodes; // Return unchanged state
        }
        
        const newNode: Node = {
          id: `${type}-${Date.now()}`,
          type,
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            label: type.charAt(0).toUpperCase() + type.slice(1),
          },
        };
        
        console.log('✅ [onAddNodeWithSave] Adding Start node:', newNode.id);
        nodeWasAdded = true;
        
        return [...currentNodes, newNode];
      });
      
      // Only trigger auto-save if node was actually added
      if (nodeWasAdded) {
        console.log('🔄 Node added, triggering immediate save...');
        setTimeout(() => {
          autoSave();
        }, 100);
      }
      
      return; // Exit early for Start nodes
    }

    // For non-Start nodes, add normally
    const newNodeId = `${type}-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
      },
    };
    
    console.log('✅ [onAddNodeWithSave] Adding node:', type, newNodeId);
    setNodes((nds) => [...nds, newNode]);
    
    // Trigger immediate save after adding node
    console.log('🔄 Node added, triggering immediate save...');
    setTimeout(() => {
      autoSave();
    }, 100); // Small delay to ensure state is updated
  }, [setNodes, setEdges, autoSave]);

  // Debounced auto-save effect
  useEffect(() => {
    // Skip auto-save on first render to prevent overwriting initial workflow
    if (isFirstRenderRef.current) {
      console.log('⏭️ Skipping auto-save on first render');
      isFirstRenderRef.current = false;
      return;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [nodes, edges, autoSave]);

  const onCloseConfigPanel = useCallback(() => {
    setShowConfigPanel(false);
    setSelectedNode(null);
  }, []);

  const handleSave = useCallback(async () => {
    console.log('💾 handleSave called');
    console.log('workflowId:', workflowId);
    console.log('nodes:', nodes);
    console.log('edges:', edges);
    console.log('onSave function:', onSave);
    
    setSaving(true);
    try {
      if (onSave) {
        console.log('📡 Calling onSave function...');
        await onSave(nodes, edges);
        console.log('✅ Save completed successfully');
      } else {
        console.warn('⚠️ No onSave function provided');
      }
    } catch (error) {
      console.error('❌ Error saving workflow:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        response: (error as any)?.response?.data
      });
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, onSave, workflowId]);

  const handleExecute = useCallback(async () => {
    console.log('🚀 handleExecute called');
    console.log('workflowId:', workflowId);
    console.log('nodes:', nodes);
    console.log('edges:', edges);
    
    if (!workflowId) {
      console.error('❌ No workflowId provided');
       console.warn('No workflow ID available. Please create or load a workflow first.');
      return;
    }
    
    setExecuting(true);
    try {
      console.log('📡 Calling workflowService.startExecution...');
      // Start execution
      const execution = await workflowService.startExecution(workflowId, {
        timestamp: new Date().toISOString(),
        source: 'manual'
      });
      
      console.log('✅ Execution started:', execution.executionId);
      setCurrentExecutionId(execution.executionId);
      setShowExecutionMonitor(true);
      
      // Poll for execution status
      const pollStatus = async () => {
        try {
          const executionDetails = await workflowService.getExecution(execution.executionId);
          console.log('Execution status:', executionDetails.status);
          
          if (executionDetails.status === 'completed') {
            console.log('Execution completed successfully!');
            setExecuting(false);
          } else if (executionDetails.status === 'failed') {
            console.error('Execution failed:', executionDetails.error);
            setExecuting(false);
          } else if (executionDetails.status === 'running' || executionDetails.status === 'pending') {
            // Continue polling
            setTimeout(pollStatus, 1000);
          }
        } catch (error) {
          console.error('Error polling execution status:', error);
          setExecuting(false);
        }
      };
      
      // Start polling after a short delay
      setTimeout(pollStatus, 1000);
      
    } catch (error) {
      console.error('❌ Error executing workflow:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        response: (error as any)?.response?.data
      });
       console.error(`Error starting workflow execution: ${error instanceof Error ? error.message : String(error)}. Please check the console for details.`);
      setExecuting(false);
    }
  }, [workflowId]);

  const handlePublish = useCallback(async () => {
    if (!workflowId) return;
    
    setPublishing(true);
    try {
      const description = prompt('Enter a description for this published version:');
      if (description !== null) {
        await workflowService.publishWorkflow(workflowId, description);
        console.log('Workflow published successfully!');
      }
    } catch (error) {
      console.error('Error publishing workflow:', error);
       console.error('Error publishing workflow. Please try again.');
    } finally {
      setPublishing(false);
    }
  }, [workflowId]);

  return (
    <div className="w-full h-screen relative">
            <Toolbar
              onAddNode={onAddNodeWithSave}
              onSave={handleSave}
              onExecute={handleExecute}
              onPublish={handlePublish}
              onAutoLayout={handleManualAutoLayout}
              autoLayoutEnabled={autoLayoutEnabled}
              onToggleAutoLayout={() => setAutoLayoutEnabled(!autoLayoutEnabled)}
              onFitView={handleFitView}
              saving={saving}
              executing={executing}
              autoSaving={autoSaving}
              publishing={publishing}
            />
      
      <ReactFlow
        nodes={nodes}
        edges={allEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={() => {
          setContextMenu(null);
          setShowConfigPanel(false);
          setSelectedNode(null);
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-gray-50"
        deleteKeyCode={['Backspace', 'Delete']}
        edgesReconnectable={true}
        edgesFocusable={true}
        defaultEdgeOptions={{
          animated: false,
          type: 'buttonEdge',
          style: { strokeWidth: 2, stroke: '#94a3b8' },
          markerEnd: { type: 'arrowclosed' as any, color: '#94a3b8' },
          data: { onAddNode: handleAddNodeBetween },
        }}
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'start': return '#3b82f6';
              case 'end': return '#ef4444';
              case 'ifelse': return '#eab308';
              case 'agent': return '#06b6d4';
              case 'llm': return '#8b5cf6';
              case 'api': return '#3b82f6';
              case 'web-search': return '#ec4899';
              case 'file-search': return '#f59e0b';
              case 'email': return '#06b6d4';
              default: return '#94a3b8';
            }
          }}
          nodeStrokeWidth={3}
          position="bottom-right"
          className="bg-white rounded-lg shadow-lg border border-gray-200"
          style={{ width: 200, height: 150 }}
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

            {showConfigPanel && (
              <NodeConfigPanel
                selectedNode={selectedNode}
                onClose={onCloseConfigPanel}
                onUpdateNode={onUpdateNode}
                onDeleteNode={onDeleteNode}
                workflowId={workflowId}
                nodes={nodes}
                edges={edges}
              />
            )}

            {nodeSelectorPopup && (
              <NodeSelectorPopup
                position={{ x: nodeSelectorPopup.x, y: nodeSelectorPopup.y }}
                onSelectNode={handleSelectNodeType}
                onClose={() => setNodeSelectorPopup(null)}
              />
            )}
            
            {/* Add Node from Output popup */}
            {addNodePopup && (
              <NodeSelectorPopup
                position={{ x: addNodePopup.x, y: addNodePopup.y }}
                onSelectNode={(nodeType) => handleAddNodeFromOutput(addNodePopup.sourceNode, nodeType)}
                onClose={() => setAddNodePopup(null)}
              />
            )}
            
            {showExecutionMonitor && currentExecutionId && (
              <ExecutionMonitor
                executionId={currentExecutionId}
                onClose={() => {
                  setShowExecutionMonitor(false);
                  setCurrentExecutionId(null);
                }}
              />
            )}

            {/* Context Menu */}
            {contextMenu && (
              <NodeContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                nodeId={contextMenu.node.id}
                nodeType={contextMenu.node.type || 'unknown'}
                onDelete={() => {
                  setDeleteModal({ node: contextMenu.node });
                  setContextMenu(null);
                }}
                onDuplicate={() => {
                  onDuplicateNode(contextMenu.node);
                  setContextMenu(null);
                }}
                onConfigure={() => {
                  setSelectedNode(contextMenu.node);
                  setShowConfigPanel(true);
                  setContextMenu(null);
                }}
                onClose={() => setContextMenu(null)}
              />
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
              <DeleteNodeModal
                nodeName={(deleteModal.node.data?.label as string) || deleteModal.node.type || 'Node'}
                nodeType={deleteModal.node.type || 'unknown'}
                onConfirm={() => {
                  onDeleteNode(deleteModal.node.id);
                  setDeleteModal(null);
                }}
                onCancel={() => setDeleteModal(null)}
              />
            )}
          </div>
        );
      }

