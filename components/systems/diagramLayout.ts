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
