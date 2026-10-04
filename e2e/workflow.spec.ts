import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { workflows } from "@/data/workflows";
import { getAllWorkflows, getWorkflow } from "@/data/queries";
import { stepChips, phaseSteps, nodeLabel, KIND_TAG } from "@/components/systems/workflowSteps";
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

test.describe("step list helpers @workflow-list", () => {
  test("phaseSteps keeps array order and skips store nodes", () => {
    const w = orbit();
    const a = phaseSteps(w, "A");
    expect(a.every((n) => n.kind !== "store")).toBe(true);
    expect(a[0]!.id).toBe("a-trigger");
    const total = w.phases.reduce((n, p) => n + phaseSteps(w, p.id).length, 0);
    expect(total).toBe(w.nodes.filter((n) => n.kind !== "store").length);
  });

  test("a step reads from and writes to stores and surfaces via data edges", () => {
    const w = orbit();
    const get = (id: string) => w.nodes.find((n) => n.id === id)!;
    expect(stepChips(w, get("a-apply")).reads).toEqual(["TAP QUEUE"]);
    expect(stepChips(w, get("a-write")).writes).toEqual(["ONE STATE FILE", "NOW VIEW"]);
    expect(stepChips(w, get("c-ingest")).writes).toEqual(["LOCAL DATABASE"]);
  });

  test("a gate lists one line per labelled outgoing edge", () => {
    const w = orbit();
    const gate = w.nodes.find((n) => n.id === "a-gate")!;
    expect(stepChips(w, gate).branches).toEqual([
      "YES → FLAG IT SMALLEST NEXT STEP",
      "NO → WEEKLY REVIEW",
    ]);
  });

  test("tags and labels", () => {
    expect(KIND_TAG.gate).toBe("CHECK");
    expect(nodeLabel(orbit().nodes.find((n) => n.id === "a-propose")!)).toBe("PROPOSE ONE COMMITMENT");
  });
});

test.describe("/systems @workflow-ui", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "viewport-specific: desktop project only");
  });
  test.use({ viewport: { width: 1280, height: 900 } });

  test("sections are numbered 01-05 with Workflows third and neural-heading intact", async ({ page }) => {
    await page.goto("/systems");
    const labels = await page.locator("p.label").allTextContents();
    for (const l of ["01 — SYSTEMS", "02 — AUTOMATION", "03 — WORKFLOWS", "04 — STRATEGY", "05 — CAPABILITY"]) {
      expect(labels, `missing ${l}`).toContain(l);
    }
    await expect(page.locator("#neural-heading")).toHaveCount(1);
  });

  test("Agent Pipeline renders as an h3 under Automation, and ORBIT links to its write-up", async ({ page }) => {
    await page.goto("/systems");
    await expect(page.getByRole("heading", { level: 3, name: "Agent Pipeline" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "ORBIT" })).toBeVisible();
    const link = page.getByRole("link", { name: /READ THE WRITE-UP: ORBIT/i });
    await expect(link).toHaveAttribute("href", "/systems/orbit");
  });
});

test.describe("/systems/orbit at 1280 @workflow-ui", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "viewport-specific: desktop project only");
  });
  test.use({ viewport: { width: 1280, height: 900 } });

  test("49 node buttons; focus shows detail; Escape clears; caption stays in view mid-figure", async ({ page }) => {
    await page.goto("/systems/orbit");
    const nodes = page.locator("figure svg [role='button']");
    await expect(nodes).toHaveCount(49);

    const caption = page.locator("figure figcaption");
    await expect(caption).toContainText("Hover, tab or tap a step for detail.");

    await nodes.first().focus();
    await expect(caption).toContainText("Three scheduled agent runs");

    await page.keyboard.press("Escape");
    await expect(caption).toContainText("Hover, tab or tap a step for detail.");

    // Mid-figure: the caption must still be on screen (sticky), not left behind below the fold.
    await nodes.nth(24).scrollIntoViewIfNeeded();
    await expect(caption).toBeInViewport();
  });

  test("Tab walks reading order, not the grid", async ({ page }) => {
    await page.goto("/systems/orbit");
    await page.locator("figure svg [role='button']").first().focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("figure figcaption")).toContainText("Every tap on the dashboard lands in a queue");
  });

  test("the skip link is first in the diagram and lands after it", async ({ page }) => {
    await page.goto("/systems/orbit");
    const skip = page.getByRole("link", { name: "Skip the diagram" });
    await skip.focus();
    await expect(skip).toBeVisible();
    await skip.press("Enter");
    await expect(page).toHaveURL(/#wf-after-orbit$/);
  });

  test("the list sits closed under the diagram and opens", async ({ page }) => {
    await page.goto("/systems/orbit");
    const details = page.locator("details", { hasText: "READ AS A LIST" });
    await expect(details).not.toHaveAttribute("open", "");
    await details.locator("summary").click();
    await expect(details.getByRole("heading", { level: 3, name: /DAILY CONTROL LOOP/ })).toBeVisible();
  });

  for (const route of ["/systems", "/systems/orbit"]) {
    test(`axe: no violations on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 30));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(800); // let GSAP reveals settle
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
});

test.describe("/systems/orbit at 375 @workflow-ui", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "viewport-specific: desktop project only");
  });
  test.use({ viewport: { width: 375, height: 812 } });

  test("no swimlane; four phase headings visible; no horizontal scroll", async ({ page }) => {
    await page.goto("/systems/orbit");
    await expect(page.locator("figure")).toBeHidden();
    for (const label of ["DAILY CONTROL LOOP", "PROJECT INTAKE", "REELS SWEEP", "APPROVED INSTALL"]) {
      await expect(page.getByRole("heading", { level: 3, name: new RegExp(label) })).toBeVisible();
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});

for (const size of [
  { width: 1280, height: 900 },
  { width: 375, height: 812 },
]) {
  test.describe(`/systems/orbit JS disabled at ${size.width} @workflow-nojs`, () => {
    test.beforeEach(({}, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "viewport-specific: desktop project only");
    });
    test.use({ viewport: size, javaScriptEnabled: false });

    test("a node detail from each phase is in the DOM", async ({ page }) => {
      await page.goto("/systems/orbit");
      const text = (await page.locator("body").textContent()) ?? "";
      for (const detail of [
        "Three scheduled agent runs", // A
        "The cap is three active projects", // B
        "Reads the saved collection through", // C
        "A skill security scanner runs", // D
      ]) {
        expect(text, `missing: ${detail}`).toContain(detail);
      }
    });
  });
}
