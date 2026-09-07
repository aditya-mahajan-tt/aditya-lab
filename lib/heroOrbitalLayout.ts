import type { PlaneValue } from "@/data/schema";

/**
 * Fixed sector center for each plane, 120° apart. `-90` (straight up, in
 * the SVG/screen convention this project already uses — see
 * three/objects/Core.tsx's NODE_ANGLES_DEG comment) matches the existing
 * hero core's "up" orientation so the AI plane keeps that same top slot.
 */
export const HERO_PLANE_CENTER_DEG: Record<PlaneValue, number> = {
  ai: -90,
  product: 30,
  business: 150,
};

export type LayoutInput = { id: string; planes: PlaneValue[] };
export type BodyAngle = { id: string; deg: number; spanning: boolean };

/**
 * One angle per body: the circular mean of its planes' center angles, then
 * bodies sharing an identical base angle are spread across `spreadDeg`
 * (default 26°, comfortably inside a plane's ~100° usable arc once the
 * ~20° gaps between planes are accounted for) so they render as distinct
 * points rather than stacking on top of each other.
 */
export function layoutBodyAngles(bodies: LayoutInput[], spreadDeg = 26): BodyAngle[] {
  const baseDeg = new Map<string, number>();

  // Below this magnitude, x/y are floating-point noise from summing
  // vectors that should mathematically cancel to exactly zero (e.g. a body
  // spanning all three evenly-spaced planes) — not a real directional
  // signal. atan2 of that noise is deterministic but semantically
  // meaningless (it would land near one arbitrary sector rather than at
  // the intended "equidistant from every plane" position), so treat
  // near-zero magnitude as the canonical 0° "belongs to every plane
  // equally" angle instead. The threshold sits comfortably above the
  // float-noise floor (~1e-16) and comfortably below the smallest real
  // multi-plane magnitude (a two-plane span's mean vector has magnitude
  // cos(60°) = 0.5).
  const ZERO_VECTOR_EPSILON = 1e-6;

  for (const body of bodies) {
    const radians = body.planes.map((plane) => (HERO_PLANE_CENTER_DEG[plane] * Math.PI) / 180);
    const x = radians.reduce((sum, r) => sum + Math.cos(r), 0) / radians.length;
    const y = radians.reduce((sum, r) => sum + Math.sin(r), 0) / radians.length;
    const magnitude = Math.hypot(x, y);
    baseDeg.set(body.id, magnitude < ZERO_VECTOR_EPSILON ? 0 : (Math.atan2(y, x) * 180) / Math.PI);
  }

  const groupKey = (body: LayoutInput) => [...body.planes].sort().join("+");
  const groups = new Map<string, LayoutInput[]>();
  for (const body of bodies) {
    const key = groupKey(body);
    groups.set(key, [...(groups.get(key) ?? []), body]);
  }

  const result: BodyAngle[] = [];
  for (const group of groups.values()) {
    const n = group.length;
    group.forEach((body, i) => {
      const center = baseDeg.get(body.id)!;
      const offset = n === 1 ? 0 : (i - (n - 1) / 2) * (spreadDeg / Math.max(1, n - 1));
      result.push({ id: body.id, deg: center + offset, spanning: body.planes.length > 1 });
    });
  }

  return result;
}

/** Degrees (screen/XZ convention) → a 2D point at the given radius. */
export function degToXY(deg: number, radius: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}
