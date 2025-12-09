/**
 * Schema Helper Utilities
 * 
 * Utilities for working with JSON Schemas in the frontend
 * - Extract field information for type hints
 * - Generate variable suggestions from schemas
 * - Validate data against schemas
 */

import type { JsonSchema } from '../nodeRegistry/nodeMetadata';

/**
 * Extract field paths from a JSON Schema
 * Returns an array of field paths like ['field1', 'field1.nested', 'field2']
 */
export function extractFieldPaths(schema: JsonSchema | undefined, prefix = ''): string[] {
  if (!schema) return [];

  const paths: string[] = [];

  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      paths.push(fullPath);

      // Recursively extract nested properties
      if (value.properties || value.type === 'object') {
        paths.push(...extractFieldPaths(value, fullPath));
      }

      // Handle arrays of objects
      if (value.type === 'array' && value.items?.properties) {
        paths.push(...extractFieldPaths(value.items, `${fullPath}[0]`));
      }
    });
  }

  return paths;
}

/**
 * Get field suggestions from output schema of a node
 * Used for auto-complete in Expression Editor
 */
export function getFieldSuggestionsFromSchema(
  schema: JsonSchema | undefined,
  nodeId: string
): Array<{ value: string; label: string; description?: string }> {
  if (!schema) return [];

  const suggestions: Array<{ value: string; label: string; description?: string }> = [];

  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
      const fullPath = `{{steps.${nodeId}.data.${key}}}`;
      suggestions.push({
        value: fullPath,
        label: key,
        description: value.description || value.type || 'field'
      });

      // Add nested fields
      if (value.properties) {
        Object.entries(value.properties).forEach(([nestedKey, nestedValue]: [string, any]) => {
          const nestedPath = `{{steps.${nodeId}.data.${key}.${nestedKey}}}`;
          suggestions.push({
            value: nestedPath,
            label: `${key}.${nestedKey}`,
            description: nestedValue.description || nestedValue.type || 'field'
          });
        });
      }
    });
  }

  return suggestions;
}

/**
 * Get type information for a field path from schema
 */
export function getFieldType(schema: JsonSchema | undefined, path: string): string | null {
  if (!schema || !path) return null;

  const parts = path.split('.');
  let current: any = schema;

  for (const part of parts) {
    if (current.properties && current.properties[part]) {
      current = current.properties[part];
    } else {
      return null;
    }
  }

  return current.type || null;
}

/**
 * Validate data against schema (basic validation)
 */
export function validateAgainstSchema(data: any, schema: JsonSchema | undefined): {
  valid: boolean;
  errors: string[];
} {
  if (!schema) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];

  // Check required fields
  if (schema.required && Array.isArray(schema.required)) {
    schema.required.forEach((field: string) => {
      if (!(data && typeof data === 'object' && field in data)) {
        errors.push(`Required field '${field}' is missing`);
      }
    });
  }

  // Check type
  if (schema.type && data !== null && data !== undefined) {
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    if (schema.type !== actualType && !(schema.type === 'number' && actualType === 'number')) {
      // Allow some flexibility
      if (!(schema.type === 'object' && actualType === 'object')) {
        errors.push(`Type mismatch: expected ${schema.type}, got ${actualType}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format schema for display
 */
export function formatSchemaForDisplay(schema: JsonSchema | undefined): string {
  if (!schema) return 'No schema defined';

  const parts: string[] = [];

  if (schema.type) {
    parts.push(`Type: ${schema.type}`);
  }

  if (schema.properties) {
    const propCount = Object.keys(schema.properties).length;
    parts.push(`${propCount} ${propCount === 1 ? 'property' : 'properties'}`);
  }

  if (schema.required && schema.required.length > 0) {
    parts.push(`${schema.required.length} required`);
  }

  return parts.join(', ');
}

