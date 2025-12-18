/**
 * Tests for nodeGroupingUtils
 * 
 * Run tests with: npm run test
 * Watch mode: npm run test:watch
 */

import { describe, it, expect } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import {
  findToolNodesForAgent,
  findLoopBlockNodes,
  findBranchNodes,
  isParentNode,
  findAllChildNodes,
  getNodeGroup,
  isChildOf,
  findParentNode,
} from '../nodeGroupingUtils';

describe('nodeGroupingUtils', () => {
  describe('findToolNodesForAgent', () => {
    it('should find tool nodes connected to an agent', () => {

      const edges: Edge[] = [
        { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
        { id: 'e2', source: 'tool-2', target: 'agent-1', targetHandle: 'tool' },
      ];

      const result = findToolNodesForAgent('agent-1', edges);
      expect(result).toContain('tool-1');
      expect(result).toContain('tool-2');
      expect(result).toHaveLength(2);
    });

    it('should find chat-model and memory nodes', () => {
      const edges: Edge[] = [
        { id: 'e1', source: 'llm-1', target: 'agent-1', targetHandle: 'chat-model' },
        { id: 'e2', source: 'memory-1', target: 'agent-1', targetHandle: 'memory' },
      ];

      const result = findToolNodesForAgent('agent-1', edges);
      expect(result).toContain('llm-1');
      expect(result).toContain('memory-1');
    });

    it('should return empty array if no tools connected', () => {
      const edges: Edge[] = [];
      const result = findToolNodesForAgent('agent-1', edges);
      expect(result).toHaveLength(0);
    });
  });

  describe('findLoopBlockNodes', () => {
    it('should find nodes in a while loop block', () => {
      const edges: Edge[] = [
        { id: 'e1', source: 'while-1', target: 'node-1', sourceHandle: 'loop' },
        { id: 'e2', source: 'node-1', target: 'node-2' },
        { id: 'e3', source: 'node-2', target: 'while-1', targetHandle: 'back' },
      ];

      const result = findLoopBlockNodes('while-1', edges);
      expect(result).toContain('node-1');
      expect(result).toContain('node-2');
      expect(result).toHaveLength(2);
    });

    it('should handle nested loops', () => {
      const edges: Edge[] = [
        { id: 'e1', source: 'while-1', target: 'while-2', sourceHandle: 'loop' },
        { id: 'e2', source: 'while-2', target: 'node-1', sourceHandle: 'loop' },
        { id: 'e3', source: 'node-1', target: 'while-2', targetHandle: 'back' },
        { id: 'e4', source: 'while-2', target: 'while-1', targetHandle: 'back' },
      ];

      const result = findLoopBlockNodes('while-1', edges);
      expect(result).toContain('while-2');
      expect(result).toContain('node-1');
    });
  });

  describe('findBranchNodes', () => {
    it('should find nodes in true branch', () => {
      const edges: Edge[] = [
        { id: 'e1', source: 'ifelse-1', target: 'node-true-1', sourceHandle: 'true' },
        { id: 'e2', source: 'node-true-1', target: 'node-true-2' },
      ];

      const result = findBranchNodes('ifelse-1', 'true', edges);
      expect(result).toContain('node-true-1');
      expect(result).toContain('node-true-2');
    });

    it('should find nodes in false branch', () => {
      const edges: Edge[] = [
        { id: 'e1', source: 'ifelse-1', target: 'node-false-1', sourceHandle: 'false' },
        { id: 'e2', source: 'node-false-1', target: 'node-false-2' },
      ];

      const result = findBranchNodes('ifelse-1', 'false', edges);
      expect(result).toContain('node-false-1');
      expect(result).toContain('node-false-2');
    });
  });

  describe('isParentNode', () => {
    it('should identify agent as parent', () => {
      const node: Node = { id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: {} };
      const edges: Edge[] = [
        { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
      ];

      expect(isParentNode(node, edges)).toBe(true);
    });

    it('should identify while as parent', () => {
      const node: Node = { id: 'while-1', type: 'while', position: { x: 0, y: 0 }, data: {} };
      const edges: Edge[] = [
        { id: 'e1', source: 'while-1', target: 'node-1', sourceHandle: 'loop' },
      ];

      expect(isParentNode(node, edges)).toBe(true);
    });

    it('should identify ifelse as parent', () => {
      const node: Node = { id: 'ifelse-1', type: 'ifelse', position: { x: 0, y: 0 }, data: {} };
      const edges: Edge[] = [
        { id: 'e1', source: 'ifelse-1', target: 'node-1', sourceHandle: 'true' },
      ];

      expect(isParentNode(node, edges)).toBe(true);
    });

    it('should dynamically detect parent based on edge patterns', () => {
      const node: Node = { id: 'custom-1', type: 'custom-parent', position: { x: 0, y: 0 }, data: {} };
      const edges: Edge[] = [
        { id: 'e1', source: 'child-1', target: 'custom-1', targetHandle: 'tool' },
      ];

      expect(isParentNode(node, edges)).toBe(true);
    });

    it('should return false for non-parent nodes', () => {
      const node: Node = { id: 'node-1', type: 'transform', position: { x: 0, y: 0 }, data: {} };
      const edges: Edge[] = [];

      expect(isParentNode(node, edges)).toBe(false);
    });

    it('should identify loop (loop-pair) as parent', () => {
      const node: Node = { id: 'loop-1', type: 'loop', position: { x: 0, y: 0 }, data: { pairId: 'p1' } };
      const edges: Edge[] = [];
      expect(isParentNode(node, edges)).toBe(true);
    });
  });

  describe('findAllChildNodes', () => {
    it('should find all children for an agent', () => {
      const nodes: Node[] = [
        { id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
        { id: 'tool-1', type: 'tool', position: { x: 0, y: 0 }, data: {} },
        { id: 'tool-2', type: 'tool', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
        { id: 'e2', source: 'tool-2', target: 'agent-1', targetHandle: 'tool' },
      ];

      const result = findAllChildNodes('agent-1', 'agent', edges, nodes);
      expect(result).toContain('tool-1');
      expect(result).toContain('tool-2');
    });

    it('should find all children for a while loop', () => {
      const nodes: Node[] = [
        { id: 'while-1', type: 'while', position: { x: 0, y: 0 }, data: {} },
        { id: 'node-1', type: 'transform', position: { x: 0, y: 0 }, data: {} },
        { id: 'node-2', type: 'transform', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: 'while-1', target: 'node-1', sourceHandle: 'loop' },
        { id: 'e2', source: 'node-1', target: 'node-2' },
        { id: 'e3', source: 'node-2', target: 'while-1', targetHandle: 'back' },
      ];

      const result = findAllChildNodes('while-1', 'while', edges, nodes);
      expect(result).toContain('node-1');
      expect(result).toContain('node-2');
    });

    it('should find all children for an ifelse node', () => {
      const nodes: Node[] = [
        { id: 'ifelse-1', type: 'ifelse', position: { x: 0, y: 0 }, data: {} },
        { id: 'node-true-1', type: 'transform', position: { x: 0, y: 0 }, data: {} },
        { id: 'node-false-1', type: 'transform', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: 'ifelse-1', target: 'node-true-1', sourceHandle: 'true' },
        { id: 'e2', source: 'ifelse-1', target: 'node-false-1', sourceHandle: 'false' },
      ];

      const result = findAllChildNodes('ifelse-1', 'ifelse', edges, nodes);
      expect(result).toContain('node-true-1');
      expect(result).toContain('node-false-1');
    });

    it('should find all children for a loop-pair (loop -> end-loop) including end-loop', () => {
      const nodes: Node[] = [
        { id: 'loop-1', type: 'loop', position: { x: 0, y: 0 }, data: { pairId: 'p1' } },
        { id: 'a', type: 'transform', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: 'transform', position: { x: 0, y: 0 }, data: {} },
        { id: 'end-1', type: 'end-loop', position: { x: 0, y: 0 }, data: { pairId: 'p1' } },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: 'loop-1', target: 'a' },
        { id: 'e2', source: 'a', target: 'b' },
        { id: 'e3', source: 'b', target: 'end-1' },
      ];

      const result = findAllChildNodes('loop-1', 'loop', edges, nodes);
      expect(result).toContain('a');
      expect(result).toContain('b');
      expect(result).toContain('end-1');
      expect(result).not.toContain('loop-1');
    });
  });

  describe('getNodeGroup', () => {
    it('should return parent and all children', () => {
      const nodes: Node[] = [
        { id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
        { id: 'tool-1', type: 'tool', position: { x: 0, y: 0 }, data: {} },
        { id: 'tool-2', type: 'tool', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
        { id: 'e2', source: 'tool-2', target: 'agent-1', targetHandle: 'tool' },
      ];

      const result = getNodeGroup('agent-1', 'agent', edges, nodes);
      expect(result.parentId).toBe('agent-1');
      expect(result.childIds).toContain('tool-1');
      expect(result.childIds).toContain('tool-2');
      expect(result.allIds).toContain('agent-1');
      expect(result.allIds).toContain('tool-1');
      expect(result.allIds).toContain('tool-2');
      expect(result.allIds).toHaveLength(3);
    });
  });

  describe('isChildOf', () => {
    it('should return true if node is child of parent', () => {
      const nodes: Node[] = [
        { id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
        { id: 'tool-1', type: 'tool', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
      ];

      expect(isChildOf('tool-1', 'agent-1', edges, nodes)).toBe(true);
    });

    it('should return false if node is not child of parent', () => {
      const nodes: Node[] = [
        { id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
        { id: 'node-1', type: 'transform', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [];

      expect(isChildOf('node-1', 'agent-1', edges, nodes)).toBe(false);
    });
  });

  describe('findParentNode', () => {
    it('should find parent for a child node', () => {
      const nodes: Node[] = [
        { id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
        { id: 'tool-1', type: 'tool', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
      ];

      const result = findParentNode('tool-1', edges, nodes);
      expect(result).toBe('agent-1');
    });

    it('should return null if no parent found', () => {
      const nodes: Node[] = [
        { id: 'node-1', type: 'transform', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [];

      const result = findParentNode('node-1', edges, nodes);
      expect(result).toBeNull();
    });
  });
});

