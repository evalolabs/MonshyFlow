/**
 * Tests for useClipboard Hook
 * 
 * Tests copy/paste functionality with various scenarios:
 * - Single node copy/paste
 * - Multiple consecutive copy/paste operations
 * - Multi-select copy/paste with edge connections
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Node, Edge } from '@xyflow/react';
import { useClipboard } from '../useClipboard';

describe('useClipboard', () => {
  let mockNodes: Node[];
  let mockEdges: Edge[];
  let onNodesChange: ReturnType<typeof vi.fn>;
  let onEdgesChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    onNodesChange = vi.fn();
    onEdgesChange = vi.fn();

    // Setup initial nodes and edges
    mockNodes = [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: { label: 'Start' },
      },
      {
        id: 'transform-1',
        type: 'transform',
        position: { x: 200, y: 0 },
        data: { label: 'Transform 1' },
      },
      {
        id: 'transform-2',
        type: 'transform',
        position: { x: 400, y: 0 },
        data: { label: 'Transform 2' },
      },
    ];

    mockEdges = [
      {
        id: 'edge-1',
        source: 'start-1',
        target: 'transform-1',
        type: 'buttonEdge',
      },
      {
        id: 'edge-2',
        source: 'transform-1',
        target: 'transform-2',
        type: 'buttonEdge',
      },
    ];
  });

  describe('Single Node Copy/Paste', () => {
    it('should copy a single node', () => {
      const { result } = renderHook(() =>
        useClipboard({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
        })
      );

      act(() => {
        result.current.copyNodes(['transform-1']);
      });

      // Verify clipboard has data
      expect(result.current.hasClipboardData()).toBe(true);
    });

    it('should paste a single node at a new position', () => {
      const { result } = renderHook(() =>
        useClipboard({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
        })
      );

      // Copy node
      act(() => {
        result.current.copyNodes(['transform-1']);
      });

      // Paste at new position
      act(() => {
        result.current.pasteNodes({ x: 600, y: 0 });
      });

      // Verify onNodesChange was called
      expect(onNodesChange).toHaveBeenCalled();
      const pastedNodes = onNodesChange.mock.calls[0][0];

      // Should have original nodes + 1 pasted node
      expect(pastedNodes.length).toBe(mockNodes.length + 1);

      // Find the pasted node (should have new ID)
      const pastedNode = pastedNodes.find(
        (n: Node) => n.id !== 'transform-1' && n.type === 'transform' && n.selected === true
      );
      expect(pastedNode).toBeDefined();
      // Position calculation: original position (200) + delta (600 - 200 = 400) + visualOffset (50) = 650
      expect(pastedNode?.position.x).toBeGreaterThan(600);
      expect(pastedNode?.selected).toBe(true);
    });

    it('should create new IDs for pasted nodes', () => {
      const { result } = renderHook(() =>
        useClipboard({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
        })
      );

      act(() => {
        result.current.copyNodes(['transform-1']);
      });

      act(() => {
        result.current.pasteNodes({ x: 600, y: 0 });
      });

      const pastedNodes = onNodesChange.mock.calls[0][0];
      // Only the newly pasted node is marked selected=true
      const pastedNode = pastedNodes.find(
        (n: Node) => n.type === 'transform' && n.selected === true
      );

      // Pasted node should have a different ID
      expect(pastedNode?.id).not.toBe('transform-1');
      // generateNodeId() uses timestamp + random suffix for uniqueness
      expect(pastedNode?.id).toMatch(/^transform-\d+-[a-z0-9]+$/);
    });
  });

  describe('Multiple Consecutive Copy/Paste', () => {
    it('should paste multiple times from the same clipboard', () => {
      const { result } = renderHook(() =>
        useClipboard({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
        })
      );

      // Copy once
      act(() => {
        result.current.copyNodes(['transform-1']);
      });

      // Paste first time
      act(() => {
        result.current.pasteNodes({ x: 600, y: 0 });
      });

      const firstPasteNodes = onNodesChange.mock.calls[0][0];
      const firstPastedNode = firstPasteNodes.find(
        (n: Node) => n.type === 'transform' && n.id !== 'transform-1'
      );
      const firstPastedId = firstPastedNode?.id;

      // Paste second time
      act(() => {
        result.current.pasteNodes({ x: 800, y: 0 });
      });

      const secondPasteNodes = onNodesChange.mock.calls[1][0];
      const secondPastedNode = secondPasteNodes.find(
        (n: Node) => n.type === 'transform' && n.id !== 'transform-1' && n.id !== firstPastedId
      );

      // Should create a new node with different ID
      expect(secondPastedNode).toBeDefined();
      expect(secondPastedNode?.id).not.toBe(firstPastedId);
      expect(secondPastedNode?.id).not.toBe('transform-1');
    });

    it('should maintain clipboard data across multiple pastes', () => {
      const { result } = renderHook(() =>
        useClipboard({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
        })
      );

      act(() => {
        result.current.copyNodes(['transform-1']);
      });

      // Paste multiple times
      act(() => {
        result.current.pasteNodes({ x: 600, y: 0 });
      });

      expect(result.current.hasClipboardData()).toBe(true);

      act(() => {
        result.current.pasteNodes({ x: 800, y: 0 });
      });

      expect(result.current.hasClipboardData()).toBe(true);

      act(() => {
        result.current.pasteNodes({ x: 1000, y: 0 });
      });

      expect(result.current.hasClipboardData()).toBe(true);
    });

    it('should update nodes array correctly after multiple pastes', () => {
      const { result } = renderHook(() =>
        useClipboard({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
        })
      );

      act(() => {
        result.current.copyNodes(['transform-1']);
      });

      // First paste
      act(() => {
        result.current.pasteNodes({ x: 600, y: 0 });
      });
      const firstPaste = onNodesChange.mock.calls[0][0];
      expect(firstPaste.length).toBe(mockNodes.length + 1);

      // Update nodes for second paste
      const updatedNodes = firstPaste;
      const { result: result2 } = renderHook(() =>
        useClipboard({
          nodes: updatedNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
        })
      );

      act(() => {
        result2.current.copyNodes(['transform-1']);
      });

      act(() => {
        result2.current.pasteNodes({ x: 800, y: 0 });
      });

      const secondPaste = onNodesChange.mock.calls[1][0];
      // Should have original nodes + 2 pasted nodes
      expect(secondPaste.length).toBe(updatedNodes.length + 1);
    });
  });

  describe('Multi-Select Copy/Paste with Edges', () => {
    it('should copy multiple nodes with their connecting edges', () => {
      const { result } = renderHook(() =>
        useClipboard({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
        })
      );

      // Copy multiple connected nodes
      act(() => {
        result.current.copyNodes(['start-1', 'transform-1']);
      });

      expect(result.current.hasClipboardData()).toBe(true);
    });

    it('should paste multiple nodes with correct edge connections', () => {
      const { result } = renderHook(() =>
        useClipboard({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
        })
      );

      // Copy connected nodes
      act(() => {
        result.current.copyNodes(['start-1', 'transform-1']);
      });

      // Paste
      act(() => {
        result.current.pasteNodes({ x: 600, y: 0 });
      });

      // Verify nodes were pasted
      expect(onNodesChange).toHaveBeenCalled();
      const pastedNodes = onNodesChange.mock.calls[0][0];
      
      // Find pasted nodes (they should be selected)
      const pastedStart = pastedNodes.find(
        (n: Node) => n.type === 'start' && n.id !== 'start-1' && n.selected === true
      );
      const pastedTransform = pastedNodes.find(
        (n: Node) => n.type === 'transform' && n.id !== 'transform-1' && n.selected === true
      );

      expect(pastedStart).toBeDefined();
      expect(pastedTransform).toBeDefined();

      // Verify edges were pasted
      expect(onEdgesChange).toHaveBeenCalled();
      const pastedEdges = onEdgesChange.mock.calls[0][0];
      
      // Find edge connecting the pasted nodes
      const pastedEdge = pastedEdges.find(
        (e: Edge) => {
          const sourceMatch = e.source === pastedStart?.id;
          const targetMatch = e.target === pastedTransform?.id;
          return sourceMatch && targetMatch;
        }
      );

      expect(pastedEdge).toBeDefined();
      if (pastedStart && pastedTransform && pastedEdge) {
        expect(pastedEdge.source).toBe(pastedStart.id);
        expect(pastedEdge.target).toBe(pastedTransform.id);
      }
    });

    it('should maintain edge connections between pasted nodes', () => {
      const nodesWithChain: Node[] = [
        {
          id: 'node-1',
          type: 'transform',
          position: { x: 0, y: 0 },
          data: { label: 'Node 1' },
        },
        {
          id: 'node-2',
          type: 'transform',
          position: { x: 200, y: 0 },
          data: { label: 'Node 2' },
        },
        {
          id: 'node-3',
          type: 'transform',
          position: { x: 400, y: 0 },
          data: { label: 'Node 3' },
        },
      ];

      const edgesWithChain: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          type: 'buttonEdge',
        },
        {
          id: 'edge-2',
          source: 'node-2',
          target: 'node-3',
          type: 'buttonEdge',
        },
      ];

      const { result } = renderHook(() =>
        useClipboard({
          nodes: nodesWithChain,
          edges: edgesWithChain,
          onNodesChange,
          onEdgesChange,
        })
      );

      // Copy all three nodes
      act(() => {
        result.current.copyNodes(['node-1', 'node-2', 'node-3']);
      });

      // Paste
      act(() => {
        result.current.pasteNodes({ x: 600, y: 0 });
      });

      const pastedNodes = onNodesChange.mock.calls[0][0];
      const pastedEdges = onEdgesChange.mock.calls[0][0];

      // Find pasted nodes (should have new IDs)
      const pastedNode1 = pastedNodes.find(
        (n: Node) => n.position.x >= 600 && n.type === 'transform'
      );
      const pastedNode2 = pastedNodes.find(
        (n: Node) => n.position.x >= 800 && n.type === 'transform'
      );
      const pastedNode3 = pastedNodes.find(
        (n: Node) => n.position.x >= 1000 && n.type === 'transform'
      );

      expect(pastedNode1).toBeDefined();
      expect(pastedNode2).toBeDefined();
      expect(pastedNode3).toBeDefined();

      // Verify edges connect the pasted nodes correctly
      const edge1 = pastedEdges.find(
        (e: Edge) => e.source === pastedNode1?.id && e.target === pastedNode2?.id
      );
      const edge2 = pastedEdges.find(
        (e: Edge) => e.source === pastedNode2?.id && e.target === pastedNode3?.id
      );

      expect(edge1).toBeDefined();
      expect(edge2).toBeDefined();
      expect(edge1?.source).toBe(pastedNode1?.id);
      expect(edge1?.target).toBe(pastedNode2?.id);
      expect(edge2?.source).toBe(pastedNode2?.id);
      expect(edge2?.target).toBe(pastedNode3?.id);
    });

    it('should not copy edges that connect to nodes outside the selection', () => {
      const { result } = renderHook(() =>
        useClipboard({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
        })
      );

      // Copy only transform-1 (not start-1 or transform-2)
      act(() => {
        result.current.copyNodes(['transform-1']);
      });

      // Paste
      act(() => {
        result.current.pasteNodes({ x: 600, y: 0 });
      });

      const pastedEdges = onEdgesChange.mock.calls[0][0];

      // Should not have edges connecting to original nodes
      const pastedNode = onNodesChange.mock.calls[0][0].find(
        (n: Node) => n.type === 'transform' && n.id !== 'transform-1'
      );

      // No edges should connect pasted node to original nodes
      const edgesToOriginal = pastedEdges.filter(
        (e: Edge) =>
          (e.source === pastedNode?.id && (e.target === 'start-1' || e.target === 'transform-2')) ||
          (e.target === pastedNode?.id && (e.source === 'start-1' || e.source === 'transform-2'))
      );

      expect(edgesToOriginal).toHaveLength(0);
    });

    it('should copy nodes with grouping (Agent + Tools)', () => {
      const nodesWithAgent: Node[] = [
        {
          id: 'agent-1',
          type: 'agent',
          position: { x: 0, y: 0 },
          data: { label: 'Agent' },
        },
        {
          id: 'tool-1',
          type: 'tool',
          position: { x: 100, y: 100 },
          data: { label: 'Tool 1' },
        },
        {
          id: 'tool-2',
          type: 'tool',
          position: { x: 200, y: 100 },
          data: { label: 'Tool 2' },
        },
      ];

      const edgesWithAgent: Edge[] = [
        {
          id: 'edge-1',
          source: 'tool-1',
          target: 'agent-1',
          targetHandle: 'tool',
          type: 'buttonEdge',
        },
        {
          id: 'edge-2',
          source: 'tool-2',
          target: 'agent-1',
          targetHandle: 'tool',
          type: 'buttonEdge',
        },
      ];

      const { result } = renderHook(() =>
        useClipboard({
          nodes: nodesWithAgent,
          edges: edgesWithAgent,
          onNodesChange,
          onEdgesChange,
        })
      );

      // Copy agent (should include tools)
      act(() => {
        result.current.copyNodes(['agent-1']);
      });

      // Paste
      act(() => {
        result.current.pasteNodes({ x: 600, y: 0 });
      });

      const pastedNodes = onNodesChange.mock.calls[0][0];
      const pastedEdges = onEdgesChange.mock.calls[0][0];

      // Should have pasted agent + 2 tools
      const pastedAgents = pastedNodes.filter((n: Node) => n.type === 'agent' && n.id !== 'agent-1');
      const pastedTools = pastedNodes.filter((n: Node) => n.type === 'tool' && n.id !== 'tool-1' && n.id !== 'tool-2');

      expect(pastedAgents).toHaveLength(1);
      expect(pastedTools).toHaveLength(2);

      // Verify edges connect tools to agent
      const pastedAgent = pastedAgents[0];
      const toolEdges = pastedEdges.filter(
        (e: Edge) => e.target === pastedAgent?.id && e.targetHandle === 'tool'
      );

      expect(toolEdges.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('should not copy if no nodes selected', () => {
      const { result } = renderHook(() =>
        useClipboard({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
        })
      );

      act(() => {
        result.current.copyNodes([]);
      });

      expect(result.current.hasClipboardData()).toBe(false);
    });

    it('should not paste if clipboard is empty', () => {
      const { result } = renderHook(() =>
        useClipboard({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
        })
      );

      act(() => {
        result.current.pasteNodes({ x: 600, y: 0 });
      });

      // Should not call onNodesChange if clipboard is empty
      expect(onNodesChange).not.toHaveBeenCalled();
    });

    it('should handle paste between nodes', () => {
      const { result } = renderHook(() =>
        useClipboard({
          nodes: mockNodes,
          edges: mockEdges,
          onNodesChange,
          onEdgesChange,
        })
      );

      // Copy a node
      act(() => {
        result.current.copyNodes(['transform-1']);
      });

      // Paste between nodes
      act(() => {
        result.current.pasteNodesBetween('start-1', 'transform-2', 'edge-2');
      });

      expect(onNodesChange).toHaveBeenCalled();
      expect(onEdgesChange).toHaveBeenCalled();

      const pastedNodes = onNodesChange.mock.calls[0][0];
      const pastedEdges = onEdgesChange.mock.calls[0][0];

      // Should have inserted node between start-1 and transform-2
      const insertedNode = pastedNodes.find(
        (n: Node) => n.type === 'transform' && n.id !== 'transform-1' && n.id !== 'transform-2'
      );

      expect(insertedNode).toBeDefined();

      // Should have edges: start-1 -> inserted -> transform-2
      const edge1 = pastedEdges.find(
        (e: Edge) => e.source === 'start-1' && e.target === insertedNode?.id
      );
      const edge2 = pastedEdges.find(
        (e: Edge) => e.source === insertedNode?.id && e.target === 'transform-2'
      );

      expect(edge1).toBeDefined();
      expect(edge2).toBeDefined();
    });

    it('should paste multiple connected nodes between nodes correctly (Agent + HTTP Request scenario)', () => {
      // This test reproduces the bug from the browser test:
      // User selects Agent and HTTP Request, copies them, then pastes between Start and End
      // Expected: Start -> pasted-Agent -> pasted-HTTP-Request -> End
      // Bug: Wrong connections are created

      const nodesWithAgent: Node[] = [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 0, y: 0 },
          data: { label: 'Start' },
        },
        {
          id: 'agent-1',
          type: 'agent',
          position: { x: 200, y: 0 },
          data: { label: 'Agent' },
        },
        {
          id: 'http-request-1',
          type: 'http-request',
          position: { x: 400, y: 0 },
          data: { label: 'Salesforce: Get Account' },
        },
        {
          id: 'end-1',
          type: 'end',
          position: { x: 600, y: 0 },
          data: { label: 'End' },
        },
      ];

      const edgesWithAgent: Edge[] = [
        {
          id: 'edge-start-agent',
          source: 'start-1',
          target: 'agent-1',
          type: 'buttonEdge',
        },
        {
          id: 'edge-agent-http',
          source: 'agent-1',
          target: 'http-request-1',
          type: 'buttonEdge',
        },
        {
          id: 'edge-http-end',
          source: 'http-request-1',
          target: 'end-1',
          type: 'buttonEdge',
        },
      ];

      const { result } = renderHook(() =>
        useClipboard({
          nodes: nodesWithAgent,
          edges: edgesWithAgent,
          onNodesChange,
          onEdgesChange,
        })
      );

      // Copy Agent and HTTP Request (multi-select)
      act(() => {
        result.current.copyNodes(['agent-1', 'http-request-1']);
      });

      // Paste between Start and End (on the edge-http-end edge)
      act(() => {
        result.current.pasteNodesBetween('http-request-1', 'end-1', 'edge-http-end');
      });

      expect(onNodesChange).toHaveBeenCalled();
      expect(onEdgesChange).toHaveBeenCalled();

      const pastedNodes = onNodesChange.mock.calls[0][0];
      const pastedEdges = onEdgesChange.mock.calls[0][0];

      // Find pasted nodes
      const pastedAgent = pastedNodes.find(
        (n: Node) => n.type === 'agent' && n.id !== 'agent-1' && n.selected === true
      );
      const pastedHttpRequest = pastedNodes.find(
        (n: Node) => n.type === 'http-request' && n.id !== 'http-request-1' && n.selected === true
      );

      expect(pastedAgent).toBeDefined();
      expect(pastedHttpRequest).toBeDefined();

      // Verify correct edge connections:
      // 1. http-request-1 -> pastedAgent (source to first pasted node)
      // 2. pastedAgent -> pastedHttpRequest (internal edge between pasted nodes)
      // 3. pastedHttpRequest -> end-1 (last pasted node to target)

      const edge1 = pastedEdges.find(
        (e: Edge) => e.source === 'http-request-1' && e.target === pastedAgent?.id
      );
      const edge2 = pastedEdges.find(
        (e: Edge) => e.source === pastedAgent?.id && e.target === pastedHttpRequest?.id
      );
      const edge3 = pastedEdges.find(
        (e: Edge) => e.source === pastedHttpRequest?.id && e.target === 'end-1'
      );

      // These should all exist
      expect(edge1).toBeDefined();
      expect(edge2).toBeDefined();
      expect(edge3).toBeDefined();

      // Verify NO incorrect connections:
      // - start-1 should NOT connect to pastedHttpRequest directly
      // - pastedAgent should NOT connect to agent-1 (original)
      // - pastedHttpRequest should NOT connect to http-request-1 (original)

      const wrongEdge1 = pastedEdges.find(
        (e: Edge) => e.source === 'start-1' && e.target === pastedHttpRequest?.id
      );
      const wrongEdge2 = pastedEdges.find(
        (e: Edge) => e.source === pastedAgent?.id && e.target === 'agent-1'
      );
      const wrongEdge3 = pastedEdges.find(
        (e: Edge) => e.source === pastedHttpRequest?.id && e.target === 'http-request-1'
      );

      expect(wrongEdge1).toBeUndefined();
      expect(wrongEdge2).toBeUndefined();
      expect(wrongEdge3).toBeUndefined();

      // Verify original edge was removed
      const originalEdge = pastedEdges.find((e: Edge) => e.id === 'edge-http-end');
      expect(originalEdge).toBeUndefined();
    });

    it('should reproduce bug: paste between Start and Agent creates wrong connections when nodes are in wrong order', () => {
      // This test reproduces the exact bug from MongoDB data:
      // User copies Agent + HTTP Request, then pastes on edge between Start and Agent
      // Bug: Creates wrong edges like start->pastedHttpRequest and pastedAgent->originalAgent

      // IMPORTANT: Nodes are in wrong order - HTTP Request comes BEFORE Agent in the array
      // This simulates the bug where nodes.filter() returns nodes in array order, not chain order
      // When user selects Agent and HTTP Request, if HTTP Request is first in the nodes array,
      // then nodesToPaste[0] will be HTTP Request (wrong!), causing wrong edge connections
      const nodesScenario: Node[] = [
        {
          id: 'start-1765894226954',
          type: 'start',
          position: { x: 40, y: 40 },
          data: { label: 'Start' },
        },
        {
          id: 'http-request-1765894234714', // HTTP Request comes FIRST in array (wrong order!)
          type: 'http-request',
          position: { x: 840, y: 270 },
          data: { label: 'Salesforce: Get Account' },
        },
        {
          id: 'agent-1765894237899', // Agent comes SECOND in array
          type: 'agent',
          position: { x: 440, y: 270 },
          data: { label: 'Agent' },
        },
        {
          id: 'end-1765894232119',
          type: 'end',
          position: { x: 1240, y: 270 },
          data: { label: 'End' },
        },
      ];

      const edgesScenario: Edge[] = [
        {
          id: 'edge-start-agent',
          source: 'start-1765894226954',
          target: 'agent-1765894237899',
          type: 'buttonEdge',
        },
        {
          id: 'edge-agent-http',
          source: 'agent-1765894237899',
          target: 'http-request-1765894234714',
          type: 'buttonEdge',
        },
        {
          id: 'edge-http-end',
          source: 'http-request-1765894234714',
          target: 'end-1765894232119',
          type: 'buttonEdge',
        },
      ];

      const { result } = renderHook(() =>
        useClipboard({
          nodes: nodesScenario,
          edges: edgesScenario,
          onNodesChange,
          onEdgesChange,
        })
      );

      // Copy Agent and HTTP Request (multi-select) - as user did
      // NOTE: The order in which nodes are selected might affect the order in nodesToCopy
      // If user selects HTTP Request first, then Agent, the array might be in wrong order
      act(() => {
        result.current.copyNodes(['agent-1765894237899', 'http-request-1765894234714']);
      });
      
      // Simulate the bug: if nodes are copied in wrong order (HTTP Request first),
      // then nodesToPaste[0] will be HTTP Request, not Agent
      // This causes wrong edge connections

      // Paste between Start and Agent (on edge-start-agent) - as user did
      act(() => {
        result.current.pasteNodesBetween('start-1765894226954', 'agent-1765894237899', 'edge-start-agent');
      });

      expect(onNodesChange).toHaveBeenCalled();
      expect(onEdgesChange).toHaveBeenCalled();

      const pastedNodes = onNodesChange.mock.calls[0][0];
      const pastedEdges = onEdgesChange.mock.calls[0][0];

      // Find pasted nodes
      const pastedAgent = pastedNodes.find(
        (n: Node) => n.type === 'agent' && n.id !== 'agent-1765894237899' && n.selected === true
      );
      const pastedHttpRequest = pastedNodes.find(
        (n: Node) => n.type === 'http-request' && n.id !== 'http-request-1765894234714' && n.selected === true
      );

      expect(pastedAgent).toBeDefined();
      expect(pastedHttpRequest).toBeDefined();

      // CORRECT connections should be:
      // 1. start-1765894226954 -> pastedAgent (first node in chain)
      // 2. pastedAgent -> pastedHttpRequest (internal edge)
      // 3. pastedHttpRequest -> agent-1765894237899 (original agent - last node in chain)

      const correctEdge1 = pastedEdges.find(
        (e: Edge) => e.source === 'start-1765894226954' && e.target === pastedAgent?.id
      );
      const correctEdge2 = pastedEdges.find(
        (e: Edge) => e.source === pastedAgent?.id && e.target === pastedHttpRequest?.id
      );
      const correctEdge3 = pastedEdges.find(
        (e: Edge) => e.source === pastedHttpRequest?.id && e.target === 'agent-1765894237899'
      );

      // BUG: These wrong connections should NOT exist (but they do in MongoDB):
      // 1. start-1765894226954 -> pastedHttpRequest (WRONG - should go to pastedAgent)
      // 2. pastedAgent -> agent-1765894237899 (WRONG - should go to pastedHttpRequest)

      const bugEdge1 = pastedEdges.find(
        (e: Edge) => e.source === 'start-1765894226954' && e.target === pastedHttpRequest?.id
      );
      const bugEdge2 = pastedEdges.find(
        (e: Edge) => e.source === pastedAgent?.id && e.target === 'agent-1765894237899'
      );

      // The bug occurs when nodesToPaste[0] is NOT the first node in the chain
      // If nodes are copied in wrong order (e.g., HTTP Request before Agent in the array),
      // then pasteNodesBetween uses the wrong node as firstPastedNode
      
      // BUG REPRODUCTION: When nodes are in wrong order in the array,
      // nodesToPaste[0] will be HTTP Request (not Agent), causing:
      // - Start -> HTTP Request (WRONG! Should be Start -> Agent)
      // - Agent -> Original Agent (WRONG! Should be Agent -> HTTP Request)
      
      // This test documents the bug - it will fail until the bug is fixed
      // The fix requires sorting nodesToPaste by chain order, not array order
      
      if (bugEdge1) {
        console.error('❌ BUG REPRODUCED: Start connects to HTTP Request instead of Agent!');
        console.error('   Root cause: nodesToPaste[0] is HTTP Request (wrong order in array)');
        console.error('   Fix: Sort nodesToPaste by chain order using edges');
      }
      
      if (bugEdge2) {
        console.error('❌ BUG REPRODUCED: Pasted Agent connects to original Agent instead of HTTP Request!');
        console.error('   Root cause: nodesToPaste is not sorted by chain order');
        console.error('   Fix: Sort nodesToPaste by chain order using edges');
      }

      // Document the bug - these edges should NOT exist
      // The test will fail until the bug is fixed in useClipboard.ts
      if (bugEdge1 || bugEdge2) {
        console.error('🔴 BUG CONFIRMED: Wrong edge connections created due to node order issue');
        console.error('   Expected: Start -> Agent -> HTTP Request -> Original Agent');
        console.error('   Actual: Wrong connections due to nodesToPaste[0] being wrong node');
      }

      // These assertions will fail until the bug is fixed
      // The bug is: nodesToPaste[0] should be the first node in the chain (Agent),
      // but it's the first node in the array (HTTP Request when array is in wrong order)
      expect(bugEdge1).toBeUndefined();
      expect(bugEdge2).toBeUndefined();
      
      // Verify correct edges exist (these should always exist)
      expect(correctEdge1).toBeDefined();
      expect(correctEdge2).toBeDefined();
      expect(correctEdge3).toBeDefined();
    });

    it('should paste Agent with Tools between Start and Agent correctly (central node detection)', () => {
      // This test verifies the fix for Agent + Tools paste between nodes
      // Scenario: User copies Agent (with 2 Tools), then pastes on edge between Start and Agent
      // Expected: Start -> pastedAgent -> originalAgent
      // Tools should be connected to pastedAgent internally
      
      const nodesWithAgentAndTools: Node[] = [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 40, y: 40 },
          data: { label: 'Start' },
        },
        {
          id: 'agent-1',
          type: 'agent',
          position: { x: 440, y: 40 },
          data: { label: 'Agent' },
        },
        {
          id: 'end-1',
          type: 'end',
          position: { x: 840, y: 40 },
          data: { label: 'End' },
        },
        {
          id: 'tool-1',
          type: 'tool',
          position: { x: 590, y: 250 },
          data: { label: 'Mcp Server' },
        },
        {
          id: 'tool-2',
          type: 'tool',
          position: { x: 710, y: 250 },
          data: { label: 'Mcp Server' },
        },
      ];

      const edgesWithAgentAndTools: Edge[] = [
        {
          id: 'edge-start-agent',
          source: 'start-1',
          target: 'agent-1',
          type: 'buttonEdge',
        },
        {
          id: 'edge-agent-end',
          source: 'agent-1',
          target: 'end-1',
          type: 'buttonEdge',
        },
        {
          id: 'edge-tool1-agent',
          source: 'tool-1',
          target: 'agent-1',
          sourceHandle: 'tool-output',
          targetHandle: 'tool',
          type: 'buttonEdge',
        },
        {
          id: 'edge-tool2-agent',
          source: 'tool-2',
          target: 'agent-1',
          sourceHandle: 'tool-output',
          targetHandle: 'tool',
          type: 'buttonEdge',
        },
      ];

      const { result } = renderHook(() =>
        useClipboard({
          nodes: nodesWithAgentAndTools,
          edges: edgesWithAgentAndTools,
          onNodesChange,
          onEdgesChange,
        })
      );

      // Copy Agent (which should automatically include Tools via grouping)
      act(() => {
        result.current.copyNodes(['agent-1']);
      });

      // Paste between Start and Agent (on edge-start-agent)
      act(() => {
        result.current.pasteNodesBetween('start-1', 'agent-1', 'edge-start-agent');
      });

      expect(onNodesChange).toHaveBeenCalled();
      expect(onEdgesChange).toHaveBeenCalled();

      const pastedNodes = onNodesChange.mock.calls[0][0];
      const pastedEdges = onEdgesChange.mock.calls[0][0];

      // Find pasted nodes
      const pastedAgent = pastedNodes.find(
        (n: Node) => n.type === 'agent' && n.id !== 'agent-1' && n.selected === true
      );
      const pastedTool1 = pastedNodes.find(
        (n: Node) => n.type === 'tool' && n.id !== 'tool-1' && n.id !== 'tool-2' && n.selected === true
      );
      const pastedTool2 = pastedNodes.find(
        (n: Node) => n.type === 'tool' && n.id !== pastedTool1?.id && n.selected === true
      );

      // Verify all nodes were pasted
      expect(pastedAgent).toBeDefined();
      expect(pastedTool1).toBeDefined();
      expect(pastedTool2).toBeDefined();
      
      // Verify unique IDs (no duplicates)
      const pastedNodeIds = pastedNodes
        .filter((n: Node) => n.selected === true)
        .map((n: Node) => n.id);
      const uniqueIds = new Set(pastedNodeIds);
      expect(pastedNodeIds.length).toBe(uniqueIds.size); // All IDs should be unique

      // Verify correct edge connections:
      // 1. start-1 -> pastedAgent (source to central node - Agent is entry)
      // 2. pastedTool1 -> pastedAgent (internal edge - tool connection)
      // 3. pastedTool2 -> pastedAgent (internal edge - tool connection)
      // 4. pastedAgent -> agent-1 (central node to target - Agent is exit)

      const edgeStartToAgent = pastedEdges.find(
        (e: Edge) => e.source === 'start-1' && e.target === pastedAgent?.id
      );
      const edgeTool1ToAgent = pastedEdges.find(
        (e: Edge) => e.source === pastedTool1?.id && e.target === pastedAgent?.id
      );
      const edgeTool2ToAgent = pastedEdges.find(
        (e: Edge) => e.source === pastedTool2?.id && e.target === pastedAgent?.id
      );
      const edgeAgentToOriginal = pastedEdges.find(
        (e: Edge) => e.source === pastedAgent?.id && e.target === 'agent-1'
      );

      // All edges should exist
      expect(edgeStartToAgent).toBeDefined();
      expect(edgeTool1ToAgent).toBeDefined();
      expect(edgeTool2ToAgent).toBeDefined();
      expect(edgeAgentToOriginal).toBeDefined();

      // Verify tool edges have correct handles
      expect(edgeTool1ToAgent?.sourceHandle).toBe('tool-output');
      expect(edgeTool1ToAgent?.targetHandle).toBe('tool');
      expect(edgeTool2ToAgent?.sourceHandle).toBe('tool-output');
      expect(edgeTool2ToAgent?.targetHandle).toBe('tool');

      // Verify NO incorrect connections:
      // - start-1 should NOT connect to tools directly
      // - tools should NOT connect to original agent
      // - pastedAgent should NOT connect to tools (tools connect TO agent)

      const wrongEdge1 = pastedEdges.find(
        (e: Edge) => e.source === 'start-1' && (e.target === pastedTool1?.id || e.target === pastedTool2?.id)
      );
      const wrongEdge2 = pastedEdges.find(
        (e: Edge) => (e.source === pastedTool1?.id || e.source === pastedTool2?.id) && e.target === 'agent-1'
      );
      const wrongEdge3 = pastedEdges.find(
        (e: Edge) => e.source === pastedAgent?.id && (e.target === pastedTool1?.id || e.target === pastedTool2?.id)
      );

      expect(wrongEdge1).toBeUndefined();
      expect(wrongEdge2).toBeUndefined();
      expect(wrongEdge3).toBeUndefined();

      // Verify original edge was removed
      const originalEdge = pastedEdges.find((e: Edge) => e.id === 'edge-start-agent');
      expect(originalEdge).toBeUndefined();

      // Verify no duplicate edge IDs
      const edgeIds = pastedEdges.map((e: Edge) => e.id);
      const uniqueEdgeIds = new Set(edgeIds);
      expect(edgeIds.length).toBe(uniqueEdgeIds.size); // All edge IDs should be unique
    });

    it('should paste Agent + While group between nodes with Agent as entry and While as exit (ignore loop/back edges)', () => {
      // Regression test for multi-select of multiple parent nodes:
      // When copying Agent + While (and While has loop/back edges), entry must be Agent (not While),
      // and exit must be While (not Agent), so paste-between wires: Source -> Agent -> While -> Target.

      const nodesScenario: Node[] = [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 40, y: 40 },
          data: { label: 'Start' },
        },
        {
          id: 'end-1',
          type: 'end',
          position: { x: 840, y: 40 },
          data: { label: 'End' },
        },
        {
          id: 'agent-1',
          type: 'agent',
          position: { x: 240, y: 40 },
          data: { label: 'Agent' },
        },
        {
          id: 'while-1',
          type: 'while',
          position: { x: 440, y: 40 },
          data: { label: 'While' },
        },
        {
          id: 'http-request-1',
          type: 'http-request',
          position: { x: 440, y: 260 },
          data: { label: 'Loop HTTP' },
        },
      ];

      const edgesScenario: Edge[] = [
        {
          id: 'edge-start-end',
          source: 'start-1',
          target: 'end-1',
          type: 'buttonEdge',
        },
        {
          id: 'edge-agent-while',
          source: 'agent-1',
          target: 'while-1',
          type: 'buttonEdge',
        },
        {
          id: 'edge-while-loop',
          source: 'while-1',
          target: 'http-request-1',
          sourceHandle: 'loop',
          type: 'buttonEdge',
        },
        {
          id: 'edge-http-back',
          source: 'http-request-1',
          target: 'while-1',
          targetHandle: 'back',
          type: 'buttonEdge',
        },
      ];

      const { result } = renderHook(() =>
        useClipboard({
          nodes: nodesScenario,
          edges: edgesScenario,
          onNodesChange,
          onEdgesChange,
        })
      );

      // Multi-select copy: Agent + While (While should include its loop body via grouping)
      act(() => {
        result.current.copyNodes(['agent-1', 'while-1']);
      });

      // Paste between Start and End (on edge-start-end)
      act(() => {
        result.current.pasteNodesBetween('start-1', 'end-1', 'edge-start-end');
      });

      expect(onNodesChange).toHaveBeenCalled();
      expect(onEdgesChange).toHaveBeenCalled();

      const pastedNodes = onNodesChange.mock.calls[0][0];
      const pastedEdges = onEdgesChange.mock.calls[0][0];

      const pastedAgent = pastedNodes.find(
        (n: Node) => n.type === 'agent' && n.id !== 'agent-1' && n.selected === true
      );
      const pastedWhile = pastedNodes.find(
        (n: Node) => n.type === 'while' && n.id !== 'while-1' && n.selected === true
      );
      const pastedHttp = pastedNodes.find(
        (n: Node) => n.type === 'http-request' && n.id !== 'http-request-1' && n.selected === true
      );

      expect(pastedAgent).toBeDefined();
      expect(pastedWhile).toBeDefined();
      expect(pastedHttp).toBeDefined(); // loop body should be copied via grouping

      // Required wiring:
      // 1) start -> pastedAgent (entry)
      // 2) pastedAgent -> pastedWhile (internal "flow" edge)
      // 3) pastedWhile -> end (exit)
      const edgeStartToPastedAgent = pastedEdges.find(
        (e: Edge) => e.source === 'start-1' && e.target === pastedAgent?.id
      );
      const edgePastedAgentToPastedWhile = pastedEdges.find(
        (e: Edge) => e.source === pastedAgent?.id && e.target === pastedWhile?.id
      );
      const edgePastedWhileToEnd = pastedEdges.find(
        (e: Edge) => e.source === pastedWhile?.id && e.target === 'end-1'
      );

      expect(edgeStartToPastedAgent).toBeDefined();
      expect(edgePastedAgentToPastedWhile).toBeDefined();
      expect(edgePastedWhileToEnd).toBeDefined();

      // Loop edges must stay internal:
      const edgePastedWhileToPastedHttp = pastedEdges.find(
        (e: Edge) =>
          e.source === pastedWhile?.id &&
          e.target === pastedHttp?.id &&
          e.sourceHandle === 'loop'
      );
      const edgePastedHttpBackToPastedWhile = pastedEdges.find(
        (e: Edge) =>
          e.source === pastedHttp?.id &&
          e.target === pastedWhile?.id &&
          e.targetHandle === 'back'
      );

      expect(edgePastedWhileToPastedHttp).toBeDefined();
      expect(edgePastedHttpBackToPastedWhile).toBeDefined();

      // Guardrails: these wrong edges must NOT exist.
      const wrongStartToWhile = pastedEdges.find(
        (e: Edge) => e.source === 'start-1' && e.target === pastedWhile?.id
      );
      const wrongStartToHttp = pastedEdges.find(
        (e: Edge) => e.source === 'start-1' && e.target === pastedHttp?.id
      );
      const wrongAgentToEnd = pastedEdges.find(
        (e: Edge) => e.source === pastedAgent?.id && e.target === 'end-1'
      );

      expect(wrongStartToWhile).toBeUndefined();
      expect(wrongStartToHttp).toBeUndefined();
      expect(wrongAgentToEnd).toBeUndefined();

      // Verify original edge was removed
      const originalEdge = pastedEdges.find((e: Edge) => e.id === 'edge-start-end');
      expect(originalEdge).toBeUndefined();
    });

    it('should paste Foreach with Loop-Block between nodes correctly (loop node detection)', () => {
      // This test verifies the fix for Foreach + Loop-Block paste between nodes
      // Scenario: User copies Foreach (with 2 HTTP Requests in loop block), then pastes on edge between Start and Email
      // Expected: Start -> pastedForeach -> Email
      // Loop-Block nodes should be connected internally with loop/back handles
      
      const nodesWithForeachAndLoop: Node[] = [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 40, y: 40 },
          data: { label: 'Start' },
        },
        {
          id: 'email-1',
          type: 'email',
          position: { x: 440, y: 40 },
          data: { label: 'Email' },
        },
        {
          id: 'foreach-1',
          type: 'foreach',
          position: { x: 840, y: 40 },
          data: { label: 'Foreach' },
        },
        {
          id: 'http-request-1',
          type: 'http-request',
          position: { x: 840, y: 290 },
          data: { label: 'HubSpot: Search Deals' },
        },
        {
          id: 'http-request-2',
          type: 'http-request',
          position: { x: 1110, y: 350 },
          data: { label: 'Pipedrive: Get Activity' },
        },
      ];

      const edgesWithForeachAndLoop: Edge[] = [
        {
          id: 'edge-start-email',
          source: 'start-1',
          target: 'email-1',
          type: 'buttonEdge',
        },
        {
          id: 'edge-foreach-loop',
          source: 'foreach-1',
          target: 'http-request-1',
          sourceHandle: 'loop',
          targetHandle: undefined,
          type: 'buttonEdge',
        },
        {
          id: 'edge-http1-http2',
          source: 'http-request-1',
          target: 'http-request-2',
          type: 'buttonEdge',
        },
        {
          id: 'edge-http2-back',
          source: 'http-request-2',
          target: 'foreach-1',
          targetHandle: 'back',
          type: 'buttonEdge',
        },
      ];

      const { result } = renderHook(() =>
        useClipboard({
          nodes: nodesWithForeachAndLoop,
          edges: edgesWithForeachAndLoop,
          onNodesChange,
          onEdgesChange,
        })
      );

      // Copy Foreach (which should automatically include Loop-Block nodes via grouping)
      act(() => {
        result.current.copyNodes(['foreach-1']);
      });

      // Paste between Start and Email (on edge-start-email)
      act(() => {
        result.current.pasteNodesBetween('start-1', 'email-1', 'edge-start-email');
      });

      expect(onNodesChange).toHaveBeenCalled();
      expect(onEdgesChange).toHaveBeenCalled();

      const pastedNodes = onNodesChange.mock.calls[0][0];
      const pastedEdges = onEdgesChange.mock.calls[0][0];

      // Find pasted nodes
      const pastedForeach = pastedNodes.find(
        (n: Node) => n.type === 'foreach' && n.id !== 'foreach-1' && n.selected === true
      );
      const pastedHttp1 = pastedNodes.find(
        (n: Node) => n.type === 'http-request' && n.id !== 'http-request-1' && n.id !== 'http-request-2' && n.selected === true
      );
      const pastedHttp2 = pastedNodes.find(
        (n: Node) => n.type === 'http-request' && n.id !== pastedHttp1?.id && n.selected === true
      );

      // Verify all nodes were pasted
      expect(pastedForeach).toBeDefined();
      expect(pastedHttp1).toBeDefined();
      expect(pastedHttp2).toBeDefined();
      
      // Verify unique IDs (no duplicates)
      const pastedNodeIds = pastedNodes
        .filter((n: Node) => n.selected === true)
        .map((n: Node) => n.id);
      const uniqueIds = new Set(pastedNodeIds);
      expect(pastedNodeIds.length).toBe(uniqueIds.size); // All IDs should be unique

      // Verify correct edge connections:
      // 1. start-1 -> pastedForeach (source to loop node - Foreach is entry)
      // 2. pastedForeach -> pastedHttp1 (loop edge with sourceHandle='loop')
      // 3. pastedHttp1 -> pastedHttp2 (internal edge in loop block)
      // 4. pastedHttp2 -> pastedForeach (back edge with targetHandle='back')
      // 5. pastedForeach -> email-1 (loop node to target - Foreach is exit)

      const edgeStartToForeach = pastedEdges.find(
        (e: Edge) => e.source === 'start-1' && e.target === pastedForeach?.id
      );
      const edgeForeachToHttp1 = pastedEdges.find(
        (e: Edge) => e.source === pastedForeach?.id && e.target === pastedHttp1?.id && e.sourceHandle === 'loop'
      );
      const edgeHttp1ToHttp2 = pastedEdges.find(
        (e: Edge) => e.source === pastedHttp1?.id && e.target === pastedHttp2?.id
      );
      const edgeHttp2ToForeach = pastedEdges.find(
        (e: Edge) => e.source === pastedHttp2?.id && e.target === pastedForeach?.id && e.targetHandle === 'back'
      );
      const edgeForeachToEmail = pastedEdges.find(
        (e: Edge) => e.source === pastedForeach?.id && e.target === 'email-1'
      );

      // All edges should exist
      expect(edgeStartToForeach).toBeDefined();
      expect(edgeForeachToHttp1).toBeDefined();
      expect(edgeHttp1ToHttp2).toBeDefined();
      expect(edgeHttp2ToForeach).toBeDefined();
      expect(edgeForeachToEmail).toBeDefined();

      // Verify loop edges have correct handles
      expect(edgeForeachToHttp1?.sourceHandle).toBe('loop');
      expect(edgeHttp2ToForeach?.targetHandle).toBe('back');

      // Verify NO incorrect connections:
      // - start-1 should NOT connect to loop block nodes directly
      // - loop block nodes should NOT connect to email-1 directly
      // - pastedForeach should NOT connect to original foreach

      const wrongEdge1 = pastedEdges.find(
        (e: Edge) => e.source === 'start-1' && (e.target === pastedHttp1?.id || e.target === pastedHttp2?.id)
      );
      const wrongEdge2 = pastedEdges.find(
        (e: Edge) => (e.source === pastedHttp1?.id || e.source === pastedHttp2?.id) && e.target === 'email-1'
      );
      const wrongEdge3 = pastedEdges.find(
        (e: Edge) => e.source === pastedForeach?.id && e.target === 'foreach-1'
      );

      expect(wrongEdge1).toBeUndefined();
      expect(wrongEdge2).toBeUndefined();
      expect(wrongEdge3).toBeUndefined();

      // Verify original edge was removed
      const originalEdge = pastedEdges.find((e: Edge) => e.id === 'edge-start-email');
      expect(originalEdge).toBeUndefined();

      // Verify no duplicate edge IDs
      const edgeIds = pastedEdges.map((e: Edge) => e.id);
      const uniqueEdgeIds = new Set(edgeIds);
      expect(edgeIds.length).toBe(uniqueEdgeIds.size); // All edge IDs should be unique
    });
  });
});

