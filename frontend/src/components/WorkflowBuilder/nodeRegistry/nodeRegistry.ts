/**
 * Node Registry
 * 
 * Central registry that maps node types to their React components.
 * This allows automatic discovery and registration of nodes.
 * 
 * Usage:
 * 1. Create your node component in NodeTypes/
 * 2. Add metadata to nodeMetadata.ts
 * 3. Import and register the component here
 * 4. The node will automatically appear in the UI -
 */

import type { ComponentType } from 'react';
import React from 'react';

// Lazy import all node components
import { StartNode } from '../NodeTypes/OptimizedNodes';
import { EndNode } from '../NodeTypes/OptimizedNodes';
import { AgentNode } from '../NodeTypes/OptimizedNodes';
import { LLMNode } from '../NodeTypes/OptimizedNodes';
import { HttpRequestNode } from '../NodeTypes/OptimizedNodes';
import { TransformNode } from '../NodeTypes/OptimizedNodes';
import { CodeNode } from '../NodeTypes/CodeNode';
import { VariableNode } from '../NodeTypes/VariableNode';
import { EmailNode } from '../NodeTypes/OptimizedNodes';
import { WhileNode } from '../NodeTypes/WhileNode';
import { ForEachNode } from '../NodeTypes/ForEachNode';
import { IfElseNode } from '../NodeTypes/IfElseNode';
import { ToolNodeComponent } from '../ToolNodes/ToolNodeComponent';
import { BaseNode } from '../NodeTypes/BaseNode';
import { getAllNodeTypes, getNodeMetadata } from './nodeMetadata';

/**
 * Component mapping for regular nodes
 */
const NODE_COMPONENTS: Record<string, ComponentType<any>> = {
  start: StartNode,
  end: EndNode,
  transform: TransformNode,
  code: CodeNode,
  variable: VariableNode,
  agent: AgentNode,
  llm: LLMNode,
  'http-request': HttpRequestNode,
  email: EmailNode,
  while: WhileNode,
  foreach: ForEachNode,
  ifelse: IfElseNode,
  
  // Tool nodes use special component
  tool: ToolNodeComponent,
  'tool-web-search': ToolNodeComponent,
  'tool-file-search': ToolNodeComponent,
  'tool-code-interpreter': ToolNodeComponent,
  'tool-function': ToolNodeComponent,
  'tool-mcp-server': ToolNodeComponent,
};

/**
 * Create a default component using BaseNode for nodes without explicit components
 * This is the central fallback mechanism for all node types
 */
function createDefaultNodeComponent(nodeType: string): ComponentType<any> | undefined {
  // Get metadata for this node
  const metadata = getNodeMetadata(nodeType);
  if (!metadata) {
    return undefined;
  }
  
  // Skip tool nodes (they use special component)
  if (nodeType.startsWith('tool')) {
    return undefined;
  }
  
  // Create a default component using BaseNode
  return (props: any) => {
    const safeData = (props.data || {}) as Record<string, any>;
    
    // Extract overlay props
    const onUpdateComment = safeData.onUpdateComment as ((nodeId: string, comment: string) => void) | undefined;
    const showInfoOverlay = (safeData.showInfoOverlay as boolean | undefined) ?? true;
    const secrets = (safeData.secrets as Array<{ key: string; isActive: boolean }>) || [];
    
    // Get node ID
    const nodeId = props.data?.id || props.id || '';
    
    // Create node object for overlay
    const node = {
      id: nodeId,
      type: nodeType,
      position: { x: (props as any).xPos || 0, y: (props as any).yPos || 0 },
      data: safeData,
    };
    
    // Get label from node data or metadata
    const label = (safeData.label as string) || metadata.name || nodeType;
    
    // Get subtitle if available (e.g., delaySeconds for Delay node)
    const subtitle = safeData.subtitle as string | undefined;
    
    // Get execution status from props (passed by createNodeTypesMap wrapper)
    const isAnimating = safeData.isAnimating as boolean | undefined;
    const executionStatus = (safeData.executionStatus as 'idle' | 'running' | 'completed' | 'failed') || 'idle';
    
    // Ensure category is valid (BaseNode might not accept all NodeCategoryId values)
    const category = (metadata.category === 'tools' ? 'utility' : metadata.category) || 'utility';

    // Sizing overrides for specific node types (UX tuning)
    const isLoopMarker = nodeType === 'loop' || nodeType === 'end-loop';
    const widthPx = isLoopMarker ? 96 : undefined;
    const heightPx = isLoopMarker ? 32 : undefined;
    const shape = isLoopMarker ? 'pill' : undefined;
    const compact = isLoopMarker ? true : undefined;
    const hideSubtitle = isLoopMarker ? true : undefined;
    
    return React.createElement(BaseNode, {
      label,
      icon: metadata.icon || '📦',
      category: category as any,
      subtitle,
      selected: props.selected || false,
      isAnimating,
      executionStatus,
      hasInput: metadata.hasInput !== false,
      hasOutput: metadata.hasOutput !== false,
      widthPx,
      heightPx,
      shape,
      compact,
      hideSubtitle,
      node,
      onUpdateComment,
      showInfoOverlay,
      secrets,
    });
  };
}

/**
 * Get component for a node type with automatic fallback
 * Priority: Explicit component > Default BaseNode component (if metadata exists)
 */
export function getNodeComponent(nodeType: string): ComponentType<any> | undefined {
  // First, check for explicit component
  if (nodeType in NODE_COMPONENTS) {
    return NODE_COMPONENTS[nodeType];
  }
  
  // Fallback: Create default component if metadata exists
  return createDefaultNodeComponent(nodeType);
}

/**
 * Register a new node component
 * 
 * Usage:
 * ```ts
 * import { MyNewNode } from '../NodeTypes/MyNewNode';
 * registerNodeComponent('my-new-node', MyNewNode);
 * ```
 */
export function registerNodeComponent(
  nodeType: string,
  component: ComponentType<any>
): void {
  if (NODE_COMPONENTS[nodeType]) {
    // Node type already registered, overwriting
  }
  NODE_COMPONENTS[nodeType] = component;
}

/**
 * Get all registered node types with their components
 */
export function getAllNodeComponents(): Record<string, ComponentType<any>> {
  return { ...NODE_COMPONENTS };
}

/**
 * Check if a node type has a registered component (including fallback)
 */
export function hasNodeComponent(nodeType: string): boolean {
  // Check explicit component first
  if (nodeType in NODE_COMPONENTS) {
    return true;
  }
  
  // Check if fallback component can be created (metadata exists)
  const metadata = getNodeMetadata(nodeType);
  return metadata !== undefined && !nodeType.startsWith('tool');
}

// Cache for default components to avoid recreating them
const defaultComponentCache = new Map<string, ComponentType<any>>();

/**
 * Create node types map for React Flow
 * Includes execution status wrappers and animation support
 * Optimized with caching and dynamic fallback support
 */
export function createNodeTypesMap(
  isExecuting: boolean,
  executionSteps: any[],
  currentAnimatedNodeId?: string | null,
  onUpdateComment?: (nodeId: string, comment: string) => void,
  secrets?: Array<{ key: string; isActive: boolean }>,
  showOverlays: boolean = true,
  isNodeAnimating?: (nodeId: string) => boolean
): Record<string, ComponentType<any>> {
  const nodeTypes: Record<string, ComponentType<any>> = {};
  
  // Helper to get execution status for a node (wie Activepieces)
  const getNodeExecutionStatus = (nodeId: string, isAnimating: boolean): 'idle' | 'running' | 'completed' | 'failed' => {
    // Wenn Node aktuell animiert wird, zeige als 'running'
    if (isAnimating && isExecuting) {
      return 'running';
    }
    
    // Ansonsten: Status direkt aus executionSteps lesen (wie Activepieces)
    const step = executionSteps.find((s: any) => s.nodeId === nodeId);
    if (!step) {
      return 'idle';
    }
    
    return step.status as 'idle' | 'running' | 'completed' | 'failed';
  };
  
  // Register all components with execution status if needed
  Object.entries(NODE_COMPONENTS).forEach(([nodeType, Component]) => {
    // Tool nodes don't need execution status wrapper
    if (nodeType.startsWith('tool')) {
      nodeTypes[nodeType] = Component;
      return;
    }
    
    // Wrap other nodes with execution status and animation
    // Use React.createElement since this is a .ts file (not .tsx)
    nodeTypes[nodeType] = (props: any) => {
      const nodeId = props.data?.id || props.id;
      // Use isNodeAnimating function if available, otherwise fallback to simple comparison
      const isAnimating = typeof isNodeAnimating === 'function' 
        ? isNodeAnimating(nodeId)
        : currentAnimatedNodeId === nodeId;
      const executionStatus = isExecuting ? getNodeExecutionStatus(nodeId, isAnimating) : 'idle';
      
      // Pass animation props to component if it supports them
      const componentProps = {
        ...props,
        data: {
          ...props.data,
          isAnimating,
          executionStatus,
          onUpdateComment, // Pass comment update callback
          secrets, // Pass secrets for validation
          showInfoOverlay: showOverlays, // Pass overlay visibility state
        },
      };
      
      // Always return just the component, without LiveNodeStatus wrapper
      return React.createElement(Component, componentProps);
    };
  });
  
  // Auto-register nodes from the full registry (manual + generated + discovered)
  // that don't have explicit components.
  // This ensures nodes defined in `nodeMetadata.ts` (manual), `registry.json` (generated),
  // or discovered at runtime are automatically rendered with BaseNode.
  getAllNodeTypes().forEach((nodeType) => {
    // Skip if already registered with explicit component
    if (nodeType in nodeTypes) {
      return;
    }
    
    // Skip tool nodes (they use special component)
    if (nodeType.startsWith('tool')) {
      return;
    }
    
    // Use cached default component or create new one
    let defaultComponent = defaultComponentCache.get(nodeType);
    if (!defaultComponent) {
      defaultComponent = createDefaultNodeComponent(nodeType);
      if (!defaultComponent) {
        return;
      }
      defaultComponentCache.set(nodeType, defaultComponent);
    }
    
    // Wrap with execution status and animation
    nodeTypes[nodeType] = (props: any) => {
      const nodeId = props.data?.id || props.id;
      // Use isNodeAnimating function if available, otherwise fallback to simple comparison
      const isAnimating = typeof isNodeAnimating === 'function' 
        ? isNodeAnimating(nodeId)
        : currentAnimatedNodeId === nodeId;
      const executionStatus = isExecuting ? getNodeExecutionStatus(nodeId, isAnimating) : 'idle';
      
      // Pass animation props and selected state to default component
      const componentProps = {
        ...props,
        selected: props.selected || false, // Pass selected prop to component
        data: {
          ...props.data,
          isAnimating,
          executionStatus,
          onUpdateComment,
          secrets,
          showInfoOverlay: showOverlays,
        },
      };
      
      return React.createElement(defaultComponent, componentProps);
    };
  });
  
  // Create a dynamic fallback for any missing node types
  // This handles nodes that might be added at runtime (e.g., from backend)
  const defaultFallback = (props: any) => {
    const nodeType = props.type || props.data?.type || 'unknown';
    const nodeId = props.data?.id || props.id;
    // Use isNodeAnimating function if available, otherwise fallback to simple comparison
    const isAnimating = typeof isNodeAnimating === 'function' 
      ? isNodeAnimating(nodeId)
      : currentAnimatedNodeId === nodeId;
    const executionStatus = isExecuting ? getNodeExecutionStatus(nodeId, isAnimating) : 'idle';
    
    // Try to get component using fallback mechanism
    const Component = getNodeComponent(nodeType);
    
    if (Component) {
      // Pass animation props
      const componentProps = {
        ...props,
        data: {
          ...props.data,
          isAnimating,
          executionStatus,
          onUpdateComment,
          secrets,
          showInfoOverlay: showOverlays,
        },
      };
      
      return React.createElement(Component, componentProps);
    }
    
    // Ultimate fallback: render a basic node
    console.warn(`[NodeRegistry] No component found for node type: ${nodeType}, using fallback`);
    return React.createElement(BaseNode, {
      label: props.data?.label || nodeType,
      icon: '📦',
      category: 'utility',
      selected: props.selected || false,
      isAnimating,
      executionStatus,
      hasInput: true,
      hasOutput: true,
    });
  };
  
  // Set default node type for React Flow (handles unknown node types)
  nodeTypes.default = defaultFallback;
  
  return nodeTypes;
}

