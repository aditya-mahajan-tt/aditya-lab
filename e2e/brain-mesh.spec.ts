import { test, expect } from "@playwright/test";
import { buildBrainMesh, computeBrainMesh, pointInPolygon } from "@/components/thinking/brainMesh";

/**
 * Geometry of the /thinking brain. Node-run assertions in the Playwright
 * suite (no `page` argument), the same pattern as e2e/knowledge-retrieval.spec.ts.
 *
 * The geometry is computed on the server and again on the client, so it has
 * to be identical both times or hydration fails.
 */
test("the brain mesh is deterministic @brain", () => {
  // computeBrainMesh, not buildBrainMesh: the latter is memoised, so two calls
  // would return one object and prove nothing.
  const a = computeBrainMesh(8);
  const b = computeBrainMesh(8);
  expect(a).not.toBe(b);
  expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  expect(buildBrainMesh(8)).toBe(buildBrainMesh(8));
});

test("every coordinate is rounded to one decimal @brain", () => {
  const mesh = computeBrainMesh(8);
  for (const n of mesh.nodes) {
    expect(Number(n.x.toFixed(1))).toBe(n.x);
    expect(Number(n.y.toFixed(1))).toBe(n.y);
  }
});

for (const count of [5, 8]) {
  test(`${count} steps divide the brain into ${count} non-empty sections @brain`, () => {
    const mesh = buildBrainMesh(count);
    expect(mesh.hubs).toHaveLength(count);
    for (let s = 0; s < count; s++) {
      const size = mesh.nodes.filter((n) => n.section === s).length;
      expect(size, `section ${s} of ${count}`).toBeGreaterThanOrEqual(3);
    }
    // No neuron falls outside every section.
    for (const n of mesh.nodes) {
      expect(n.section).toBeGreaterThanOrEqual(0);
      expect(n.section).toBeLessThan(count);
    }
  });
}

test("the mesh is roughly 70 neurons with blinkers that are not hubs @brain", () => {
  const mesh = buildBrainMesh(8);
  expect(mesh.nodes.length).toBeGreaterThanOrEqual(60);
  expect(mesh.nodes.length).toBeLessThanOrEqual(80);
  expect(mesh.blinkNodes.length).toBeGreaterThanOrEqual(5);
  const hubNodes = new Set(mesh.hubs.map((h) => h.node));
  for (const b of mesh.blinkNodes) {
    expect(mesh.nodes[b], `blink node ${b} exists`).toBeDefined();
    expect(hubNodes.has(b), `blink node ${b} is a hub`).toBe(false);
  }
});

test("every neuron and hub lies inside the brain outline @brain", () => {
  for (const count of [5, 8]) {
    const mesh = buildBrainMesh(count);
    for (const n of mesh.nodes) {
      expect(pointInPolygon(n.x, n.y, mesh.outlinePolygon), `node at ${n.x},${n.y}`).toBe(true);
    }
    for (const h of mesh.hubs) {
      expect(pointInPolygon(h.x, h.y, mesh.outlinePolygon), `hub at ${h.x},${h.y}`).toBe(true);
    }
  }
});

test("the outline test is not vacuous: far-away points are outside @brain", () => {
  const mesh = buildBrainMesh(8);
  expect(pointInPolygon(20, 20, mesh.outlinePolygon)).toBe(false);
  expect(pointInPolygon(620, 420, mesh.outlinePolygon)).toBe(false);
  expect(pointInPolygon(340, 210, mesh.outlinePolygon)).toBe(true);
});

test("edges reference real neurons and only belong to a section both ends share @brain", () => {
  const mesh = buildBrainMesh(8);
  expect(mesh.edges.length).toBeGreaterThan(mesh.nodes.length);
  let crossing = 0;
  for (const e of mesh.edges) {
    const a = mesh.nodes[e.a];
    const b = mesh.nodes[e.b];
    expect(a, `edge endpoint ${e.a}`).toBeDefined();
    expect(b, `edge endpoint ${e.b}`).toBeDefined();
    if (e.section === null) {
      crossing++;
      expect(a!.section).not.toBe(b!.section);
    } else {
      expect(a!.section).toBe(e.section);
      expect(b!.section).toBe(e.section);
    }
  }
  // Sections are distinct regions, so some edges must cross a boundary.
  expect(crossing).toBeGreaterThan(0);
});

test("each hub is a neuron in its own step's section, and sections are nearest-hub Voronoi cells @brain", () => {
  const mesh = buildBrainMesh(8);
  mesh.hubs.forEach((h, i) => {
    expect(mesh.nodes[h.node]!.section).toBe(i);
    expect(mesh.nodes[h.node]!.x).toBe(h.x);
    expect(mesh.nodes[h.node]!.y).toBe(h.y);
  });
  expect(new Set(mesh.hubs.map((h) => h.node)).size).toBe(mesh.hubs.length);
  for (const n of mesh.nodes) {
    const nearest = mesh.hubs
      .map((h, i) => ({ i, d: Math.hypot(n.x - h.x, n.y - h.y) }))
      .sort((p, q) => p.d - q.d)[0]!;
    expect(n.section).toBe(nearest.i);
  }
});

test("hubs run from the back, up and over the top, like the approved mockup @brain", () => {
  const { hubs } = buildBrainMesh(8);
  // OBSERVE lands at the right/back of the loop, on the ellipse's mid-line.
  expect(Math.abs(hubs[0]!.x - 530)).toBeLessThan(30);
  expect(Math.abs(hubs[0]!.y - 210)).toBeLessThan(30);
  // 02 and 03 are above the mid-line (over the top), 06 and 07 below it.
  expect(hubs[1]!.y).toBeLessThan(210);
  expect(hubs[2]!.y).toBeLessThan(210);
  expect(hubs[5]!.y).toBeGreaterThan(210);
  expect(hubs[6]!.y).toBeGreaterThan(210);
  // 04 FRAME is at the front-top, 05 BUILD at the front (left of centre).
  expect(hubs[3]!.x).toBeLessThan(340);
  expect(hubs[4]!.x).toBeLessThan(hubs[3]!.x + 1);
  expect(hubs[4]!.x).toBeLessThan(340);
});
