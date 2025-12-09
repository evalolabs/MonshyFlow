/**
 * Node Metadata Configuration
 * 
 * Central configuration for all node types including:
 * - Display information (name, icon, description)
 * - Category and placement in UI
 * - Component reference
 * - Configuration form reference (optional)
 * - Field configuration for Expression Editor
 * 
 * ⚡ NEW: Nodes can be defined in shared/registry.json and auto-generated!
 * The generated metadata will be merged with this file.
 * Run: npm run generate:registry (in shared/)
 */

import type { ComponentType } from 'react';
import type { BaseNodeProps } from '../NodeTypes/BaseNode';

// Import generated metadata (if available)
// This is generated from shared/registry.json
// Note: The generated metadata will be merged at runtime if available
// To generate: cd shared && npm run generate:registry
import { GENERATED_NODE_METADATA } from './generatedMetadata';

export type NodeCategoryId = 'core' | 'ai' | 'logic' | 'data' | 'integration' | 'utility' | 'tools';

/**
 * Field configuration for automatic form generation
 */
export interface FieldConfig {
  type: 'expression' | 'text' | 'number' | 'select' | 'textarea' | 'secret' | 'smtpProfile';
  label?: string; // Optional label override (defaults to field name)
  multiline?: boolean; // For expression/text/textarea fields
  rows?: number; // For multiline fields
  placeholder?: string; // Placeholder text
  options?: Array<{ value: string; label: string }>; // For select fields
  min?: number; // For number fields
  max?: number; // For number fields
  step?: number; // For number fields
  secretType?: 'ApiKey' | 'Password' | 'Token' | 'Generic'; // For secret fields
  required?: boolean; // Whether field is required
  default?: string | number; // Default value (string for text/expression fields, number for number fields)
  displayCondition?: { // Conditional display
    field: string; // Field name to check
    operator: 'equals' | 'in' | 'notIn'; // Comparison operator
    value: string | string[]; // Value(s) to compare
  };
  hideWhenEmpty?: boolean; // Hide field if value is empty (for legacy fields)
}

/**
 * JSON Schema for input/output validation
 */
export interface JsonSchema {
  type?: string;
  properties?: Record<string, any>;
  required?: string[];
  description?: string;
  additionalProperties?: boolean;
  [key: string]: any;
}

export interface NodeMetadata {
  // Unique identifier (must match node type)
  id: string;
  
  // Display information
  name: string;
  icon: string;
  description: string;
  category: NodeCategoryId;
  animationSpeed?: 'fast' | 'slow';
  
  // Component (lazy-loaded)
  component: ComponentType<any>;
  
  // Configuration
  hasConfigForm?: boolean; // If true, NodeConfigPanel will look for a config form
  configFormComponent?: ComponentType<any>; // Optional: specific config form component
  useAutoConfigForm?: boolean; // If true, automatically generate config form from fields
  
  // UI behavior
  canDuplicate?: boolean; // Default: true
  canDelete?: boolean; // Default: true
  isUnique?: boolean; // Default: false (e.g., start node)
  
  // Handle configuration
  hasInput?: boolean; // Default: true
  hasOutput?: boolean; // Default: true
  additionalHandles?: BaseNodeProps['additionalHandles'];
  
  // Field configuration for automatic form generation and ExpressionEditor integration
  // If fields are defined, useAutoConfigForm will automatically generate the config form
  fields?: Record<string, FieldConfig>;
  
  // Schema definitions for input/output validation and type hints
  inputSchema?: JsonSchema; // JSON Schema for input validation
  outputSchema?: JsonSchema; // JSON Schema for output validation
  
  // Legacy: expressionFields (deprecated, use fields instead)
  // Kept for backward compatibility - will be converted to fields automatically
  expressionFields?: string[]; // Field names that should use ExpressionEditor
}

/**
 * Node Metadata Registry
 * 
 * Register all nodes here. The system will automatically:
 * - Display them in NodeSelectorPopup
 * - Register them in WorkflowCanvas
 * - Make them available in NodeConfigPanel
 * 
 * ⚡ NEW: Nodes can also be defined in shared/registry.json and auto-generated!
 * Run: npm run generate:registry (in shared/)
 */
export const NODE_METADATA_REGISTRY: Record<string, NodeMetadata> = {
  // Core Nodes
  start: {
    id: 'start',
    name: 'Start',
    icon: '🚀',
    description: 'Entry point for external tools (Webhook, API, etc.)',
    category: 'core',
    component: () => null, // Will be lazy-loaded
    hasConfigForm: true,
    isUnique: true,
    canDuplicate: false,
    hasInput: false,
    hasOutput: true,
  },
  end: {
    id: 'end',
    name: 'End',
    icon: '⬜',
    description: 'Workflow exit point',
    category: 'core',
    component: () => null,
    hasInput: true,
    hasOutput: false,
    fields: {
      label: { type: 'text', placeholder: 'End Label' },
      result: { 
        type: 'expression', 
        placeholder: 'Enter result message or use {{steps.nodeId.json}} to reference previous node output',
        multiline: false
      },
    },
  },
  
  // AI Nodes
  llm: {
    id: 'llm',
    name: 'LLM',
    icon: '🤖',
    description: 'Call OpenAI GPT models (GPT-4, GPT-3.5)',
    category: 'ai',
    component: () => null,
    hasConfigForm: true,
    useAutoConfigForm: false, // Uses custom form with model select and temperature slider
    fields: {
      label: { type: 'text', placeholder: 'LLM Name' },
      prompt: { type: 'expression', multiline: true, rows: 6, placeholder: 'Enter prompt... Use {{variables}} for dynamic content' },
      model: { type: 'select', options: [
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'claude-3', label: 'Claude 3' },
      ]},
      temperature: { type: 'number', min: 0, max: 2, step: 0.1 },
    },
  },
  agent: {
    id: 'agent',
    name: 'Agent',
    icon: '👤',
    description: 'Define instructions, tools, and model configuration',
    category: 'ai',
    component: () => null,
    hasConfigForm: true,
  },
  
  // Integration Nodes
  'http-request': {
    id: 'http-request',
    name: 'HTTP Request',
    icon: '🌐',
    description: 'Send HTTP requests to external APIs and services',
    category: 'integration',
    component: () => null,
    hasConfigForm: true,
    useAutoConfigForm: true,
    fields: {
      label: { type: 'text', placeholder: 'HTTP Request Name' },
      url: { type: 'expression', placeholder: 'https://webhook.site/your-unique-url or {{steps.agent-1.output}}' },
      method: { 
        type: 'select', 
        options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'DELETE', label: 'DELETE' },
          { value: 'PATCH', label: 'PATCH' },
        ]
      },
      sendInput: { type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ]},
      body: { type: 'expression', multiline: true, rows: 4, placeholder: 'Custom request body (JSON or text) or {{steps.agent-1.output}}' },
    },
  },
};

/**
 * Auto-discovered nodes from backend (populated at runtime)
 */
let AUTO_DISCOVERED_NODES: Record<string, NodeMetadata> = {};

/**
 * Register auto-discovered node metadata
 */
export function registerDiscoveredNode(nodeType: string, metadata: NodeMetadata): void {
  AUTO_DISCOVERED_NODES[nodeType] = metadata;
}

/**
 * Get all auto-discovered nodes
 */
export function getDiscoveredNodes(): Record<string, NodeMetadata> {
  return AUTO_DISCOVERED_NODES;
}

/**
 * Get metadata for a node type
 * Priority: Manual registry > Generated metadata > Auto-discovered > Manual registry fallback
 */
export function getNodeMetadata(nodeType: string): NodeMetadata | undefined {
  // Priority 1: Manual registry (highest priority - can override everything)
  if (nodeType in NODE_METADATA_REGISTRY) {
    return NODE_METADATA_REGISTRY[nodeType];
  }
  
  // Priority 2: Generated metadata (from registry.json)
  if (nodeType in GENERATED_NODE_METADATA) {
    return (GENERATED_NODE_METADATA as Record<string, NodeMetadata>)[nodeType];
  }
  
  // Priority 3: Auto-discovered (from backend)
  if (nodeType in AUTO_DISCOVERED_NODES) {
    return AUTO_DISCOVERED_NODES[nodeType];
  }
  
  return undefined;
}

/**
 * Get all node metadata grouped by category
 * Priority: Manual registry > Generated metadata > Auto-discovered
 */
export function getNodesByCategory(): Record<NodeCategoryId, NodeMetadata[]> {
  const result: Record<string, NodeMetadata[]> = {
    core: [],
    ai: [],
    logic: [],
    data: [],
    integration: [],
    utility: [],
    tools: [],
  };
  
  const addedTypes = new Set<string>();
  
  // Priority 1: Manual registry (highest priority)
  Object.values(NODE_METADATA_REGISTRY).forEach(node => {
    result[node.category].push(node);
    addedTypes.add(node.id);
  });
  
  // Priority 2: Generated metadata (from registry.json)
  Object.values(GENERATED_NODE_METADATA).forEach(node => {
    if (!addedTypes.has(node.id)) {
      result[node.category].push(node as NodeMetadata);
      addedTypes.add(node.id);
    }
  });
  
  // Priority 3: Auto-discovered (from backend)
  Object.values(AUTO_DISCOVERED_NODES).forEach(node => {
    if (!addedTypes.has(node.id)) {
      result[node.category].push(node);
      addedTypes.add(node.id);
    }
  });
  
  return result as Record<NodeCategoryId, NodeMetadata[]>;
}

/**
 * Get all registered node types
 * Priority: Manual registry > Generated metadata > Auto-discovered
 */
export function getAllNodeTypes(): string[] {
  const allTypes = new Set<string>();
  
  // Add all types (priority order doesn't matter for list)
  Object.keys(NODE_METADATA_REGISTRY).forEach(type => allTypes.add(type));
  Object.keys(GENERATED_NODE_METADATA).forEach(type => allTypes.add(type));
  Object.keys(AUTO_DISCOVERED_NODES).forEach(type => allTypes.add(type));
  
  return Array.from(allTypes);
}

/**
 * Check if a node type exists
 * Checks manual registry, generated metadata, and auto-discovered nodes
 */
export function isNodeTypeRegistered(nodeType: string): boolean {
  return nodeType in NODE_METADATA_REGISTRY || 
         nodeType in GENERATED_NODE_METADATA || 
         nodeType in AUTO_DISCOVERED_NODES;
}

