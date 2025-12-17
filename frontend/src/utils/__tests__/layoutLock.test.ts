import { describe, expect, it } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import { mergeLayoutWithLockedPositions } from '../layoutLock';

describe('layoutLock', () => {
  it('keeps original positions for layoutLocked nodes', () => {
    const originalNodes: Node[] = [
      { id: 'a', type: 'agent', position: { x: 10, y: 20 }, data: { layoutLocked: true } } as any,
      { id: 'b', type: 'transform', position: { x: 50, y: 60 }, data: {} } as any,
    ];

    const edges: Edge[] = [{ id: 'a-b', source: 'a', target: 'b' } as any];

    const layoutedNodes: Node[] = [
      { ...originalNodes[0], position: { x: 999, y: 999 } } as any,
      { ...originalNodes[1], position: { x: 1000, y: 1000 } } as any,
    ];

    const merged = mergeLayoutWithLockedPositions(originalNodes, layoutedNodes, edges);
    const mergedA = merged.find(n => n.id === 'a')!;
    const mergedB = merged.find(n => n.id === 'b')!;

    expect(mergedA.position).toEqual({ x: 10, y: 20 });
    expect(mergedB.position).toEqual({ x: 1000, y: 1000 });
  });
});


