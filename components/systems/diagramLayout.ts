/**
 * Shared node/connector layout math for the systems diagrams
 * (ProcessDiagram, AutomationEngine, StrategyWall). See ARCHITECTURE.md
 * components/systems and PLAN.md Phase 11 — these should share one visual
 * grammar, not reinvent it per diagram.
 */

export type NodePosition = { x: number; y: number };

export type LayoutOptions = {
  nodeW: number;
  nodeH: number;
  maxCols: number;
  colSpacing: number;
  rowSpacing: number;
};

/** Serpentine (left-right, then right-left) node layout, wrapping past maxCols. */
export function layoutSerpentine(count: number, opts: LayoutOptions): NodePosition[] {
  const cols = Math.min(opts.maxCols, count);
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = row % 2 === 0 ? i % cols : cols - 1 - (i % cols);
    return {
      x: opts.nodeW / 2 + 10 + col * opts.colSpacing,
      y: opts.nodeH / 2 + 10 + row * opts.rowSpacing,
    };
  });
}

/** Single-column, top-to-bottom node layout for narrow viewports. */
export function layoutVertical(
  count: number,
  opts: Pick<LayoutOptions, "nodeW" | "nodeH" | "rowSpacing">,
): NodePosition[] {
  return Array.from({ length: count }, (_, i) => ({
    x: opts.nodeW / 2 + 10,
    y: opts.nodeH / 2 + 10 + i * opts.rowSpacing,
  }));
}

/** Endpoints on the facing edges of two node boxes, for a clean connecting line. */
export function edgePoints(a: NodePosition, b: NodePosition, nodeW: number, nodeH: number) {
  if (a.y === b.y) {
    const dir = b.x > a.x ? 1 : -1;
    return { x1: a.x + dir * (nodeW / 2), y1: a.y, x2: b.x - dir * (nodeW / 2), y2: b.y };
  }
  const dir = b.y > a.y ? 1 : -1;
  return { x1: a.x, y1: a.y + dir * (nodeH / 2), x2: b.x, y2: b.y - dir * (nodeH / 2) };
}

/** Bounding viewBox for a set of node positions, with a fixed margin. */
export function boundingViewBox(positions: NodePosition[], nodeW: number, nodeH: number, margin = 16) {
  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const minX = Math.min(...xs) - nodeW / 2 - margin;
  const maxX = Math.max(...xs) + nodeW / 2 + margin;
  const minY = Math.min(...ys) - nodeH / 2 - margin;
  const maxY = Math.max(...ys) + nodeH / 2 + margin;
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

/* ------------------------------------------------------------ swimlane */

/** Spec 6.1: validated geometry for the ORBIT swimlane. */
export const SWIMLANE = { laneW: 236, nodeW: 196, nodeH: 52, rowH: 88, head: 72, pad: 24 };
export type SwimlaneOptions = typeof SWIMLANE;

export type SwimlaneLayout = {
  positions: Record<string, NodePosition>;
  width: number;
  height: number;
};

/** Grid layout: lane = column, row = 88px band under a 72px header. Centres, not corners. */
export function layoutSwimlane(
  nodes: ReadonlyArray<{ id: string; lane: string; row: number }>,
  lanes: ReadonlyArray<{ id: string }>,
  opts: SwimlaneOptions = SWIMLANE,
): SwimlaneLayout {
  const laneIndex = new Map(lanes.map((l, i) => [l.id, i]));
  const positions: Record<string, NodePosition> = {};
  let maxRow = 0;
  for (const n of nodes) {
    const li = laneIndex.get(n.lane);
    if (li === undefined) throw new Error(`layoutSwimlane: node ${n.id} names unknown lane "${n.lane}"`);
    positions[n.id] = {
      x: li * opts.laneW + opts.laneW / 2,
      y: opts.head + (n.row - 1) * opts.rowH + opts.rowH / 2,
    };
    maxRow = Math.max(maxRow, n.row);
  }
  return {
    positions,
    width: lanes.length * opts.laneW,
    height: opts.head + maxRow * opts.rowH + opts.pad,
  };
}

export type RoutedEdge = {
  points: NodePosition[];
  label: { x: number; y: number; anchor: "middle" | "start" };
};

/**
 * Spec 6.1 routing, in order: same row (one horizontal segment), same lane
 * (one vertical segment), `vh` (leave vertically, enter a side), else leave
 * a side and enter the target's top or bottom. Reuses edgePoints for the two
 * straight cases so the arrowhead geometry matches the other diagrams.
 */
export function routeSwimlaneEdge(
  a: NodePosition,
  b: NodePosition,
  opts: SwimlaneOptions,
  route?: "vh",
): RoutedEdge {
  const { nodeW, nodeH } = opts;
  const dx = b.x > a.x ? 1 : -1;
  const dy = b.y > a.y ? 1 : -1;
  let points: NodePosition[];

  if (a.y === b.y || a.x === b.x) {
    const { x1, y1, x2, y2 } = edgePoints(a, b, nodeW, nodeH);
    points = [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ];
  } else if (route === "vh") {
    points = [
      { x: a.x, y: a.y + (dy * nodeH) / 2 },
      { x: a.x, y: b.y },
      { x: b.x - (dx * nodeW) / 2, y: b.y },
    ];
  } else {
    points = [
      { x: a.x + (dx * nodeW) / 2, y: a.y },
      { x: b.x, y: a.y },
      { x: b.x, y: b.y - (dy * nodeH) / 2 },
    ];
  }

  // Label on the longest segment: above a horizontal one, right of a vertical one.
  let best = 0;
  let bestLen = -1;
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.abs(points[i + 1]!.x - points[i]!.x) + Math.abs(points[i + 1]!.y - points[i]!.y);
    if (len > bestLen) {
      bestLen = len;
      best = i;
    }
  }
  const p = points[best]!;
  const q = points[best + 1]!;
  const mx = (p.x + q.x) / 2;
  const my = (p.y + q.y) / 2;
  const label =
    p.y === q.y
      ? { x: mx, y: my - 6, anchor: "middle" as const }
      : { x: mx + 6, y: my + 3, anchor: "start" as const };

  return { points, label };
}
