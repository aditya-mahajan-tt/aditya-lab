import { test, expect } from "@playwright/test";
import { workflows } from "@/data/workflows";
import { getAllWorkflows, getWorkflow } from "@/data/queries";

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
