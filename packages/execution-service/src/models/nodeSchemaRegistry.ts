/**
 * Node Schema Registry for TypeScript
 * 
 * Provides access to input/output schemas for each node type
 * Loaded from shared/registry.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface NodeSchemaInfo {
  inputSchema?: any;
  outputSchema?: any;
}

let schemas: Map<string, NodeSchemaInfo> | null = null;

/**
 * Load schemas from shared/registry.json
 */
export function loadNodeSchemas(): void {
  if (schemas !== null) return; // Already loaded

  schemas = new Map<string, NodeSchemaInfo>();

  try {
    // Try to find registry.json relative to the execution-service
    const registryPath = findRegistryJsonPath();
    
    if (!registryPath || !fs.existsSync(registryPath)) {
      console.warn(`[NodeSchemaRegistry] Registry.json not found at: ${registryPath || '(null)'}. Schema validation will be disabled.`);
      return;
    }

    const jsonContent = fs.readFileSync(registryPath, 'utf-8');
    const registry = JSON.parse(jsonContent);

    if (registry?.nodes && Array.isArray(registry.nodes)) {
      for (const node of registry.nodes) {
        if (node.type) {
          schemas.set(node.type, {
            inputSchema: node.inputSchema,
            outputSchema: node.outputSchema,
          });
        }
      }

      console.log(`[NodeSchemaRegistry] Loaded schemas for ${schemas.size} node types from registry.json`);
    }
  } catch (error: any) {
    console.error('[NodeSchemaRegistry] Failed to load node schemas from registry.json:', error.message);
  }
}

/**
 * Get input schema for a node type
 */
export function getInputSchema(nodeType: string): any {
  if (schemas === null) {
    loadNodeSchemas();
  }

  return schemas?.get(nodeType)?.inputSchema;
}

/**
 * Get output schema for a node type
 */
export function getOutputSchema(nodeType: string): any {
  if (schemas === null) {
    loadNodeSchemas();
  }

  return schemas?.get(nodeType)?.outputSchema;
}

/**
 * Get input schema as JSON string
 */
export function getInputSchemaJson(nodeType: string): string | null {
  const schema = getInputSchema(nodeType);
  return schema ? JSON.stringify(schema) : null;
}

/**
 * Get output schema as JSON string
 */
export function getOutputSchemaJson(nodeType: string): string | null {
  const schema = getOutputSchema(nodeType);
  return schema ? JSON.stringify(schema) : null;
}

/**
 * Find registry.json path
 */
function findRegistryJsonPath(): string | null {
  // Try multiple possible locations
  const possiblePaths = [
    // Relative to execution-service
    path.join(__dirname, '..', '..', '..', 'shared', 'registry.json'),
    // Relative to current directory
    path.join(process.cwd(), '..', 'shared', 'registry.json'),
    path.join(process.cwd(), 'shared', 'registry.json'),
    // Absolute path (if shared is in repo root)
    path.join(__dirname, '..', '..', 'shared', 'registry.json'),
  ];

  for (const possiblePath of possiblePaths) {
    const fullPath = path.resolve(possiblePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

// Auto-load on module import
loadNodeSchemas();

