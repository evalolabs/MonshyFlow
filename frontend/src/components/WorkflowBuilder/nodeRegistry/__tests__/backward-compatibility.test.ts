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
});

