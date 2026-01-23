import { useMemo } from 'react';
import { ViewportPortal, type Node, type Edge } from '@xyflow/react';

export type Side = 'left' | 'right' | 'top' | 'bottom';
export type LaneAnchor = 'center' | 'port'; // where laneY is oriented

export interface LoopBracketConfig {
  /** ===== Ports / Docking Points ===== */
  ports: {
    loop: {
      in: Side; // usually 'left'
      out: Side; // main split start, in screenshot 'right'
      return: Side; // in screenshot 'bottom'
    };
    endLoop: {
      in: Side; // in screenshot 'left'
      out: Side; // visible in screenshot 'right'
      return: Side; // in screenshot 'bottom'
    };
  };

  /** ===== Lanes / Spacing ===== */
  lanes: {
    /** Main Lane (Forward) Y-Referenz */
    main: {
      anchor: LaneAnchor; // 'port' = exact Port-Y; 'center' = Node-Center-Y
      yOffset: number; // additional offset if desired
    };

    /** Top Bracket Lane */
    top: {
      offsetFromMain: number; // paddingTop (wie hoch über Main)
    };

    /** Return Lane (unten) */
    return: {
      offsetFromMain: number; // distance below Main (returnLaneGap)
    };

    /**
     * Optional: bottom lane alias for symmetry.
     * If provided, this overrides `lanes.return.offsetFromMain` for the bottom rail lane.
     */
    bottom?: {
      offsetFromMain: number;
    };
  };

  /** ===== Orthogonal Routing Parameter ===== */
  routing: {
    /** Rounded corners */
    cornerRadius: number;

    /** How far the bracket extends to the right beyond EndLoop (Overshoot) */
    rightOvershoot: number; // corresponds to your paddingSide (or additional)

    /** How far left the Return passes under the Loop before going up */
    leftOvershoot: number;

    /** "Lead-in" at port: short entry into the port (e.g. DOWN then LEFT into port) */
    leadIn: {
      intoPorts: number; // px, typ. 10-18
      outOfPorts: number; // px, typ. 10-18
    };

    /** Additional safety margins around node rects (so rails don't stick) */
    clearance: {
      x: number; // horizontal distance to node
      y: number; // vertical distance to node
    };

    /**
     * Split-Strategie am Loop-Out:
     * - 'shared' = Main + Top starten exakt am selben Punkt (wie im Screenshot)
     * - 'stagger' = minimal versetzt (gegen Overdraw)
     */
    splitStrategy: 'shared' | 'stagger';
    splitStaggerPx: number; // nur bei 'stagger'

    // Top rail docking into endLoop.in
    topDock: {
      preDropFromTarget: number; // px left of endLoop.in.x
      finalLeadIn: number; // px to the right before entering the input
      dropToLane: 'main' | 'port';
    };

    /**
     * Optional: mirror strategy for bottom rail.
     * - 'none': bottom rail uses legacy routing
     * - 'mirrorY': bottom rail is a Y-mirrored copy of the top rail around mainY
     */
    mirrorBottom?: 'none' | 'mirrorY';
  };

  // Bracket targets (minimal)
  bracket: {
    top: {
      start: { node: 'loop'; port: 'out' };
      end: { node: 'endLoop'; port: 'in' };
    };
  };

  /** ===== Rail / Stroke Style ===== */
  rail: {
    strokeWidth: number;
    /** optische “Schienen”-Erweiterung (dein railExtra) */
    extra: number;

    /** Optional: Endkappen */
    caps: {
      enabled: boolean;
      size: number;
    };
  };

  /** ===== Legacy / Convenience Mapping (optional) ===== */
  legacy?: {
    paddingTop: number;
    paddingBottom: number;
    paddingSide: number;
    returnLaneGap: number;
  };
}

export const LOOP_BRACKET_DEFAULTS_FULL: LoopBracketConfig = {
    ports: {
      loop: { in: 'left', out: 'right', return: 'bottom' },
      endLoop: { in: 'left', out: 'right', return: 'bottom' },
    },
  
    lanes: {
      main: { anchor: 'port', yOffset: 0 },
      top: { offsetFromMain: 150 },          // ok
      return: { offsetFromMain: 150 },       // <<<<< IMPORTANT: significantly down (26 is too little)
    },
  
    routing: {
      cornerRadius: 10,
  
      rightOvershoot: 22,                   // a bit more so the top bracket can go cleanly around on the right
      leftOvershoot: 40,                    // <<<<< IMPORTANT: Return should go further left before going up
  
      leadIn: {
        outOfPorts: 16,                     // <<<<< IMPORTANT: exit port before the bend comes
        intoPorts: 16,                      // <<<<< IMPORTANT: into port as short "entry"
      },
  
      clearance: {
        x: 12,
        y: 18,                              // <<<<< IMPORTANT: prevents Return from running into End-loop
      },
  
      splitStrategy: 'shared',
      splitStaggerPx: 0,
      topDock: {
        preDropFromTarget: 22,
        finalLeadIn: 12,
        dropToLane: 'main',
      },
      mirrorBottom: 'mirrorY',
    },
  
    rail: {
      strokeWidth: 2,
      extra: 0,
      caps: { enabled: false, size: 6 },
    },

    bracket: {
      top: {
        start: { node: 'loop', port: 'out' },
        end: { node: 'endLoop', port: 'in' },
      },
    },
  
    legacy: {
      paddingTop: 28,
      paddingBottom: 14,
      paddingSide: 18,
      returnLaneGap: 70,                    // (if you use legacy: adjust!)
    },
  };
  
  

declare global {
  interface Window {
    __LOOP_BRACKET_CONFIG?: Partial<LoopBracketConfig>;
    __DEBUG_LOOP_BRACKET?: boolean;
  }
}

const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 100;

function clampNonNegative(n: number): number {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function getNodeSize(node: Node): { w: number; h: number } {
  const w = (node as any).measured?.width ?? (node as any).width ?? DEFAULT_NODE_WIDTH;
  const h = (node as any).measured?.height ?? (node as any).height ?? DEFAULT_NODE_HEIGHT;
  return { w, h };
}

function getNodePos(node: Node): { x: number; y: number } {
  const abs = (node as any).positionAbsolute as { x: number; y: number } | undefined;
  return abs ?? node.position;
}

function portPoint(pos: { x: number; y: number }, size: { w: number; h: number }, side: Side): { x: number; y: number } {
  switch (side) {
    case 'top':
      return { x: pos.x + size.w / 2, y: pos.y };
    case 'bottom':
      return { x: pos.x + size.w / 2, y: pos.y + size.h };
    case 'left':
      return { x: pos.x, y: pos.y + size.h / 2 };
    case 'right':
      return { x: pos.x + size.w, y: pos.y + size.h / 2 };
  }
}

function deepMerge<T extends Record<string, any>>(base: T, patch: Partial<T>): T {
  const out: any = Array.isArray(base) ? [...base] : { ...base };
  Object.keys(patch || {}).forEach((k) => {
    const pv = (patch as any)[k];
    if (pv === undefined) return;
    const bv = (base as any)[k];
    if (pv && typeof pv === 'object' && !Array.isArray(pv) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
      out[k] = deepMerge(bv, pv);
    } else {
      out[k] = pv;
    }
  });
  return out;
}

function moveAlongSide(p: { x: number; y: number }, side: Side, len: number, dir: 1 | -1 = 1): { x: number; y: number } {
  const l = clampNonNegative(len) * dir;
  switch (side) {
    case 'left':
      return { x: p.x - l, y: p.y };
    case 'right':
      return { x: p.x + l, y: p.y };
    case 'top':
      return { x: p.x, y: p.y - l };
    case 'bottom':
      return { x: p.x, y: p.y + l };
  }
}

// (Buttons removed – we keep the loop bracket purely visual.)

function buildRoundedPath(points: Array<{ x: number; y: number }>, radius: number): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  const r = clampNonNegative(radius);
  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];

    const v1 = { x: cur.x - prev.x, y: cur.y - prev.y };
    const v2 = { x: next.x - cur.x, y: next.y - cur.y };

    const len1 = Math.hypot(v1.x, v1.y);
    const len2 = Math.hypot(v2.x, v2.y);

    if (len1 === 0 || len2 === 0 || r === 0) {
      d += ` L ${cur.x},${cur.y}`;
      continue;
    }

    const r1 = Math.min(r, len1 / 2);
    const r2 = Math.min(r, len2 / 2);

    const p1 = { x: cur.x - (v1.x / len1) * r1, y: cur.y - (v1.y / len1) * r1 };
    const p2 = { x: cur.x + (v2.x / len2) * r2, y: cur.y + (v2.y / len2) * r2 };

    d += ` L ${p1.x},${p1.y}`;
    // quadratic bezier with control point at the corner
    d += ` Q ${cur.x},${cur.y} ${p2.x},${p2.y}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x},${last.y}`;
  return d;
}

function findBodyNodesBetween(loopId: string, endId: string, edges: Edge[]): Set<string> {
  // BFS from loop -> ... until end-loop, collect visited nodes.
  const lookup = new Map<string, string[]>();
  edges.forEach(e => {
    if (!lookup.has(e.source)) lookup.set(e.source, []);
    lookup.get(e.source)!.push(e.target);
  });

  const visited = new Set<string>();
  const queue: string[] = [loopId];

  while (queue.length) {
    const cur = queue.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    if (cur === endId) break;
    const nexts = lookup.get(cur) || [];
    nexts.forEach(n => {
      if (!visited.has(n)) queue.push(n);
    });
  }

  visited.delete(loopId);
  visited.delete(endId);
  return visited;
}

export function LoopBracketOverlay({
  nodes,
  edges,
}: {
  nodes: Node[];
  edges: Edge[];
}) {
  const cfg = useMemo(() => {
    const overrides =
      (typeof window !== 'undefined' && window.__LOOP_BRACKET_CONFIG) ? window.__LOOP_BRACKET_CONFIG : {};
    return deepMerge(LOOP_BRACKET_DEFAULTS_FULL, overrides);
  }, []);

  const paths = useMemo(() => {
    const byPair = new Map<string, { loop?: Node; end?: Node }>();
    nodes.forEach(n => {
      if (n.type === 'loop' && (n.data as any)?.pairId) {
        const k = String((n.data as any).pairId);
        const cur = byPair.get(k) ?? {};
        cur.loop = n;
        byPair.set(k, cur);
      }
      if (n.type === 'end-loop' && (n.data as any)?.pairId) {
        const k = String((n.data as any).pairId);
        const cur = byPair.get(k) ?? {};
        cur.end = n;
        byPair.set(k, cur);
      }
    });

    const results: Array<{
      id: string;
      fillRect: { x: number; y: number; w: number; h: number; r: number };
      startD: string;
      retD: string;
    }> = [];

    const cornerRadius = clampNonNegative(cfg.routing.cornerRadius);
    const railExtra = clampNonNegative(cfg.rail.extra);
    byPair.forEach((pair, pairId) => {
      if (!pair.loop || !pair.end) return;
      const loopNode = pair.loop;
      const endNode = pair.end;

      const loopPos = getNodePos(loopNode);
      const endPos = getNodePos(endNode);
      const loopSize = getNodeSize(loopNode);
      const endSize = getNodeSize(endNode);

      const loopOut = portPoint(loopPos, loopSize, cfg.ports.loop.out);
      const endIn = portPoint(endPos, endSize, cfg.ports.endLoop.in);
      const endReturn = portPoint(endPos, endSize, cfg.ports.endLoop.return);
      const loopReturn = portPoint(loopPos, loopSize, cfg.ports.loop.return);

      const bodyIds = findBodyNodesBetween(loopNode.id, endNode.id, edges);
      const bodyNodes = nodes.filter(n => bodyIds.has(n.id));

      const allNodes = [loopNode, endNode, ...bodyNodes];
      let minY = Infinity;
      let maxY = -Infinity;
      let minX = Infinity;
      let maxX = -Infinity;
      allNodes.forEach(n => {
        const p = getNodePos(n);
        const s = getNodeSize(n);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y + s.h);
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x + s.w);
      });
      if (!Number.isFinite(minY)) return;

      const loopCenterY = loopPos.y + loopSize.h / 2;
      const endCenterY = endPos.y + endSize.h / 2;
      const anchorY =
        cfg.lanes.main.anchor === 'center'
          ? (loopCenterY + endCenterY) / 2
          : (loopOut.y + endIn.y) / 2;
      const mainY = anchorY + cfg.lanes.main.yOffset;
      const topY = mainY - cfg.lanes.top.offsetFromMain;
      const bottomOffset =
        cfg.lanes.bottom?.offsetFromMain !== undefined ? cfg.lanes.bottom.offsetFromMain : cfg.lanes.return.offsetFromMain;
      const returnY = mainY + bottomOffset;

      const clearanceX = clampNonNegative(cfg.routing.clearance.x);
      const clearanceY = clampNonNegative(cfg.routing.clearance.y);
      const spanRight = maxX + clearanceX + cfg.routing.rightOvershoot + railExtra;
      const spanLeft = minX - clearanceX - cfg.routing.leftOvershoot - railExtra;

      const outLead = clampNonNegative(cfg.routing.leadIn.outOfPorts);
      const loopOutLead = moveAlongSide(loopOut, cfg.ports.loop.out, outLead, 1);
      // TOP RAIL routing (exact requested behavior):
      // P0 = Loop.out
      // P1 = short outOfPorts (along port direction)
      // P2 = up to top lane
      // P3 = right to (targetInX - preDropFromTarget)
      // P4 = down to targetInY (or main lane, configurable)
      // P5 = short RIGHT finalLeadIn
      // P6 = targetIn
      const splitStagger = cfg.routing.splitStrategy === 'stagger' ? clampNonNegative(cfg.routing.splitStaggerPx) : 0;
      const topLaneY = (topY - clearanceY) - splitStagger;

      const preDrop = clampNonNegative(cfg.routing.topDock.preDropFromTarget);
      const finalLead = clampNonNegative(cfg.routing.topDock.finalLeadIn);

      const targetInX = endIn.x;
      const targetInY = endIn.y;
      const dropY = cfg.routing.topDock.dropToLane === 'main' ? mainY : targetInY;

      const p0 = loopOut;
      const p1 = loopOutLead;
      const p2 = { x: p1.x, y: topLaneY };
      const p3 = { x: targetInX - preDrop, y: p2.y };
      const p4 = { x: p3.x, y: dropY };
      const p5 = { x: targetInX + finalLead, y: dropY };
      const p6 = { x: targetInX, y: targetInY };

      const startD = buildRoundedPath([p0, p1, p2, p3, p4, p5, p6], cornerRadius);

      const mirrorMode = cfg.routing.mirrorBottom ?? 'none';
      const retD =
        mirrorMode === 'mirrorY'
          ? (() => {
              const mirrorY = (pt: { x: number; y: number }) => ({ x: pt.x, y: 2 * mainY - pt.y });

              // Mirror the TOP polyline and then shift so the mirrored "top lane" matches our desired bottom lane.
              const topPts = [p0, p1, p2, p3, p4, p5, p6];
              const mirrored = topPts.map(mirrorY);

              const desiredBottomLaneY = returnY + clearanceY;
              const mirroredLaneY = mirrorY({ x: 0, y: topLaneY }).y; // equals 2*mainY - topLaneY
              const deltaY = desiredBottomLaneY - mirroredLaneY;

              const shifted = mirrored.map(pt => ({ x: pt.x, y: pt.y + deltaY }));
              return buildRoundedPath(shifted, cornerRadius);
            })()
          : buildRoundedPath(
              [
                { x: endReturn.x, y: endReturn.y },
                { x: endReturn.x, y: returnY + clearanceY },
                { x: spanLeft, y: returnY + clearanceY },
                { x: spanLeft, y: loopReturn.y },
                { x: loopReturn.x, y: loopReturn.y },
              ],
              cornerRadius
            );

      // Soft background inside the bracket (between top and bottom lanes)
      // Use current computed lanes so the fill follows config adjustments.
      const fillTop = topLaneY;
      const fillBottom = returnY + clearanceY;
      // Keep the fill strictly within the visible bracket width to avoid left/right "overflow".
      // Use the inner top rail segment P2 -> P3 as the fill width.
      const fillLeft = Math.min(p2.x, p3.x);
      const fillRight = Math.max(p2.x, p3.x);
      const inset = Math.max(0, (cfg.rail.strokeWidth ?? 2) / 2);
      const fillRect = {
        x: fillLeft + inset,
        y: Math.min(fillTop, fillBottom),
        w: Math.max(0, (fillRight - fillLeft) - inset * 2),
        h: Math.max(0, Math.abs(fillBottom - fillTop)),
        r: Math.max(0, cornerRadius),
      };

      if (window.__DEBUG_LOOP_BRACKET) {
        // eslint-disable-next-line no-console
        console.log('[LoopBracketOverlay]', {
          pairId,
          loop: loopNode.id,
          end: endNode.id,
          bodyCount: bodyNodes.length,
          bounds: { minX, maxX, minY, maxY },
          derived: { mainY, topY, returnY, spanLeft, spanRight },
        });
      }

      results.push({
        id: `loop-bracket-${pairId}`,
        fillRect,
        startD,
        retD,
      });
    });

    return results;
  }, [nodes, edges, cfg]);

  if (paths.length === 0) return null;

  return (
    <ViewportPortal>
      <svg
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1,
          height: 1,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        {paths.map(p => (
          <g key={p.id}>
            <rect
              x={p.fillRect.x}
              y={p.fillRect.y}
              width={p.fillRect.w}
              height={p.fillRect.h}
              rx={p.fillRect.r}
              ry={p.fillRect.r}
              fill="rgba(59, 130, 246, 0.06)"
            />
            <path
              d={p.startD}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={cfg.rail.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={p.retD}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={cfg.rail.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}
      </svg>
    </ViewportPortal>
  );
}

export default LoopBracketOverlay;


