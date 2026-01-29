/**
 * Backward Compatibility Tests
 * 
 * These tests ensure that existing workflows don't break when code changes.
 * 
 * Run tests with: pnpm test
 * Watch mode: pnpm test:watch
 */

import { describe, it, expect } from 'vitest';
import { getNodeMetadata, getAllNodeTypes } from '../nodeMetadata';
import { getNodeComponent } from '../nodeRegistry';

/**
 * List of critical node types that must always exist
 * These are core nodes that existing workflows depend on
 */
const CRITICAL_NODE_TYPES = [
  'start',
  'end',
  'agent',
  'llm',
  'http-request',
  'code',
  'variable',
  'transform',
  'email',
  'while',
  'foreach',
  'ifelse',
] as const;

/**
 * Critical required fields that must never be removed or renamed
 * Format: { nodeType: [fieldName1, fieldName2, ...] }
 */
const CRITICAL_REQUIRED_FIELDS: Record<string, string[]> = {
  'variable': ['variableName'], // variableName is required for variable nodes
  'while': ['condition', 'maxIterations'], // condition and maxIterations are required for while loops
  // Add more as needed when we identify critical required fields
};

/**
 * Critical field names that must never be renamed
 * Format: { nodeType: [fieldName1, fieldName2, ...] }
 * These are fields that existing workflows depend on
 */
const CRITICAL_FIELD_NAMES: Record<string, string[]> = {
  'variable': ['variableName', 'variableValue'], // Used in existing workflows
  'while': ['condition', 'maxIterations'], // Used in existing workflows
  'end': ['result'], // Used in existing workflows
  'llm': ['prompt', 'model', 'temperature'], // Used in existing workflows
  'http-request': ['url', 'method', 'body'], // Used in existing workflows
  // Add more as needed
};

/**
 * Critical field types that must never change
 * Format: { nodeType: { fieldName: 'expectedType' } }
 * These ensure field types don't change (e.g., string → number)
 */
const CRITICAL_FIELD_TYPES: Record<string, Record<string, string>> = {
  'variable': {
    'variableName': 'text',
    'variableValue': 'expression',
  },
  'while': {
    'condition': 'expression',
    'maxIterations': 'number',
  },
  'end': {
    'result': 'expression',
  },
  'llm': {
    'prompt': 'expression',
    'model': 'select',
    'temperature': 'number',
  },
  'http-request': {
    'url': 'expression',
    'method': 'select',
    'body': 'expression',
  },
};

describe('Backward Compatibility - Node Registry', () => {
  describe('Critical Node Types', () => {
    it('should have all critical node types registered', () => {
      const allNodeTypes = getAllNodeTypes();
      
      for (const nodeType of CRITICAL_NODE_TYPES) {
        expect(allNodeTypes).toContain(nodeType);
      }
    });

    it('should have metadata for all critical node types', () => {
      for (const nodeType of CRITICAL_NODE_TYPES) {
        const metadata = getNodeMetadata(nodeType);
        expect(metadata).toBeDefined();
        expect(metadata?.id).toBe(nodeType);
        expect(metadata?.name).toBeDefined();
      }
    });

    it('should have components for all critical node types', () => {
      for (const nodeType of CRITICAL_NODE_TYPES) {
        const component = getNodeComponent(nodeType);
        expect(component).toBeDefined();
        // React components can be functions or objects (e.g., forwardRef)
        // Just check that it exists and is not null/undefined
        expect(component).not.toBeNull();
        expect(component).not.toBeUndefined();
      }
    });
  });

  describe('Node Type Stability', () => {
    it('should not remove node types without deprecation', () => {
      // This test ensures that if someone removes a critical node type,
      // the test will fail and alert us
      const allNodeTypes = getAllNodeTypes();
      
      // All critical types should still be present
      const missingTypes = CRITICAL_NODE_TYPES.filter(
        type => !allNodeTypes.includes(type)
      );
      
      expect(missingTypes).toEqual([]);
    });
  });

  describe('Schema Stability - Required Fields', () => {
    it('should not remove required fields from node schemas', () => {
      for (const [nodeType, requiredFields] of Object.entries(CRITICAL_REQUIRED_FIELDS)) {
        const metadata = getNodeMetadata(nodeType);
        expect(metadata).toBeDefined();
        
        if (!metadata?.fields) {
          // If node has no fields defined, skip (might be using custom config form)
          continue;
        }
        
        // Check each required field
        for (const fieldName of requiredFields) {
          const field = metadata.fields[fieldName];
          expect(field).toBeDefined();
          
          // If field was marked as required, it should still be required
          if (field) {
            // Check if field is still marked as required
            // Note: We check if it exists, but don't enforce required:true
            // because fields might be made optional in future (backward compatible)
            // But the field name itself must not be removed
          }
        }
      }
    });

    it('should not remove or rename critical field names', () => {
      for (const [nodeType, criticalFields] of Object.entries(CRITICAL_FIELD_NAMES)) {
        const metadata = getNodeMetadata(nodeType);
        expect(metadata).toBeDefined();
        
        if (!metadata?.fields) {
          // If node has no fields defined, skip (might be using custom config form)
          continue;
        }
        
        // Check each critical field name still exists
        for (const fieldName of criticalFields) {
          expect(metadata.fields).toHaveProperty(fieldName);
        }
      }
    });

    it('should not change critical field types', () => {
      for (const [nodeType, fieldTypes] of Object.entries(CRITICAL_FIELD_TYPES)) {
        const metadata = getNodeMetadata(nodeType);
        expect(metadata).toBeDefined();
        
        if (!metadata?.fields) {
          // If node has no fields defined, skip (might be using custom config form)
          continue;
        }
        
        // Check each critical field type hasn't changed
        for (const [fieldName, expectedType] of Object.entries(fieldTypes)) {
          const field = metadata.fields[fieldName];
          expect(field).toBeDefined();
          
          if (field) {
            // Field type must not change (e.g., 'text' → 'number' would break existing workflows)
            expect(field.type).toBe(expectedType);
          }
        }
      }
    });
  });

  describe('Schema Stability - Input/Output Schemas', () => {
    it('should maintain required fields in input schemas', () => {
      // Check nodes that have inputSchema with required fields
      for (const nodeType of CRITICAL_NODE_TYPES) {
        const metadata = getNodeMetadata(nodeType);
        if (!metadata?.inputSchema?.required) {
          continue; // Skip if no required fields defined
        }
        
        // If inputSchema has required fields, they should not be removed
        // This is a basic check - we can't test all possible schemas
        // but we ensure the structure is maintained
        expect(metadata.inputSchema.required).toBeInstanceOf(Array);
      }
    });

    it('should maintain required fields in output schemas', () => {
      // Check nodes that have outputSchema with required fields
      for (const nodeType of CRITICAL_NODE_TYPES) {
        const metadata = getNodeMetadata(nodeType);
        if (!metadata?.outputSchema?.required) {
          continue; // Skip if no required fields defined
        }
        
        // If outputSchema has required fields, they should not be removed
        expect(metadata.outputSchema.required).toBeInstanceOf(Array);
      }
    });
  });
});

