import { describe, it, expect } from 'vitest';
import type { Node, Edge, NodeChange } from '@xyflow/react';
import { expandPositionChangesWithGroupedChildren } from '../groupDrag';

describe('expandPositionChangesWithGroupedChildren', () => {
  it('moves loop-body child nodes when While parent is moved', () => {
    const nodes: Node[] = [
      { id: 'while-1', type: 'while', position: { x: 100, y: 100 }, data: {} },
      { id: 'child-1', type: 'http-request', position: { x: 100, y: 300 }, data: {} },
    ];
    const edges: Edge[] = [
      { id: 'e-loop', source: 'while-1', target: 'child-1', sourceHandle: 'loop', type: 'buttonEdge' },
      { id: 'e-back', source: 'child-1', target: 'while-1', targetHandle: 'back', type: 'buttonEdge' },
    ];

    const changes: NodeChange[] = [
      { id: 'while-1', type: 'position', position: { x: 150, y: 130 } } as any,
    ];

    const expanded = expandPositionChangesWithGroupedChildren(changes, nodes, edges);
    const childMove = expanded.find(c => c.type === 'position' && c.id === 'child-1') as any;
    expect(childMove).toBeDefined();
    expect(childMove.position).toEqual({ x: 150, y: 330 });
  });

  it('does not double-move children already included in position changes (multi-select drag)', () => {
    const nodes: Node[] = [
      { id: 'agent-1', type: 'agent', position: { x: 0, y: 0 }, data: {} },
      { id: 'tool-1', type: 'tool', position: { x: 100, y: 200 }, data: {} },
    ];
    const edges: Edge[] = [
      { id: 'e-t1-a', source: 'tool-1', target: 'agent-1', targetHandle: 'tool', type: 'buttonEdge' },
    ];

    const changes: NodeChange[] = [
      { id: 'agent-1', type: 'position', position: { x: 50, y: 50 } } as any,
      { id: 'tool-1', type: 'position', position: { x: 150, y: 250 } } as any,
    ];

    const expanded = expandPositionChangesWithGroupedChildren(changes, nodes, edges);
    const additionalToolMoves = expanded.filter(c => c.type === 'position' && c.id === 'tool-1');
    expect(additionalToolMoves).toHaveLength(1); // only the original move remains
  });
});


