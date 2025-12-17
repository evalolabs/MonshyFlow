import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import { useEdgeHandling } from '../useEdgeHandling';

describe('useEdgeHandling - prevent shared tools', () => {
  let onEdgesChange: ReturnType<typeof vi.fn>;
  let onAddNodeCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onEdgesChange = vi.fn();
    onAddNodeCallback = vi.fn();
    vi.stubGlobal('alert', vi.fn());
  });

  it('blocks connecting a tool node to a second agent (shared tool)', () => {
    const nodes: Node[] = [
      { id: 'agent-a', type: 'agent', position: { x: 0, y: 0 }, data: {} },
      { id: 'agent-b', type: 'agent', position: { x: 400, y: 0 }, data: {} },
      { id: 'tool-1', type: 'tool', position: { x: 200, y: 200 }, data: {} },
    ];

    const edges: Edge[] = [
      // Tool already connected to agent-a
      { id: 'e1', source: 'tool-1', target: 'agent-a', targetHandle: 'tool', type: 'buttonEdge' },
    ];

    const { result } = renderHook(() =>
      useEdgeHandling({
        nodes,
        edges,
        onEdgesChange,
        onAddNodeCallback,
      })
    );

    // useEdgeHandling has an effect that may normalize edge types and call onEdgesChange once.
    // We only care that handleConnect does NOT add a new edge for the shared-tool connection.
    onEdgesChange.mockClear();

    const connection: Connection = {
      source: 'tool-1',
      target: 'agent-b',
      targetHandle: 'tool',
      sourceHandle: 'tool-output',
    };

    act(() => {
      result.current.handleConnect(connection);
    });

    expect((globalThis as any).alert).toHaveBeenCalled();
    expect(onEdgesChange).not.toHaveBeenCalled();
  });
});


