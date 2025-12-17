import { describe, it, expect } from 'vitest';
import type { Edge } from '@xyflow/react';
import { computeReconnectForRemovedSet } from '../reconnectEdges';

describe('computeReconnectForRemovedSet', () => {
  it('reconnects a simple linear chain when a middle node is removed', () => {
    const edges: Edge[] = [
      { id: 'e1', source: 'start', target: 'node1', type: 'buttonEdge' },
      { id: 'e2', source: 'node1', target: 'node2', type: 'buttonEdge' },
      { id: 'e3', source: 'node2', target: 'node3', type: 'buttonEdge' },
      { id: 'e4', source: 'node3', target: 'end', type: 'buttonEdge' },
    ];

    const removed = new Set<string>(['node2']);
    const reconnect = computeReconnectForRemovedSet(edges, removed);
    expect(reconnect).toEqual({ source: 'node1', target: 'node3' });
  });

  it('returns null if the removed set has multiple external incoming/outgoing edges (branching)', () => {
    const edges: Edge[] = [
      { id: 'e1', source: 'nodeA', target: 'nodeX', type: 'buttonEdge' },
      { id: 'e2', source: 'nodeB', target: 'nodeX', type: 'buttonEdge' }, // two incomings
      { id: 'e3', source: 'nodeX', target: 'nodeC', type: 'buttonEdge' },
    ];

    const removed = new Set<string>(['nodeX']);
    const reconnect = computeReconnectForRemovedSet(edges, removed);
    expect(reconnect).toBeNull();
  });
});


