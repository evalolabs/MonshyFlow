/**
 * Integration Tests for nodeGroupingUtils
 * 
 * Tests the integration of nodeGroupingUtils with React Flow types and real-world scenarios.
 */

import { describe, it, expect } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import {
  findToolNodesForAgent,
  findLoopBlockNodes,
  findBranchNodes,
  findAllChildNodes,
  getNodeGroup,
  isParentNode,
  isChildOf,
  findParentNode,
} from '../nodeGroupingUtils';

describe('nodeGroupingUtils Integration', () => {
  describe('Real-world workflow scenarios', () => {
    it('should handle complex workflow with Agent + Tools + While Loop', () => {
      const nodes: Node[] = [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: {} },
        { id: 'agent-1', type: 'agent', position: { x: 100, y: 0 }, data: {} },
        { id: 'tool-1', type: 'tool', position: { x: 50, y: 100 }, data: {} },
        { id: 'tool-2', type: 'tool', position: { x: 150, y: 100 }, data: {} },
        { id: 'while-1', type: 'while', position: { x: 200, y: 0 }, data: {} },
        { id: 'loop-node-1', type: 'transform', position: { x: 200, y: 100 }, data: {} },
        { id: 'loop-node-2', type: 'transform', position: { x: 200, y: 200 }, data: {} },
      ];

      const edges: Edge[] = [
        // Agent + Tools
        { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
        { id: 'e2', source: 'tool-2', target: 'agent-1', targetHandle: 'tool' },
        // While Loop
        { id: 'e3', source: 'while-1', target: 'loop-node-1', sourceHandle: 'loop' },
        { id: 'e4', source: 'loop-node-1', target: 'loop-node-2' },
        { id: 'e5', source: 'loop-node-2', target: 'while-1', targetHandle: 'back' },
      ];

      // Test Agent + Tools
      const agentTools = findToolNodesForAgent('agent-1', edges);
      expect(agentTools).toContain('tool-1');
      expect(agentTools).toContain('tool-2');
      expect(agentTools).toHaveLength(2);

      // Test While Loop
      const loopNodes = findLoopBlockNodes('while-1', edges);
      expect(loopNodes).toContain('loop-node-1');
      expect(loopNodes).toContain('loop-node-2');
      expect(loopNodes).toHaveLength(2);

      // Test findAllChildNodes for Agent
      const agentChildren = findAllChildNodes('agent-1', 'agent', edges, nodes);
      expect(agentChildren).toContain('tool-1');
      expect(agentChildren).toContain('tool-2');

      // Test findAllChildNodes for While
      const whileChildren = findAllChildNodes('while-1', 'while', edges, nodes);
      expect(whileChildren).toContain('loop-node-1');
      expect(whileChildren).toContain('loop-node-2');
    });

    it('should handle nested loops correctly', () => {
      // Nodes are not needed for this test, only edges
      const edges: Edge[] = [
        // Outer loop: while-outer -> outer-node -> while-inner -> back to while-outer
        { id: 'e1', source: 'while-outer', target: 'outer-node', sourceHandle: 'loop' },
        { id: 'e2', source: 'outer-node', target: 'while-inner' },
        { id: 'e3', source: 'while-inner', target: 'while-outer', targetHandle: 'back' },
        // Inner loop: while-inner -> inner-node -> back to while-inner
        { id: 'e4', source: 'while-inner', target: 'inner-node', sourceHandle: 'loop' },
        { id: 'e5', source: 'inner-node', target: 'while-inner', targetHandle: 'back' },
      ];

      // Outer loop should include all nodes between loop start and back handle
      // This includes outer-node, while-inner, and inner-node (because inner loop is nested)
      const outerLoop = findLoopBlockNodes('while-outer', edges);
      expect(outerLoop).toContain('outer-node');
      expect(outerLoop).toContain('while-inner');
      // inner-node is also included because it's reachable from outer loop (through while-inner)
      expect(outerLoop).toContain('inner-node');

      // Inner loop should only include inner-node
      const innerLoop = findLoopBlockNodes('while-inner', edges);
      expect(innerLoop).toContain('inner-node');
      expect(innerLoop).not.toContain('outer-node');
    });

    it('should handle IfElse with both branches', () => {
      const nodes: Node[] = [
        { id: 'ifelse-1', type: 'ifelse', position: { x: 0, y: 0 }, data: {} },
        { id: 'true-node-1', type: 'transform', position: { x: 0, y: 100 }, data: {} },
        { id: 'true-node-2', type: 'transform', position: { x: 0, y: 200 }, data: {} },
        { id: 'false-node-1', type: 'transform', position: { x: 100, y: 100 }, data: {} },
        { id: 'false-node-2', type: 'transform', position: { x: 100, y: 200 }, data: {} },
      ];

      const edges: Edge[] = [
        // True branch
        { id: 'e1', source: 'ifelse-1', target: 'true-node-1', sourceHandle: 'true' },
        { id: 'e2', source: 'true-node-1', target: 'true-node-2' },
        // False branch
        { id: 'e3', source: 'ifelse-1', target: 'false-node-1', sourceHandle: 'false' },
        { id: 'e4', source: 'false-node-1', target: 'false-node-2' },
      ];

      // Test true branch
      const trueBranch = findBranchNodes('ifelse-1', 'true', edges);
      expect(trueBranch).toContain('true-node-1');
      expect(trueBranch).toContain('true-node-2');

      // Test false branch
      const falseBranch = findBranchNodes('ifelse-1', 'false', edges);
      expect(falseBranch).toContain('false-node-1');
      expect(falseBranch).toContain('false-node-2');

      // Test findAllChildNodes (should include both branches)
      const allChildren = findAllChildNodes('ifelse-1', 'ifelse', edges, nodes);
      expect(allChildren).toContain('true-node-1');
      expect(allChildren).toContain('true-node-2');
      expect(allChildren).toContain('false-node-1');
      expect(allChildren).toContain('false-node-2');
    });

    it('should handle mixed grouping types in one workflow', () => {
      // Nodes are not used in this test, only edges
      const edges: Edge[] = [
        // Agent + Tool
        { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
        // While Loop
        { id: 'e2', source: 'while-1', target: 'loop-node', sourceHandle: 'loop' },
        { id: 'e3', source: 'loop-node', target: 'while-1', targetHandle: 'back' },
        // IfElse
        { id: 'e4', source: 'ifelse-1', target: 'true-node', sourceHandle: 'true' },
      ];

      // All should work independently
      const agentTools = findToolNodesForAgent('agent-1', edges);
      expect(agentTools).toContain('tool-1');

      const loopNodes = findLoopBlockNodes('while-1', edges);
      expect(loopNodes).toContain('loop-node');

      const trueBranch = findBranchNodes('ifelse-1', 'true', edges);
      expect(trueBranch).toContain('true-node');
    });
  });

  describe('Edge cases with real React Flow types', () => {
    it('should handle nodes with minimal required properties', () => {
      // Nodes are not used in this test, only edges
      const edges: Edge[] = [
        { id: 'e1', source: 'node-2', target: 'node-1', targetHandle: 'tool' },
      ];

      const result = findToolNodesForAgent('node-1', edges);
      expect(result).toContain('node-2');
    });

    it('should handle edges with optional properties', () => {
      // Nodes are not used in this test, only edges
      // Edge without sourceHandle (should still work)
      const edges: Edge[] = [
        { 
          id: 'e1', 
          source: 'tool-1', 
          target: 'agent-1', 
          targetHandle: 'tool',
          // No sourceHandle, label, style, etc. - should still work
        },
      ];

      const result = findToolNodesForAgent('agent-1', edges);
      expect(result).toContain('tool-1');
    });

    it('should handle getNodeGroup with all grouping types', () => {
      const nodes: Node[] = [
        { id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
        { id: 'tool-1', type: 'tool', position: { x: 0, y: 0 }, data: {} },
        { id: 'tool-2', type: 'tool', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
        { id: 'e2', source: 'tool-2', target: 'agent-1', targetHandle: 'tool' },
      ];

      const group = getNodeGroup('agent-1', 'agent', edges, nodes);
      expect(group.parentId).toBe('agent-1');
      expect(group.childIds).toContain('tool-1');
      expect(group.childIds).toContain('tool-2');
      expect(group.allIds).toHaveLength(3);
      expect(group.allIds).toContain('agent-1');
      expect(group.allIds).toContain('tool-1');
      expect(group.allIds).toContain('tool-2');
    });

    it('should handle isParentNode with real node objects', () => {
      const agentNode: Node = { id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: {} };
      const whileNode: Node = { id: 'while-1', type: 'while', position: { x: 0, y: 0 }, data: {} };
      const regularNode: Node = { id: 'node-1', type: 'transform', position: { x: 0, y: 0 }, data: {} };

      const edges: Edge[] = [
        { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
        { id: 'e2', source: 'while-1', target: 'node-1', sourceHandle: 'loop' },
      ];

      expect(isParentNode(agentNode, edges)).toBe(true);
      expect(isParentNode(whileNode, edges)).toBe(true);
      expect(isParentNode(regularNode, edges)).toBe(false);
    });

    it('should handle isChildOf and findParentNode with real scenarios', () => {
      const nodes: Node[] = [
        { id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
        { id: 'tool-1', type: 'tool', position: { x: 0, y: 0 }, data: {} },
        { id: 'node-1', type: 'transform', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: 'tool-1', target: 'agent-1', targetHandle: 'tool' },
      ];

      expect(isChildOf('tool-1', 'agent-1', edges, nodes)).toBe(true);
      expect(isChildOf('node-1', 'agent-1', edges, nodes)).toBe(false);

      expect(findParentNode('tool-1', edges, nodes)).toBe('agent-1');
      expect(findParentNode('node-1', edges, nodes)).toBeNull();
    });
  });
});

