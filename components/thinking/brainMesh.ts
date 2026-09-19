/**
 * Geometry for the /thinking brain: a neural mesh inside a side-view brain
 * silhouette (front = left), plus the loop of step hubs and the eight-way
 * (N-way) division of the mesh into sections.
 *
 * Pure and deterministic. It runs on the server and again on the client, and
 * the two results must serialise identically or React will report a hydration
 * mismatch. So: no built-in random (a small seeded PRNG instead) and every
 * emitted coordinate rounded to one decimal. This is geometry, not content;
 * the words on the page still come from /data.
 */

export type BrainNode = { x: number; y: number; section: number };
export type BrainEdge = { a: number; b: number; section: number | null };
export type BrainHub = { x: number; y: number; node: number };

export type BrainMesh = {
  outlinePath: string;
  /** Decorative lobe tucked under the back of the cerebrum. Draw it BEHIND the outline. */
  cerebellumPath: string;
  cerebellumFoldPaths: string[];
  /** Decorative brainstem emerging from the underside. Draw it BEHIND the outline. */
  stemPath: string;
  gyriPaths: string[];
  nodes: BrainNode[];
  edges: BrainEdge[];
  hubs: BrainHub[];
  ringPath: string;
  blinkNodes: number[];
  /** The outline flattened to a polygon: what "inside the brain" means. */
  outlinePolygon: Array<[number, number]>;
};

type Pt = [number, number];

/** Control points of the silhouette (viewBox 640 x 440). */
const POLY: Pt[] = [
  [92, 232], [84, 180], [106, 130], [150, 86], [215, 58], [290, 42], [365, 38], [440, 50],
  [505, 80], [556, 122], [584, 178], [588, 236], [566, 286], [528, 318], [478, 332], [440, 346],
  [400, 352], [362, 372], [318, 378], [270, 360], [222, 352], [170, 328], [122, 290],
];
// Both shapes start INSIDE the cerebrum's lower outline and are drawn behind
// its opaque fill, so the joins are hidden and nothing floats free.
const CEREBELLUM = "M 450,326 C 452,372 505,398 548,376 C 566,364 560,336 528,310 Z";
const CEREBELLUM_FOLDS = [
  "M 466,362 C 500,384 540,374 556,350",
  "M 478,346 C 506,364 538,356 552,336",
];
const STEM = "M 368,340 C 380,380 386,408 394,428 C 400,442 420,442 424,428 C 428,404 424,372 430,340 Z";
const GYRI = [
  "M 150,120 C 190,90 230,140 270,100",
  "M 300,70 C 340,110 380,60 430,96",
  "M 470,110 C 500,150 540,120 560,170",
  "M 120,200 C 160,170 190,230 240,190",
  "M 270,170 C 320,220 370,150 420,200",
  "M 470,200 C 500,240 540,210 572,250",
  "M 150,280 C 200,250 240,310 290,270",
  "M 330,290 C 380,330 430,270 480,310",
];

/** Hub loop: an ellipse, starting at the back and going over the top. */
const RING_CX = 340;
const RING_CY = 210;
const RING_RX = 190;
const RING_RY = 105;

/*
 * HYDRATION DETERMINISM. This module runs on the server and again in the
 * visitor's browser, and both must produce byte-identical markup or React
 * reports a mismatch it cannot patch. Node placement is chaotic: one flipped
 * comparison moves every later neuron. So every decision below uses only
 * IEEE-754 basic arithmetic (+ - * /), which is exact and identical in every
 * JS engine, on squared distances against squared thresholds. The built-in
 * hypotenuse helper is deliberately not used: its precision is
 * implementation-defined and can differ between V8, JavaScriptCore and
 * SpiderMonkey. (Math.cos/sin only feed
 * the hub targets and are rounded to 0.1.) e2e/brain-mesh.spec.ts greps this
 * file to keep both the hypotenuse helper and the built-in random out.
 */
const NODE_TARGET = 150;
const NODE_MIN_DIST = 20;
const NODE_EDGE_MARGIN = 8;
const CANDIDATES = 24;
const EDGE_K = 4;
const EDGE_MAX_LEN = 46;
const BLINK_COUNT = 10;
const SEED = 7;
/** Neurons keep clear of each hub by at least this much. */
const HUB_CLEARANCE = 16;
const sq = (n: number) => n * n;
const dist2 = (ax: number, ay: number, bx: number, by: number) => sq(ax - bx) + sq(ay - by);
/** Widest step label ("UNDERSTAND") at 12px mono with tracking, plus its halo. */
const LABEL_WIDTH = 88;

/**
 * Where a hub's text sits (see ThinkingFramework: the number and label start
 * 13 units right of the hub). No neuron or edge may enter this box, so a
 * label is never drawn across mesh dots. `pad` widens it for neuron placement.
 */
export function labelBox(hub: { x: number; y: number }, pad = 0) {
  return { x0: hub.x + 10 - pad, y0: hub.y - 20 - pad, x1: hub.x + 13 + LABEL_WIDTH + pad, y1: hub.y + 9 + pad };
}

const inBox = (x: number, y: number, b: ReturnType<typeof labelBox>) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;

/** True if the segment touches the box (exact slab test, basic arithmetic only). */
function segmentHitsBox(ax: number, ay: number, bx: number, by: number, b: ReturnType<typeof labelBox>) {
  let t0 = 0;
  let t1 = 1;
  const d: Pt = [bx - ax, by - ay];
  const lo: Pt = [b.x0 - ax, b.y0 - ay];
  const hi: Pt = [b.x1 - ax, b.y1 - ay];
  for (let axis = 0; axis < 2; axis++) {
    const dv = d[axis]!;
    if (dv === 0) {
      if (lo[axis]! > 0 || hi[axis]! < 0) return false;
      continue;
    }
    let ta = lo[axis]! / dv;
    let tb = hi[axis]! / dv;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
}

const r1 = (n: number) => Number(n.toFixed(1));
const fmt = (n: number) => n.toFixed(1);

/** Small seeded PRNG (mulberry32). Integer maths only, so identical everywhere. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Cubic = { p0: Pt; c1: Pt; c2: Pt; p1: Pt };

/** Closed Catmull-Rom spline through `pts`, as cubic Bezier segments. */
function catmullClosed(pts: Pt[]): Cubic[] {
  const n = pts.length;
  return pts.map((_, i) => {
    const p0 = pts[(i - 1 + n) % n]!;
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % n]!;
    const p3 = pts[(i + 2) % n]!;
    return {
      p0: p1,
      c1: [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6] as Pt,
      c2: [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6] as Pt,
      p1: p2,
    };
  });
}

function cubicsToPath(segs: Cubic[]): string {
  const first = segs[0]!;
  const body = segs
    .map((s) => `C ${fmt(s.c1[0])},${fmt(s.c1[1])} ${fmt(s.c2[0])},${fmt(s.c2[1])} ${fmt(s.p1[0])},${fmt(s.p1[1])}`)
    .join(" ");
  return `M ${fmt(first.p0[0])},${fmt(first.p0[1])} ${body} Z`;
}

function flatten(segs: Cubic[], steps = 12): Pt[] {
  const out: Pt[] = [];
  for (const s of segs) {
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      const u = 1 - t;
      out.push([
        u * u * u * s.p0[0] + 3 * u * u * t * s.c1[0] + 3 * u * t * t * s.c2[0] + t * t * t * s.p1[0],
        u * u * u * s.p0[1] + 3 * u * u * t * s.c1[1] + 3 * u * t * t * s.c2[1] + t * t * t * s.p1[1],
      ]);
    }
  }
  return out;
}

export function pointInPolygon(x: number, y: number, poly: ReadonlyArray<readonly [number, number]>): boolean {
  let inside = false;
  for (let i = 0, n = poly.length; i < n; i++) {
    const [x1, y1] = poly[i]!;
    const [x2, y2] = poly[(i + 1) % n]!;
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) inside = !inside;
  }
  return inside;
}

/** Squared distance from a point to a segment. */
function distToSegment2(px: number, py: number, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / len2));
  return dist2(px, py, a[0] + t * dx, a[1] + t * dy);
}

/** Squared distance from a point to the polygon's boundary. */
function distToPolygon2(x: number, y: number, poly: Pt[]): number {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    best = Math.min(best, distToSegment2(x, y, poly[i]!, poly[(i + 1) % poly.length]!));
  }
  return best;
}

/** Builds the mesh from scratch. Exported for the determinism test; the app uses `buildBrainMesh`. */
export function computeBrainMesh(stepCount: number): BrainMesh {
  const outlineSegs = catmullClosed(POLY);
  const polygon = flatten(outlineSegs);

  // Step hubs on an ellipse, starting at the back (right) and going up and
  // over the top. Each hub is itself a mesh neuron (a "snap" of distance 0),
  // placed first so the label boxes beside it can be kept clear of every
  // other neuron.
  const pts: Pt[] = [];
  const hubs: BrainHub[] = [];
  for (let i = 0; i < stepCount; i++) {
    const angle = (-2 * Math.PI * i) / stepCount;
    const x = r1(RING_CX + RING_RX * Math.cos(angle));
    const y = r1(RING_CY + RING_RY * Math.sin(angle));
    hubs.push({ x, y, node: pts.length });
    pts.push([x, y]);
  }
  const hubNodes = hubs.map((h) => h.node);
  const boxes = hubs.map((h) => labelBox(h, 5));

  // Best-candidate blue-noise sampling: each round draws a few candidates and
  // keeps the one farthest from every neuron so far, which fills the brain
  // evenly instead of clumping. Candidates must be inside the outline, clear
  // of its edge, clear of every hub and label, and not too close to a neuron.
  const rand = mulberry32(SEED);
  let dry = 0;
  while (pts.length < NODE_TARGET && dry < 200) {
    let bestPt: Pt | null = null;
    let bestD = 0;
    for (let c = 0; c < CANDIDATES; c++) {
      const x = r1(90 + rand() * 500);
      const y = r1(42 + rand() * 336);
      if (!pointInPolygon(x, y, polygon)) continue;
      if (distToPolygon2(x, y, polygon) < sq(NODE_EDGE_MARGIN)) continue;
      if (boxes.some((b) => inBox(x, y, b))) continue;
      if (hubs.some((h) => dist2(x, y, h.x, h.y) < sq(HUB_CLEARANCE))) continue;
      let nearest = Infinity;
      for (const [qx, qy] of pts) nearest = Math.min(nearest, dist2(x, y, qx, qy));
      if (nearest >= sq(NODE_MIN_DIST) && nearest > bestD) {
        bestD = nearest;
        bestPt = [x, y];
      }
    }
    if (bestPt) {
      pts.push(bestPt);
      dry = 0;
    } else {
      dry++;
    }
  }

  // Sections: every neuron belongs to its nearest hub.
  const nodes: BrainNode[] = pts.map(([x, y]) => {
    let section = 0;
    let bestD = Infinity;
    hubs.forEach((h, i) => {
      const d = dist2(x, y, h.x, h.y);
      if (d < bestD) {
        bestD = d;
        section = i;
      }
    });
    return { x, y, section };
  });

  const textBoxes = hubs.map((h) => labelBox(h));

  // k-nearest-neighbour edges, deduplicated, in a stable order.
  const seen = new Set<string>();
  const edges: BrainEdge[] = [];
  pts.forEach(([x, y], i) => {
    const near = pts
      .map(([qx, qy], j) => ({ j, d: dist2(x, y, qx, qy) }))
      .filter((c) => c.j !== i)
      .sort((p, q) => p.d - q.d || p.j - q.j)
      .slice(0, EDGE_K);
    for (const { j, d } of near) {
      if (d > sq(EDGE_MAX_LEN)) continue;
      if (textBoxes.some((lb) => segmentHitsBox(x, y, pts[j]![0], pts[j]![1], lb))) continue;
      const a = Math.min(i, j);
      const b = Math.max(i, j);
      const key = `${a}-${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a, b, section: nodes[a]!.section === nodes[b]!.section ? nodes[a]!.section : null });
    }
  });
  edges.sort((p, q) => p.a - q.a || p.b - q.b);

  // Neurons that blink while nothing is hovered: seeded shuffle of non-hubs.
  const pool = nodes.map((_, i) => i).filter((i) => !hubNodes.includes(i));
  const shuffle = mulberry32(SEED + 3);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(shuffle() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const blinkNodes = pool.slice(0, BLINK_COUNT);

  const ringPath = hubs.length >= 3 ? cubicsToPath(catmullClosed(hubs.map((h): Pt => [h.x, h.y]))) : "";

  return {
    outlinePath: cubicsToPath(outlineSegs),
    cerebellumPath: CEREBELLUM,
    cerebellumFoldPaths: CEREBELLUM_FOLDS,
    stemPath: STEM,
    gyriPaths: GYRI,
    nodes,
    edges,
    hubs,
    ringPath,
    blinkNodes,
    outlinePolygon: polygon.map(([x, y]): Pt => [r1(x), r1(y)]),
  };
}

const cache = new Map<number, BrainMesh>();

/** Memoised per step count. Callers must treat the result as read-only. */
export function buildBrainMesh(stepCount: number): BrainMesh {
  let mesh = cache.get(stepCount);
  if (!mesh) {
    mesh = computeBrainMesh(stepCount);
    cache.set(stepCount, mesh);
  }
  return mesh;
}
