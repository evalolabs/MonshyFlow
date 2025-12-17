import type { Node, Edge } from '@xyflow/react';
import { findAllChildNodes, isParentNode } from './nodeGroupingUtils';

/**
 * Layout lock feature flag.
 *
 * Revert-safe: set this to false to fully disable the behavior + UI.
 */
export const ENABLE_LAYOUT_LOCK = true;

export type LayoutLockScope = 'self' | 'group';

function getLayoutLockScope(node: Node): LayoutLockScope {
  const scope = (node.data as any)?.layoutLockScope;
  return scope === 'self' || scope === 'group' ? scope : 'group';
}

export function isLayoutLocked(node: Node): boolean {
  if (!ENABLE_LAYOUT_LOCK) return false;
  return Boolean((node.data as any)?.layoutLocked);
}

/**
 * Locked node IDs include:
 * - the node itself, if node.data.layoutLocked is true
 * - by default (scope: 'group'), if the locked node is a parent node, all its children too
 */
export function getLockedNodeIds(nodes: Node[], edges: Edge[]): Set<string> {
  const lockedIds = new Set<string>();

  for (const node of nodes) {
    if (!isLayoutLocked(node)) continue;

    lockedIds.add(node.id);

    const scope = getLayoutLockScope(node);
    if (scope === 'group' && isParentNode(node, edges)) {
      const childIds = findAllChildNodes(node.id, node.type, edges, nodes);
      childIds.forEach(id => lockedIds.add(id));
    }
  }

  return lockedIds;
}

/**
 * Overwrite layouted positions with original positions for locked nodes.
 * This keeps manual positioning intact while still allowing auto-layout for the rest.
 */
export function mergeLayoutWithLockedPositions(
  originalNodes: Node[],
  layoutedNodes: Node[],
  edges: Edge[]
): Node[] {
  if (!ENABLE_LAYOUT_LOCK) return layoutedNodes;

  const originalById = new Map(originalNodes.map(n => [n.id, n]));
  const lockedIds = getLockedNodeIds(originalNodes, edges);

  if (lockedIds.size === 0) return layoutedNodes;

  return layoutedNodes.map(node => {
    if (!lockedIds.has(node.id)) return node;
    const original = originalById.get(node.id);
    if (!original?.position) return node;
    return {
      ...node,
      position: original.position,
    };
  });
}


