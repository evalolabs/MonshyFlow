/**
 * Central configuration for which fields in which nodes use ExpressionEditor
 * 
 * This makes it easy for developers to see and modify which fields support
 * variable expressions ({{path}}) and template syntax.
 * 
 * NOTE: This file is now auto-generated from nodeMetadata.ts.
 * To add fields, edit nodeMetadata.ts instead!
 */

import { NODE_METADATA_REGISTRY } from './nodeRegistry/nodeMetadata';
import { GENERATED_NODE_METADATA } from './nodeRegistry/generatedMetadata';
import type { NodeMetadata } from './nodeRegistry/nodeMetadata';

export interface FieldConfig {
  type: 'expression' | 'text' | 'number' | 'select' | 'textarea' | 'secret' | 'smtpProfile';
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}

export type NodeFieldConfig = Record<string, FieldConfig>;

/**
 * Generate nodeFieldConfig from nodeMetadata
 * This allows fields to be defined once in nodeMetadata.ts
 * Includes both generated metadata (from registry.json) and manual registry
 */
function generateNodeFieldConfigFromMetadata(): Record<string, NodeFieldConfig> {
  const config: Record<string, NodeFieldConfig> = {};
  
  // Process generated metadata first (from registry.json)
  Object.entries(GENERATED_NODE_METADATA).forEach(([nodeType, metadata]) => {
    const nodeMetadata = metadata as NodeMetadata;
    if (nodeMetadata.fields) {
      config[nodeType] = {};
      Object.entries(nodeMetadata.fields).forEach(([fieldName, fieldConfig]) => {
        config[nodeType][fieldName] = {
          type: fieldConfig.type,
          multiline: fieldConfig.multiline,
          rows: fieldConfig.rows,
          placeholder: fieldConfig.placeholder,
        };
      });
    }
    
    // Legacy: Convert expressionFields to fields (backward compatibility)
    if (nodeMetadata.expressionFields && !nodeMetadata.fields) {
      config[nodeType] = config[nodeType] || {};
      nodeMetadata.expressionFields.forEach((fieldName: string) => {
        if (!config[nodeType][fieldName]) {
          config[nodeType][fieldName] = { type: 'expression' };
        }
      });
    }
  });
  
  // Then process manual registry (manual entries override generated ones)
  Object.entries(NODE_METADATA_REGISTRY).forEach(([nodeType, metadata]) => {
    const generatedMetadata = GENERATED_NODE_METADATA[nodeType];
    const hasGeneratedFields = generatedMetadata?.fields && Object.keys(generatedMetadata.fields).length > 0;
    
    // Process if:
    // 1. Node is not in generated metadata, OR
    // 2. Node is in generated metadata but has no fields (allows manual override)
    if (!(nodeType in GENERATED_NODE_METADATA) || !hasGeneratedFields) {
      if (metadata.fields) {
        config[nodeType] = config[nodeType] || {};
        Object.entries(metadata.fields).forEach(([fieldName, fieldConfig]) => {
          config[nodeType][fieldName] = {
            type: fieldConfig.type,
            multiline: fieldConfig.multiline,
            rows: fieldConfig.rows,
            placeholder: fieldConfig.placeholder,
          };
        });
      }
      
      // Legacy: Convert expressionFields to fields (backward compatibility)
      if (metadata.expressionFields && !metadata.fields) {
        config[nodeType] = config[nodeType] || {};
        metadata.expressionFields.forEach(fieldName => {
          if (!config[nodeType][fieldName]) {
            config[nodeType][fieldName] = { type: 'expression' };
          }
        });
      }
    }
  });
  
  return config;
}

/**
 * Auto-generated field configuration from nodeMetadata.ts
 */
const AUTO_GENERATED_CONFIG = generateNodeFieldConfigFromMetadata();

/**
 * Manual overrides and legacy configurations
 * These are kept for backward compatibility and special cases
 */
export const NODE_FIELD_CONFIG: Record<string, NodeFieldConfig> = {
  // Merge auto-generated config with manual overrides
  ...AUTO_GENERATED_CONFIG,
  
  // Manual overrides (if needed for special cases)
  // Manual overrides can be added here if needed
  // Example:
  // 'my-node': {
  //   customField: { type: 'expression', multiline: true, rows: 10 },
  // },
  
  // End node: Ensure result field uses ExpressionEditor
  'end': {
    ...(AUTO_GENERATED_CONFIG['end'] || {}),
    result: { 
      type: 'expression', 
      placeholder: 'Enter result message or use {{steps.nodeId.json}} to reference previous node output',
      multiline: false
    },
  },
  
  // Note: Most nodes are now auto-generated from nodeMetadata.ts and registry.json
  // Only add manual overrides here if you need special behavior
  // that can't be expressed in nodeMetadata.ts or registry.json
};

/**
 * Check if a field in a node type should use ExpressionEditor
 */
export function shouldUseExpressionEditor(nodeType: string, fieldName: string): boolean {
  return NODE_FIELD_CONFIG[nodeType]?.[fieldName]?.type === 'expression';
}

/**
 * Get field config for a specific node type and field
 */
export function getFieldConfig(nodeType: string, fieldName: string): FieldConfig | undefined {
  return NODE_FIELD_CONFIG[nodeType]?.[fieldName];
}

