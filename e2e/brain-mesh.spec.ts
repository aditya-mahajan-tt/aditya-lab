import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBrainMesh, computeBrainMesh, labelBox, pointInPolygon } from "@/components/thinking/brainMesh";

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
  test(`${count} steps divide the brain into ${count} substantial sections @brain`, () => {
    const mesh = buildBrainMesh(count);
    expect(mesh.hubs).toHaveLength(count);
    for (let s = 0; s < count; s++) {
      const size = mesh.nodes.filter((n) => n.section === s).length;
      // Big enough to read as a region, not a corner.
      expect(size, `section ${s} of ${count}`).toBeGreaterThanOrEqual(8);
    }
    // No neuron falls outside every section.
    for (const n of mesh.nodes) {
      expect(n.section).toBeGreaterThanOrEqual(0);
      expect(n.section).toBeLessThan(count);
    }
  });
}

test("the mesh is dense (~150 neurons) with a few sparse blinkers that are not hubs @brain", () => {
  const mesh = buildBrainMesh(8);
  expect(mesh.nodes.length).toBeGreaterThanOrEqual(135);
  expect(mesh.nodes.length).toBeLessThanOrEqual(170);
  // Green stays a small fraction of the picture while idle.
  expect(mesh.blinkNodes.length).toBeGreaterThanOrEqual(9);
  expect(mesh.blinkNodes.length).toBeLessThanOrEqual(11);
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

test("no neuron or edge sits under a hub's label @brain", () => {
  // Violations are collected, not asserted per sample: this checks thousands of points.
  const violations: string[] = [];
  for (const count of [5, 8]) {
    const mesh = buildBrainMesh(count);
    const hubNodes = new Set(mesh.hubs.map((h) => h.node));
    for (const hub of mesh.hubs) {
      const box = labelBox(hub);
      const inside = (x: number, y: number) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;
      mesh.nodes.forEach((n, i) => {
        if (hubNodes.has(i)) return;
        if (inside(n.x, n.y)) violations.push(`N=${count}: neuron ${i} at ${n.x},${n.y} under label of hub ${hub.x},${hub.y}`);
        if (Math.hypot(n.x - hub.x, n.y - hub.y) < 16) violations.push(`N=${count}: neuron ${i} within 16 of hub ${hub.x},${hub.y}`);
      });
      for (const e of mesh.edges) {
        const a = mesh.nodes[e.a]!;
        const b = mesh.nodes[e.b]!;
        for (let k = 0; k <= 40; k++) {
          if (inside(a.x + ((b.x - a.x) * k) / 40, a.y + ((b.y - a.y) * k) / 40)) {
            violations.push(`N=${count}: edge ${e.a}-${e.b} crosses label of hub ${hub.x},${hub.y}`);
            break;
          }
        }
      }
    }
  }
  expect(violations).toEqual([]);
});

test("the brainstem and cerebellum are attached to the cerebrum @brain", () => {
  const { stemPath, cerebellumPath, outlinePolygon } = buildBrainMesh(8);
  // Every "M" and "C" anchor: the shapes must START inside the cerebrum (so its
  // fill hides the join) and reach outside it (so they are visible).
  const anchors = (d: string) =>
    [...d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m): [number, number] => [Number(m[1]), Number(m[2])]);
  for (const [name, d] of [["stem", stemPath], ["cerebellum", cerebellumPath]] as const) {
    const pts = anchors(d);
    expect(pointInPolygon(pts[0]![0], pts[0]![1], outlinePolygon), `${name} starts inside the cerebrum`).toBe(true);
    expect(pts.some(([x, y]) => !pointInPolygon(x, y, outlinePolygon)), `${name} emerges below/behind it`).toBe(true);
  }
});

test("the geometry module cannot depend on engine-specific maths or randomness @brain", () => {
  // The mesh is computed on the server and again in the browser; it must be
  // identical in every JS engine. Math.hypot's precision is implementation-defined
  // and Math.random is nondeterministic, so neither may appear -- not even in a comment.
  const source = readFileSync(join(process.cwd(), "components/thinking/brainMesh.ts"), "utf8");
  expect(source).not.toContain("Math.hypot");
  expect(source).not.toContain("Math.random");
});
