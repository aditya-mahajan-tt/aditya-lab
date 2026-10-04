import { test, expect } from "@playwright/test";
import { workflows } from "@/data/workflows";
import { getAllWorkflows, getWorkflow } from "@/data/queries";
import { layoutSwimlane, routeSwimlaneEdge, SWIMLANE } from "@/components/systems/diagramLayout";

/**
 * Node-run assertions (no `page`) for the workflow content model, matching
 * e2e/knowledge-retrieval.spec.ts. Browser tests live further down this file.
 */
const orbit = () => {
  const w = getWorkflow("orbit");
  if (!w) throw new Error("orbit workflow missing");
  return w;
};

test.describe("workflow data @workflow-data", () => {
  test("queries return the parsed workflows", () => {
    expect(getAllWorkflows()).toHaveLength(workflows.length);
    expect(getWorkflow("orbit")?.title).toBe("ORBIT");
    expect(getWorkflow("does-not-exist")).toBeUndefined();
  });

  test("node ids are unique and no two nodes share a lane and row", () => {
    for (const w of workflows) {
      const ids = w.nodes.map((n) => n.id);
      expect(new Set(ids).size, `${w.slug} duplicate node ids`).toBe(ids.length);
      const cells = w.nodes.map((n) => `${n.lane}:${n.row}`);
      expect(new Set(cells).size, `${w.slug} two nodes share a cell`).toBe(cells.length);
    }
  });

  test("every edge resolves and no node is without an edge", () => {
    for (const w of workflows) {
      const ids = new Set(w.nodes.map((n) => n.id));
      const linked = new Set<string>();
      for (const e of w.edges) {
        expect(ids.has(e.from), `${e.from} missing`).toBe(true);
        expect(ids.has(e.to), `${e.to} missing`).toBe(true);
        linked.add(e.from);
        linked.add(e.to);
      }
      for (const id of ids) expect(linked.has(id), `${id} has no edge`).toBe(true);
    }
  });

  test("every label line is 18 characters or fewer and every node has a detail", () => {
    for (const w of workflows) {
      for (const n of w.nodes) {
        for (const line of n.label) expect(line.length, `${n.id}: "${line}"`).toBeLessThanOrEqual(18);
        expect(n.detail.length, `${n.id} has no detail`).toBeGreaterThan(0);
      }
    }
  });

  test("ORBIT has 49 nodes across four phases, each caption sitting on one of its own nodes", () => {
    const w = orbit();
    expect(w.nodes).toHaveLength(49);
    expect(w.phases.map((p) => p.id)).toEqual(["A", "B", "C", "D"]);
    for (const p of w.phases) {
      const at = w.nodes.find((n) => n.lane === p.lane && n.row === p.row);
      expect(at?.phase, `phase ${p.id} caption cell`).toBe(p.id);
    }
  });

  test("public-detail guard: no avoidance / procrastination / perfectionism language", () => {
    expect(JSON.stringify(orbit())).not.toMatch(/avoidance|procrastinat|perfectionis/i);
  });
});

test.describe("swimlane layout @workflow-layout", () => {
  test("positions follow the validated grid (spec 6.1)", () => {
    const w = orbit();
    const { positions, width, height } = layoutSwimlane(w.nodes, w.lanes);
    expect(width).toBe(1180);
    expect(height).toBe(1504);
    // a-trigger: lane "orbit" (index 1), row 1
    expect(positions["a-trigger"]).toEqual({ x: 1 * 236 + 118, y: 72 + 0 * 88 + 44 });
    // d-status: lane "human" (index 2), row 16
    expect(positions["d-status"]).toEqual({ x: 2 * 236 + 118, y: 72 + 15 * 88 + 44 });
  });

  test("an unknown lane throws rather than drawing at NaN", () => {
    expect(() => layoutSwimlane([{ id: "x", lane: "nope", row: 1 }], [{ id: "a" }])).toThrow(/nope/);
  });

  test("routing: same row is one horizontal segment, same lane one vertical", () => {
    const a = { x: 118, y: 100 };
    const row = routeSwimlaneEdge(a, { x: 354, y: 100 }, SWIMLANE);
    expect(row.points).toEqual([{ x: 118 + 98, y: 100 }, { x: 354 - 98, y: 100 }]);
    const lane = routeSwimlaneEdge(a, { x: 118, y: 188 }, SWIMLANE);
    expect(lane.points).toEqual([{ x: 118, y: 100 + 26 }, { x: 118, y: 188 - 26 }]);
  });

  test("routing: default leaves the side then enters top/bottom; vh leaves vertically then enters the side", () => {
    const a = { x: 118, y: 100 };
    const b = { x: 354, y: 188 };
    expect(routeSwimlaneEdge(a, b, SWIMLANE).points).toEqual([
      { x: 118 + 98, y: 100 },
      { x: 354, y: 100 },
      { x: 354, y: 188 - 26 },
    ]);
    expect(routeSwimlaneEdge(a, b, SWIMLANE, "vh").points).toEqual([
      { x: 118, y: 100 + 26 },
      { x: 118, y: 188 },
      { x: 354 - 98, y: 188 },
    ]);
  });

  test("no ORBIT edge passes through a node (spec 6.1 'validated' claim, enforced)", () => {
    const w = orbit();
    const { positions } = layoutSwimlane(w.nodes, w.lanes);
    const half = { w: SWIMLANE.nodeW / 2, h: SWIMLANE.nodeH / 2 };
    for (const e of w.edges) {
      const { points } = routeSwimlaneEdge(positions[e.from]!, positions[e.to]!, SWIMLANE, e.route);
      for (let i = 0; i < points.length - 1; i++) {
        const p = points[i]!;
        const q = points[i + 1]!;
        const [x1, x2] = [Math.min(p.x, q.x), Math.max(p.x, q.x)];
        const [y1, y2] = [Math.min(p.y, q.y), Math.max(p.y, q.y)];
        for (const n of w.nodes) {
          if (n.id === e.from || n.id === e.to) continue;
          const c = positions[n.id]!;
          const hits = x1 < c.x + half.w && x2 > c.x - half.w && y1 < c.y + half.h && y2 > c.y - half.h;
          expect(hits, `edge ${e.from} -> ${e.to} crosses node ${n.id}`).toBe(false);
        }
      }
    }
  });
});
