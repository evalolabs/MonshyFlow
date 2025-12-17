import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Node, Edge } from '@xyflow/react';
import { useNodeOperations } from '../useNodeOperations';

describe('useNodeOperations - duplicate with grouping', () => {
  let onNodesChange: ReturnType<typeof vi.fn>;
  let onEdgesChange: ReturnType<typeof vi.fn>;
  let onAddNodeCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onNodesChange = vi.fn();
    onEdgesChange = vi.fn();
    onAddNodeCallback = vi.fn();
    vi.stubGlobal('alert', vi.fn());
  });

  it('duplicates a single node (no children) without duplicating unrelated edges', () => {
    const nodes: Node[] = [
      { id: 'n1', type: 'transform', position: { x: 0, y: 0 }, data: { label: 'N1' }, selected: false },
      { id: 'n2', type: 'transform', position: { x: 200, y: 0 }, data: { label: 'N2' }, selected: false },
    ];
    const edges: Edge[] = [{ id: 'e1', source: 'n1', target: 'n2', type: 'buttonEdge' }];

    const { result } = renderHook(() =>
      useNodeOperations({
        nodes,
        edges,
        workflowId: undefined,
        onNodesChange,
        onEdgesChange,
        onAddNodeCallback,
      })
    );

    act(() => {
      result.current.duplicateNode(nodes[0]);
    });

    const updatedNodes: Node[] = onNodesChange.mock.calls[0][0];
    const dup = updatedNodes.find(n => n.type === 'transform' && n.selected === true);
    expect(dup).toBeDefined();
    expect(dup?.position.x).toBe(200);
    expect(dup?.position.y).toBe(100);
    expect(dup?.selected).toBe(true);

    // Only internal edges of the duplicated subgraph are duplicated; here there are none.
    const updatedEdges: Edge[] = onEdgesChange.mock.calls[0][0];
    expect(updatedEdges).toHaveLength(1);
    expect(updatedEdges[0].id).toBe('e1');
  });

  it('duplicates Agent with Tools (children) and internal tool edges', () => {
    const nodes: Node[] = [
      { id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Agent' }, selected: false },
      { id: 'tool-1', type: 'tool', position: { x: 100, y: 200 }, data: { label: 'Tool 1' }, selected: false },
      { id: 'tool-2', type: 'tool', position: { x: 200, y: 200 }, data: { label: 'Tool 2' }, selected: false },
    ];
    const edges: Edge[] = [
      { id: 'e-t1-a', source: 'tool-1', target: 'agent-1', sourceHandle: 'tool-output', targetHandle: 'tool', type: 'buttonEdge' },
      { id: 'e-t2-a', source: 'tool-2', target: 'agent-1', sourceHandle: 'tool-output', targetHandle: 'tool', type: 'buttonEdge' },
    ];

    const { result } = renderHook(() =>
      useNodeOperations({
        nodes,
        edges,
        workflowId: undefined,
        onNodesChange,
        onEdgesChange,
        onAddNodeCallback,
      })
    );

    act(() => {
      result.current.duplicateNode(nodes[0]);
    });

    const updatedNodes: Node[] = onNodesChange.mock.calls[0][0];
    const duplicated = updatedNodes.filter(n => n.selected === true);
    expect(duplicated).toHaveLength(3);

    const dupAgent = duplicated.find(n => n.type === 'agent');
    const dupTools = duplicated.filter(n => n.type === 'tool');
    expect(dupAgent).toBeDefined();
    expect(dupTools).toHaveLength(2);

    // Positions should be offset but relative layout preserved
    expect(dupAgent?.position).toEqual({ x: 200, y: 100 });
    expect(dupTools.map(t => t.position.y)).toEqual([300, 300]);

    const updatedEdges: Edge[] = onEdgesChange.mock.calls[0][0];
    const duplicatedIds = new Set(duplicated.map(n => n.id));
    const internalEdges = updatedEdges.filter(e => duplicatedIds.has(e.source) && duplicatedIds.has(e.target));
    // tool -> agent edges (2)
    expect(internalEdges).toHaveLength(2);
    expect(internalEdges.every(e => e.target === dupAgent?.id && e.targetHandle === 'tool')).toBe(true);
  });

  it('duplicates While with loop-body nodes and loop/back edges', () => {
    const nodes: Node[] = [
      { id: 'while-1', type: 'while', position: { x: 0, y: 0 }, data: { label: 'While' }, selected: false },
      { id: 'http-1', type: 'http-request', position: { x: 0, y: 200 }, data: { label: 'HTTP' }, selected: false },
    ];
    const edges: Edge[] = [
      { id: 'e-loop', source: 'while-1', target: 'http-1', sourceHandle: 'loop', type: 'buttonEdge' },
      { id: 'e-back', source: 'http-1', target: 'while-1', targetHandle: 'back', type: 'buttonEdge' },
    ];

    const { result } = renderHook(() =>
      useNodeOperations({
        nodes,
        edges,
        workflowId: undefined,
        onNodesChange,
        onEdgesChange,
        onAddNodeCallback,
      })
    );

    act(() => {
      result.current.duplicateNode(nodes[0]);
    });

    const updatedNodes: Node[] = onNodesChange.mock.calls[0][0];
    const duplicated = updatedNodes.filter(n => n.selected === true);
    expect(duplicated).toHaveLength(2);

    const dupWhile = duplicated.find(n => n.type === 'while')!;
    const dupHttp = duplicated.find(n => n.type === 'http-request')!;
    expect(dupWhile.position).toEqual({ x: 200, y: 100 });
    expect(dupHttp.position).toEqual({ x: 200, y: 300 });

    const updatedEdges: Edge[] = onEdgesChange.mock.calls[0][0];
    const duplicatedIds = new Set(duplicated.map(n => n.id));
    const internalEdges = updatedEdges.filter(e => duplicatedIds.has(e.source) && duplicatedIds.has(e.target));
    const loopEdge = internalEdges.find(e => e.source === dupWhile.id && e.target === dupHttp.id);
    const backEdge = internalEdges.find(e => e.source === dupHttp.id && e.target === dupWhile.id);
    expect(loopEdge?.sourceHandle).toBe('loop');
    expect(backEdge?.targetHandle).toBe('back');
  });
});

describe('useNodeOperations - delete with grouping', () => {
  let onNodesChange: ReturnType<typeof vi.fn>;
  let onEdgesChange: ReturnType<typeof vi.fn>;
  let onAddNodeCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onNodesChange = vi.fn();
    onEdgesChange = vi.fn();
    onAddNodeCallback = vi.fn();
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('deletes While and its loop-body child nodes', async () => {
    const nodes: Node[] = [
      { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
      { id: 'while-1', type: 'while', position: { x: 200, y: 0 }, data: {} },
      { id: 'http-1', type: 'http-request', position: { x: 200, y: 200 }, data: {} },
      { id: 'end', type: 'end', position: { x: 400, y: 0 }, data: {} },
    ];
    const edges: Edge[] = [
      { id: 'e-start-while', source: 'start', target: 'while-1', type: 'buttonEdge' },
      { id: 'e-while-loop', source: 'while-1', target: 'http-1', sourceHandle: 'loop', type: 'buttonEdge' },
      { id: 'e-http-back', source: 'http-1', target: 'while-1', targetHandle: 'back', type: 'buttonEdge' },
      { id: 'e-while-end', source: 'while-1', target: 'end', type: 'buttonEdge' },
    ];

    const { result } = renderHook(() =>
      useNodeOperations({
        nodes,
        edges,
        workflowId: undefined,
        onNodesChange,
        onEdgesChange,
        onAddNodeCallback,
      })
    );

    await act(async () => {
      await result.current.deleteNode('while-1');
    });

    const remainingNodes: Node[] = onNodesChange.mock.calls[0][0];
    const remainingIds = new Set(remainingNodes.map(n => n.id));
    expect(remainingIds.has('while-1')).toBe(false);
    expect(remainingIds.has('http-1')).toBe(false);
    expect(remainingIds.has('start')).toBe(true);
    expect(remainingIds.has('end')).toBe(true);
  });
});


