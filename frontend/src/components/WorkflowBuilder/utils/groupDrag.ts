import type { Node, Edge, NodeChange } from '@xyflow/react';
import { isParentNode, findAllChildNodes } from '../../../utils/nodeGroupingUtils';

type PositionChange = NodeChange & { type: 'position'; position?: { x: number; y: number } };

/**
 * If a parent node is moved (position change), move its children by the same delta.
 * Skips children that are already being moved by ReactFlow in the same change batch
 * (prevents double movement when multi-select drag moves multiple nodes).
 */
export function expandPositionChangesWithGroupedChildren(
  changes: NodeChange[],
  nodes: Node[],
  edges: Edge[]
): NodeChange[] {
  const positionChanges = changes.filter(c => c.type === 'position') as PositionChange[];
  if (positionChanges.length === 0) return changes;

  const movedIds = new Set(positionChanges.map(c => c.id));
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  const additional: NodeChange[] = [];

  for (const change of positionChanges) {
    const parent = nodeById.get(change.id);
    const newPos = change.position;
    if (!parent || !newPos) continue;

    if (!isParentNode(parent, edges)) continue;

    const deltaX = newPos.x - parent.position.x;
    const deltaY = newPos.y - parent.position.y;
    if (deltaX === 0 && deltaY === 0) continue;

    const childIds = findAllChildNodes(parent.id, parent.type, edges, nodes);
    for (const childId of childIds) {
      if (movedIds.has(childId)) continue;
      const child = nodeById.get(childId);
      if (!child) continue;

      additional.push({
        id: childId,
        type: 'position',
        position: { x: child.position.x + deltaX, y: child.position.y + deltaY },
      } as NodeChange);
    }
  }

  if (additional.length === 0) return changes;
  return [...changes, ...additional];
}


