# ORBIT Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ORBIT to the site as the first "workflow": a `workflow` content type, one combined swimlane flowchart, a Workflows section on `/systems`, a write-up page at `/systems/orbit`, search / sitemap / Ask-the-Lab wiring, and the in-scope audit fixes.

**Architecture:** Zod schema + `data/workflows.ts` are the single source. One `WorkflowDiagram` client component renders a 5-lane SVG swimlane at `xl`+ and a stacked step list (same data, `WorkflowStepList`) below `xl`; the list also sits in a closed `<details>` at `xl`+ as the no-JS route. Pure layout/routing math lives in `diagramLayout.ts` so it can be unit-tested in Node.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4 (theme tokens), Zod, Playwright (node-run + browser tests under `e2e/`). **No new dependency.**

**Spec:** `docs/superpowers/specs/2026-10-04-orbit-workflow-design.md` (section numbers below refer to it).

## Global Constraints

- No new dependency, colour, size, duration or z-index: every value is an existing token (spec §3). Use `z-[var(--z-sticky)]`.
- No number in copy except rule thresholds (three projects, 48 hours, 25 and 90 minutes, two and three postponements, every three days, hourly) (spec §1).
- Never write: "avoidance", "procrastination", "perfectionism"; the security scanner's name; any Instagram endpoint/header detail; a link to the Command Centre (spec §1).
- Draft narrative copy keeps the literal inline `[AI_DRAFT_REVIEW]` marker. `npm run build` fails on it by design. While markers exist run `ALLOW_PLACEHOLDERS_IN_PROD=1 npm run build` / `ALLOW_PLACEHOLDERS_IN_PROD=1 npm run verify`. **Never set that variable in Vercel.**
- The §5 data (lane/row grid, node ids, labels, details) is validated: use it as written. Do not re-lay-out, rename nodes or rewrite details.
- Content comes from `/data`, never hardcoded in a component. Every string goes through `<Fill>` where it can carry a marker.
- Zero console errors / React warnings; keyboard-operable; reduced motion respected; no horizontal scroll at 375px.
- `git add` explicit paths only. The working tree has unrelated untracked files (`.claude/`, `AGENTS.md`, `Aditya_Mahajan_OnePager.pdf`, `design-update-referene.md`, `skills-lock.json`): never commit them.
- Playwright's `webServer` runs `npm run start`, so **a production build must exist before any `npx playwright test`**: `ALLOW_PLACEHOLDERS_IN_PROD=1 npm run build`. Rebuild after any source change that a browser test exercises. Node-run tests (no `page`) don't need a rebuild but the server still has to start.
- Per project memory: batch `npm run verify` / `npm run shot` per slice, not after every edit; a red e2e run can be stray processes (`lsof -i :4322`), not a regression.

## Plan review: spec discrepancies found and how this plan resolves them

| # | Finding | Resolution |
|---|---|---|
| R1 | `orbit-flowchart-reference.png` is **not** in `~/Downloads` (only the `.md`). Checkpoint B's visual comparison needs it. | Build from spec §6; add an automated "no edge through a node" geometry test; at Checkpoint B ask Aditya for the PNG. No claim of visual match without it. |
| R2 | Spec §6.3 uses `var(--space-4)`; it is documented in DESIGN_SYSTEM.md but **not defined** in `app/globals.css`. | Use Tailwind `bottom-4` (1rem, identical value). |
| R3 | Spec puts both the node tag and the phase caption "above the node". They collide. | Tag baseline `top - 8` (as `ProcessDiagram`), phase caption baseline `top - 20`. Row-1 captions land at y=70, above the header divider at y=72. Flagged for Checkpoint B review. |
| R4 | Spec §7.3 says update `CommandPalette.tsx` "if it groups by a fixed list". It does not (renders `item.group` per item). | No change to `CommandPalette.tsx`; only widen `CommandGroup` in `lib/search.ts`. |
| R5 | Retrieval risk: for "Tell me about his AI agent work", ORBIT's leadTopics ("scheduled agents", "workflow") score on substrings "agent" and "work". It could outrank Turbotork. | The §8 test asserts Turbotork stays first. If it fails, **stop and ask Aditya**: changing `leadTopics` changes validated data. |
| R6 | `buildWorkflowSections` still emits `Status: WORKING` and the unmarked `subtitle` to Ask the Lab even while narrative fields are drafts; Aditya has not confirmed the status (spec §11 #2). | Acceptable pre-merge (deploy is blocked on Aditya removing markers). Called out in Checkpoint C. |
| R7 | Spec §6.4 needs the list at `<xl` (visible) and in a `<details>` at `xl`+. One DOM node can't be both. | Render `WorkflowStepList` twice (`xl:hidden` div, `hidden xl:block` details). No `id` attributes inside it, so no duplicate ids. |
| R8 | e2e `mobile` project is Pixel 7 (isMobile). Viewport-specific tests would be skewed. | Browser tests in `workflow.spec.ts` are desktop-project only. |

## File Structure

| File | Responsibility |
|---|---|
| `data/schema.ts` (modify) | Add workflow Zod schemas + inferred types (spec §4) |
| `data/workflows.ts` (create) | ORBIT content (spec §5.2, extracted verbatim) + `workflowsIntro` |
| `data/queries.ts` (modify) | `getAllWorkflows()`, `getWorkflow(slug)` |
| `components/systems/diagramLayout.ts` (modify) | `SWIMLANE`, `layoutSwimlane`, `routeSwimlaneEdge` (existing layouts untouched) |
| `components/systems/workflowSteps.ts` (create) | Pure helpers: `KIND_TAG`, `nodeLabel`, `stepChips`, `phaseSteps` |
| `components/systems/WorkflowStepList.tsx` (create) | Stacked phase/step list (no `"use client"`) |
| `components/systems/WorkflowDiagram.tsx` (create) | Client swimlane SVG, sticky caption, skip link, `<details>` list |
| `components/systems/AgentPipeline.tsx` (create) | Audit fix 3 |
| `app/systems/page.tsx` (modify) | Agent Pipeline + Workflows sections, renumber |
| `app/systems/[slug]/page.tsx` (create) | Write-up page |
| `app/sitemap.ts`, `lib/search.ts`, `lib/ai/link-suggestions.ts`, `lib/ai/knowledge.ts` (modify) | Wiring |
| `data/site.ts`, `data/stations.ts` (modify) | Audit fixes 1 and 4 |
| `e2e/workflow.spec.ts` (create) | Data, layout, wiring, UI tests |
| `e2e/site-url.spec.ts` (create) | Site URL resolution |
| `e2e/smoke.spec.ts`, `scripts/screenshots.mjs`, `e2e/knowledge-retrieval.spec.ts`, `e2e/link-suggestions.spec.ts` (modify) | Route coverage + new assertions |
| `ARCHITECTURE.md` (modify) | Document new files |

---

## Task 0: Branch, spec in repo, baseline

**Files:**
- Create: `docs/superpowers/specs/2026-10-04-orbit-workflow-design.md` (already copied from Downloads), this plan.

- [ ] **Step 1: Branch and commit the spec and plan**

```bash
cd /Users/adityamahajan/Projects/aditya-lab
git checkout -b feature/orbit-workflow
git add docs/superpowers/specs/2026-10-04-orbit-workflow-design.md docs/superpowers/plans/2026-10-04-orbit-workflow.md
git commit -m "docs: add ORBIT workflow spec and implementation plan"
```

- [ ] **Step 2: Establish a green baseline build**

```bash
npm run typecheck && npm run build
```
Expected: both pass (no drafts in `/data` yet). Leaves a `.next` for Playwright.

---

## Task 1: Schema, data and queries (Checkpoint A)

**Files:**
- Modify: `data/schema.ts` (insert before the `skills` section divider), `data/queries.ts`
- Create: `data/workflows.ts`, `e2e/workflow.spec.ts`

**Interfaces:**
- Produces: `WorkflowSchema`, types `Workflow`, `WorkflowNode`, `WorkflowEdge`, `WorkflowNodeKind` (z.enum, `.options` available); `workflows: Workflow[]`, `workflowsIntro: string`; `getAllWorkflows(): Workflow[]`, `getWorkflow(slug: string): Workflow | undefined`.

- [ ] **Step 1: Write the failing data tests**

Create `e2e/workflow.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx playwright test e2e/workflow.spec.ts --project=desktop -g "@workflow-data"
```
Expected: FAIL: cannot resolve `@/data/workflows` / `getAllWorkflows` is not exported.

- [ ] **Step 3: Add the schema, verbatim from spec §4**

Extracts the first ```ts fence after `## 4. Content model` and inserts it before the skills divider:

```bash
node -e '
const fs = require("fs");
const spec = fs.readFileSync("docs/superpowers/specs/2026-10-04-orbit-workflow-design.md", "utf8");
const after = spec.slice(spec.indexOf("## 4. Content model"));
const block = after.match(/```ts\n([\s\S]*?)\n```/)[1];
const f = "data/schema.ts";
const src = fs.readFileSync(f, "utf8");
const marker = "/* --------------------------------------------------------------- skills */";
if (!src.includes(marker) || src.includes("WorkflowSchema")) throw new Error("unexpected schema.ts state");
fs.writeFileSync(f, src.replace(marker, block + "\n\n" + marker));
'
git diff --stat data/schema.ts
```
Expected: one file changed, ~100 insertions. `LeadTopics`, `Fillable`, `Plane`, `ExperimentStatus` are all defined above the insertion point.

- [ ] **Step 4: Create `data/workflows.ts`, verbatim from spec §5.2, plus the section intro (spec §7.1)**

```bash
node -e '
const fs = require("fs");
const spec = fs.readFileSync("docs/superpowers/specs/2026-10-04-orbit-workflow-design.md", "utf8");
const after = spec.slice(spec.indexOf("### 5.2 The file"));
const block = after.match(/```ts\n([\s\S]*?)\n```/)[1];
const intro = `
/**
 * Intro copy for the Workflows section on /systems (spec 7.1). Draft: Aditya
 * reviews it with the rest.
 */
export const workflowsIntro =
  "[AI_DRAFT_REVIEW] The diagrams above show the shape work takes. This one is a system that runs: scheduled agents, real integrations, and the checks that decide what they are allowed to do.";
`;
fs.writeFileSync("data/workflows.ts", block + "\n" + intro);
'
grep -c "AI_DRAFT_REVIEW" data/workflows.ts
```
Expected: a count of 40+ (every narrative field). The file ends with `export const workflows = ...` followed by `workflowsIntro`.

- [ ] **Step 5: Add the queries**

In `data/queries.ts` add `import { workflows } from "./workflows";`, add `type Workflow` to the `./schema` import, and append before the `/* ---- hero ---- */` block:

```ts
/* ------------------------------------------------------------ workflows */

export const getAllWorkflows = (): Workflow[] => [...workflows];

export const getWorkflow = (slug: string): Workflow | undefined =>
  workflows.find((w) => w.slug === slug);
```

- [ ] **Step 6: Run to verify it passes, plus typecheck**

```bash
npx playwright test e2e/workflow.spec.ts --project=desktop -g "@workflow-data" && npm run typecheck
```
Expected: 6 passed; typecheck clean. If the cell-uniqueness or edge test fails, the spec data has a defect: **stop and report to Aditya**; do not edit the grid.

- [ ] **Step 7: Commit**

```bash
npm run check:placeholders   # regenerates CONTENT_TODO.md; expect many DRAFT entries for data/workflows.ts
git add data/schema.ts data/workflows.ts data/queries.ts e2e/workflow.spec.ts CONTENT_TODO.md
git commit -m "feat(workflows): add workflow content type and ORBIT data"
```

### Checkpoint A report (CLAUDE.md §6 format), then continue

---

## Task 2: Swimlane layout and edge routing (pure, tested)

**Files:**
- Modify: `components/systems/diagramLayout.ts` (append; existing exports untouched)
- Modify: `e2e/workflow.spec.ts` (append tests)

**Interfaces:**
- Produces:
  - `SWIMLANE = { laneW: 236, nodeW: 196, nodeH: 52, rowH: 88, head: 72, pad: 24 }`, `type SwimlaneOptions = typeof SWIMLANE`
  - `layoutSwimlane(nodes: {id; lane; row}[], lanes: {id}[], opts?): { positions: Record<string, NodePosition>; width: number; height: number }`
  - `routeSwimlaneEdge(a: NodePosition, b: NodePosition, opts: SwimlaneOptions, route?: "vh"): RoutedEdge` where `RoutedEdge = { points: NodePosition[]; label: { x: number; y: number; anchor: "middle" | "start" } }`

- [ ] **Step 1: Write the failing tests**

Append to `e2e/workflow.spec.ts` (add the two imports at the top of the file):

```ts
import { layoutSwimlane, routeSwimlaneEdge, SWIMLANE } from "@/components/systems/diagramLayout";

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
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx playwright test e2e/workflow.spec.ts --project=desktop -g "@workflow-layout"
```
Expected: FAIL: `layoutSwimlane` / `SWIMLANE` not exported.

- [ ] **Step 3: Implement (append to `components/systems/diagramLayout.ts`)**

```ts
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
    points = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
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
```

- [ ] **Step 4: Run to verify it passes**

```bash
npx playwright test e2e/workflow.spec.ts --project=desktop -g "@workflow-layout" && npm run typecheck
```
Expected: 5 passed. If "no edge passes through a node" fails, the spec's "validated" claim is false for that edge: report the exact edge to Aditya; do not change the data.

- [ ] **Step 5: Commit**

```bash
git add components/systems/diagramLayout.ts e2e/workflow.spec.ts
git commit -m "feat(workflows): swimlane layout and edge routing with geometry tests"
```

---

## Task 3: Step list (the no-JS and `<xl` route)

**Files:**
- Create: `components/systems/workflowSteps.ts`, `components/systems/WorkflowStepList.tsx`
- Modify: `e2e/workflow.spec.ts`

**Interfaces:**
- Produces (`workflowSteps.ts`):
  - `KIND_TAG: Record<WorkflowNode["kind"], string>` = `{trigger:"TRIGGER", step:"AGENT", gate:"CHECK", human:"YOU", surface:"DASHBOARD", store:"DATA", end:"END"}`
  - `nodeLabel(n: WorkflowNode): string` (lines joined by a space)
  - `stepChips(w: Workflow, n: WorkflowNode): { reads: string[]; writes: string[]; branches: string[] }`; `branches` entries look like `"YES → FLAG IT SMALLEST NEXT STEP"`
  - `phaseSteps(w: Workflow, phaseId: string): WorkflowNode[]` (array order, `store` nodes skipped)
- Produces (`WorkflowStepList.tsx`): `WorkflowStepList({ workflow }: { workflow: Workflow })`. Phase headings are `h3`; no `id` attributes.

- [ ] **Step 1: Write the failing tests**

Add `import { stepChips, phaseSteps, nodeLabel, KIND_TAG } from "@/components/systems/workflowSteps";` and append:

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx playwright test e2e/workflow.spec.ts --project=desktop -g "@workflow-list"
```
Expected: FAIL: module `workflowSteps` not found.

- [ ] **Step 3: Implement `components/systems/workflowSteps.ts`**

```ts
import type { Workflow, WorkflowNode } from "@/data/schema";

/** The tag printed above each node and in the list. Shape carries meaning; this names it. */
export const KIND_TAG: Record<WorkflowNode["kind"], string> = {
  trigger: "TRIGGER",
  step: "AGENT",
  gate: "CHECK",
  human: "YOU",
  surface: "DASHBOARD",
  store: "DATA",
  end: "END",
};

export const nodeLabel = (n: WorkflowNode) => n.label.join(" ");

const isRecord = (n: WorkflowNode) => n.kind === "store" || n.kind === "surface";

/**
 * READS / WRITES come from data edges to or from a store or surface; a gate
 * lists one "YES → TARGET" line per labelled outgoing edge (spec 6.4).
 */
export function stepChips(w: Workflow, node: WorkflowNode) {
  const byId = new Map(w.nodes.map((n) => [n.id, n]));
  const reads: string[] = [];
  const writes: string[] = [];
  const branches: string[] = [];

  for (const e of w.edges) {
    if (e.kind === "data") {
      if (e.to === node.id) {
        const from = byId.get(e.from);
        if (from && isRecord(from)) reads.push(nodeLabel(from));
      } else if (e.from === node.id) {
        const to = byId.get(e.to);
        if (to && isRecord(to)) writes.push(nodeLabel(to));
      }
    } else if (node.kind === "gate" && e.from === node.id && e.label) {
      const to = byId.get(e.to);
      if (to) branches.push(`${e.label} → ${nodeLabel(to)}`);
    }
  }
  return { reads, writes, branches };
}

/** A phase's nodes in reading order, without the data stores (they appear as chips). */
export const phaseSteps = (w: Workflow, phaseId: string): WorkflowNode[] =>
  w.nodes.filter((n) => n.phase === phaseId && n.kind !== "store");
```

- [ ] **Step 4: Implement `components/systems/WorkflowStepList.tsx`**

```tsx
import { Fill } from "@/components/ui/Placeholder";
import type { Workflow } from "@/data/schema";
import { KIND_TAG, nodeLabel, phaseSteps, stepChips } from "./workflowSteps";

/**
 * The same workflow as plain text: the route to every node detail with
 * JavaScript off, and the whole diagram below `xl` (spec 6.4). Server-safe:
 * no state, no ids (it is rendered twice on the page, see WorkflowDiagram).
 * Phase headings are h3 because the parent page supplies the h2.
 */
export function WorkflowStepList({ workflow }: { workflow: Workflow }) {
  const laneLabel = new Map(workflow.lanes.map((l) => [l.id, l.label]));

  return (
    <div className="space-y-12">
      {workflow.phases.map((phase) => (
        <section key={phase.id}>
          <h3 className="font-mono text-sm uppercase tracking-[0.08em] text-accent">
            {phase.id} · {phase.label}
          </h3>
          <p className="prose-lab mt-3 text-text-muted">
            <Fill value={phase.summary} />
          </p>

          <ol className="mt-6 space-y-6">
            {phaseSteps(workflow, phase.id).map((node) => {
              const { reads, writes, branches } = stepChips(workflow, node);
              return (
                <li key={node.id} className="border-l border-border pl-4">
                  <p className="label">
                    {KIND_TAG[node.kind]} · {laneLabel.get(node.lane)}
                  </p>
                  <p className="mt-1 font-mono text-sm uppercase tracking-[0.08em] text-text">
                    {nodeLabel(node)}
                  </p>
                  <p className="prose-lab mt-2 text-text-muted">{node.detail}</p>
                  {(reads.length > 0 || writes.length > 0 || branches.length > 0) && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {reads.map((r) => (
                        <li key={`r-${r}`} className="rounded-sm border border-border px-2 py-0.5 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">
                          READS {r}
                        </li>
                      ))}
                      {writes.map((x) => (
                        <li key={`w-${x}`} className="rounded-sm border border-border px-2 py-0.5 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">
                          WRITES {x}
                        </li>
                      ))}
                      {branches.map((b) => (
                        <li key={`b-${b}`} className="rounded-sm border border-border-strong px-2 py-0.5 font-mono text-xs uppercase tracking-[0.08em] text-text">
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run to verify it passes, plus typecheck and lint**

```bash
npx playwright test e2e/workflow.spec.ts --project=desktop -g "@workflow-list" && npm run typecheck && npm run lint
```
Expected: 4 passed; typecheck and lint clean. If the `writes` order assertion fails, the edges order in the data differs from the test's expectation: fix the *test* to match the data order, not the data.

- [ ] **Step 6: Commit**

```bash
git add components/systems/workflowSteps.ts components/systems/WorkflowStepList.tsx e2e/workflow.spec.ts
git commit -m "feat(workflows): stacked step list with reads/writes/branch chips"
```

---

## Task 4: The swimlane diagram component

**Files:**
- Create: `components/systems/WorkflowDiagram.tsx`

**Interfaces:**
- Consumes: `layoutSwimlane`, `routeSwimlaneEdge`, `SWIMLANE` (Task 2); `KIND_TAG`, `nodeLabel` (Task 3); `WorkflowStepList` (Task 3).
- Produces: `WorkflowDiagram({ workflow }: { workflow: Workflow })` (client component). DOM contract used by Task 7 tests: exactly one `<figure>` (hidden below `xl`) containing the `<svg>`; each node is `role="button"` inside it; the sticky `<figcaption aria-live="polite">`; a skip link text "Skip the diagram"; a `<details>` with `<summary>` "READ AS A LIST".

Rendering is verified through the page in Task 7 (visual component; no pure logic to unit-test beyond Tasks 2 and 3).

- [ ] **Step 1: Write the component**

Create `components/systems/WorkflowDiagram.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import type { Workflow, WorkflowNode } from "@/data/schema";
import { layoutSwimlane, routeSwimlaneEdge, SWIMLANE } from "./diagramLayout";
import { WorkflowStepList } from "./WorkflowStepList";
import { KIND_TAG, nodeLabel } from "./workflowSteps";

const { nodeW: W, nodeH: H } = SWIMLANE;
const INSET = 16; // gate hexagon point inset (spec 6.2)

type Kind = WorkflowNode["kind"];

/** Spec 6.2. Shape carries meaning; accent colour appears only for the active node. */
const KIND_STYLE: Record<Kind, { fill: string; stroke: string; dash?: string }> = {
  trigger: { fill: "var(--color-surface)", stroke: "var(--color-border-strong)" },
  step: { fill: "var(--color-surface)", stroke: "var(--color-border)" },
  gate: { fill: "var(--color-surface)", stroke: "var(--color-border-strong)" },
  human: { fill: "var(--color-surface)", stroke: "var(--color-border-strong)" },
  surface: { fill: "var(--color-surface-raised)", stroke: "var(--color-border-strong)" },
  store: { fill: "var(--color-surface)", stroke: "var(--color-border-strong)", dash: "5 4" },
  end: { fill: "var(--color-bg)", stroke: "var(--color-border)" },
};

const LEGEND_KINDS: Kind[] = ["trigger", "step", "gate", "human", "surface", "store", "end"];

function Shape({
  kind,
  x,
  y,
  w = W,
  h = H,
  active = false,
}: {
  kind: Kind;
  x: number; // centre
  y: number; // centre
  w?: number;
  h?: number;
  active?: boolean;
}) {
  const s = KIND_STYLE[kind];
  const left = x - w / 2;
  const top = y - h / 2;
  const common = {
    fill: s.fill,
    stroke: active ? "var(--color-accent)" : s.stroke,
    strokeWidth: 1.5,
    strokeDasharray: s.dash,
    className: "transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none",
  };
  if (kind === "gate") {
    const inset = h === H ? INSET : INSET / 2;
    const pts = [
      [left, y],
      [left + inset, top],
      [left + w - inset, top],
      [left + w, y],
      [left + w - inset, top + h],
      [left + inset, top + h],
    ]
      .map((p) => p.join(","))
      .join(" ");
    return <polygon points={pts} {...common} />;
  }
  const rx = kind === "trigger" || kind === "human" ? h / 2 : 4;
  return <rect x={left} y={top} width={w} height={h} rx={rx} {...common} />;
}

/**
 * Spec 6: one combined swimlane. `xl` and up: the SVG, a sticky detail
 * caption, a skip link, and the same data as a closed <details> list. Below
 * `xl`: the list alone. Both come from the same workflow object. No
 * role="img" on the svg: it has focusable descendants (see ProcessDiagram).
 */
export function WorkflowDiagram({ workflow }: { workflow: Workflow }) {
  const [active, setActive] = useState<string | null>(null);

  const { positions, width, height } = useMemo(
    () => layoutSwimlane(workflow.nodes, workflow.lanes),
    [workflow],
  );
  const edges = useMemo(
    () =>
      workflow.edges.map((e) => ({
        ...e,
        routed: routeSwimlaneEdge(positions[e.from]!, positions[e.to]!, SWIMLANE, e.route),
      })),
    [workflow, positions],
  );
  const phaseCaptions = useMemo(
    () =>
      workflow.phases.map((p) => {
        const node = workflow.nodes.find((n) => n.lane === p.lane && n.row === p.row);
        return { p, at: node ? positions[node.id]! : undefined };
      }),
    [workflow, positions],
  );

  const activeNode = active ? workflow.nodes.find((n) => n.id === active) : undefined;
  const touches = (e: { from: string; to: string }) => active !== null && (e.from === active || e.to === active);
  const arrow = `wf-arrow-${workflow.slug}`;
  const arrowOn = `wf-arrow-on-${workflow.slug}`;
  const after = `wf-after-${workflow.slug}`;
  const toggle = (id: string) => setActive((a) => (a === id ? null : id));

  // Legend sits bottom-left, in the empty block under Phase B (lanes 1-2, rows 14-16).
  const legendRow = 26;
  const legendTop = height - SWIMLANE.pad - (20 + (LEGEND_KINDS.length + 2) * legendRow);

  return (
    <div>
      <a
        href={`#${after}`}
        className="sr-only xl:focus:not-sr-only xl:focus:inline-flex xl:focus:min-h-11 xl:focus:items-center focus:rounded-sm focus:border focus:border-accent focus:bg-bg focus:px-4 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-accent"
      >
        Skip the diagram
      </a>

      <figure className="hidden xl:block" onKeyDown={(e) => e.key === "Escape" && setActive(null)}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" aria-label={`${workflow.title} workflow, swimlane diagram`}>
          <defs>
            {[
              [arrow, "var(--color-border-strong)"],
              [arrowOn, "var(--color-accent)"],
            ].map(([id, fill]) => (
              <marker key={id} id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 Z" fill={fill} />
              </marker>
            ))}
          </defs>

          {/* Lane headers and dividers */}
          <line x1={0} x2={width} y1={SWIMLANE.head} y2={SWIMLANE.head} stroke="var(--color-border)" />
          {workflow.lanes.map((lane, i) => (
            <g key={lane.id}>
              {i > 0 && <line x1={i * SWIMLANE.laneW} x2={i * SWIMLANE.laneW} y1={0} y2={height} stroke="var(--color-border)" />}
              <text
                x={i * SWIMLANE.laneW + SWIMLANE.laneW / 2}
                y={SWIMLANE.head / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="label"
                fill="currentColor"
              >
                {lane.label}
              </text>
            </g>
          ))}

          {/* Edges: idle first, so active edges paint on top */}
          {[...edges].sort((a, b) => Number(touches(a)) - Number(touches(b))).map((e) => {
            const on = touches(e);
            return (
              <g key={`${e.from}->${e.to}`}>
                <polyline
                  points={e.routed.points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={on ? "var(--color-accent)" : "var(--color-border-strong)"}
                  strokeWidth={1.5}
                  strokeDasharray={e.kind === "data" ? "3 4" : undefined}
                  markerEnd={`url(#${on ? arrowOn : arrow})`}
                  className="transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none"
                />
                {e.label && (
                  <text
                    x={e.routed.label.x}
                    y={e.routed.label.y}
                    textAnchor={e.routed.label.anchor}
                    className="fill-text-muted font-mono text-[10px] tracking-[0.08em]"
                  >
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Phase captions: the one static use of the accent (spec 6.2). Baseline sits above the tag. */}
          {phaseCaptions.map(({ p, at }) =>
            at ? (
              <text key={p.id} x={at.x - W / 2} y={at.y - H / 2 - 20} className="fill-accent font-mono text-[10px] tracking-[0.08em]">
                {p.id} · {p.label}
              </text>
            ) : null,
          )}

          {/* Nodes, in array (reading) order so Tab walks the flow */}
          {workflow.nodes.map((n) => {
            const c = positions[n.id]!;
            const isActive = active === n.id;
            return (
              <g
                key={n.id}
                tabIndex={0}
                role="button"
                aria-label={`${KIND_TAG[n.kind]}: ${nodeLabel(n)}. ${n.detail}`}
                className="cursor-default"
                onMouseEnter={() => setActive(n.id)}
                onMouseLeave={() => setActive((a) => (a === n.id ? null : a))}
                onFocus={() => setActive(n.id)}
                onBlur={() => setActive((a) => (a === n.id ? null : a))}
                onClick={() => toggle(n.id)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  toggle(n.id);
                }}
              >
                <Shape kind={n.kind} x={c.x} y={c.y} active={isActive} />
                <text x={c.x - W / 2 + 10} y={c.y - H / 2 - 8} className="fill-text-faint font-mono text-[10px] tracking-[0.08em]">
                  {KIND_TAG[n.kind]}
                </text>
                {n.label.map((line, i) => (
                  <text
                    key={line}
                    x={c.x}
                    y={c.y + (i - (n.label.length - 1) / 2) * 16}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-text font-mono text-[13px] uppercase tracking-[0.08em]"
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* Legend: seven shapes, two edge styles */}
          <g aria-hidden="true">
            <text x={24} y={legendTop} className="fill-text-faint font-mono text-[10px] tracking-[0.08em]">
              LEGEND
            </text>
            {LEGEND_KINDS.map((k, i) => (
              <g key={k}>
                <Shape kind={k} x={24 + 22} y={legendTop + 20 + i * legendRow} w={44} h={18} />
                <text x={24 + 56} y={legendTop + 20 + i * legendRow} dominantBaseline="middle" className="fill-text-muted font-mono text-[10px] tracking-[0.08em]">
                  {KIND_TAG[k]}
                </text>
              </g>
            ))}
            {(["flow", "data"] as const).map((k, i) => {
              const y = legendTop + 20 + (LEGEND_KINDS.length + i) * legendRow;
              return (
                <g key={k}>
                  <line x1={24} x2={24 + 44} y1={y} y2={y} stroke="var(--color-border-strong)" strokeWidth={1.5} strokeDasharray={k === "data" ? "3 4" : undefined} />
                  <text x={24 + 56} y={y} dominantBaseline="middle" className="fill-text-muted font-mono text-[10px] tracking-[0.08em]">
                    {k === "flow" ? "FLOW" : "DATA READ / WRITE"}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Taller than the viewport, so the caption sticks to its bottom (spec 6.3). */}
        <figcaption
          aria-live="polite"
          className="sticky bottom-4 z-[var(--z-sticky)] mt-4 min-h-[5.5rem] rounded-sm border border-border-strong bg-surface-raised p-4"
        >
          {activeNode ? (
            <>
              <p className="label">{KIND_TAG[activeNode.kind]}</p>
              <p className="mt-1 font-mono text-sm uppercase tracking-[0.08em] text-text">{nodeLabel(activeNode)}</p>
              <p className="mt-2 text-text-muted">{activeNode.detail}</p>
            </>
          ) : (
            <p className="label">Hover, tab or tap a step for detail.</p>
          )}
        </figcaption>
      </figure>

      <div id={after} tabIndex={-1} />

      {/* xl+: the text equivalent, closed by default. */}
      <details className="mt-8 hidden border-t border-border pt-4 xl:block">
        <summary className="label flex min-h-11 cursor-pointer items-center hover:text-accent">READ AS A LIST</summary>
        <div className="mt-6">
          <WorkflowStepList workflow={workflow} />
        </div>
      </details>

      {/* Below xl: the whole diagram. */}
      <div className="mt-8 xl:hidden">
        <WorkflowStepList workflow={workflow} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
npm run typecheck && npm run lint
```
Expected: clean. (No `useEffect`: no setState-in-effect lint concerns. If lint flags the in-page `<a href="#...">`, it is a hash link and should pass; if not, switch to `Link` from `next/link`.)

- [ ] **Step 3: Commit**

```bash
git add components/systems/WorkflowDiagram.tsx
git commit -m "feat(workflows): swimlane diagram with sticky detail caption and list fallback"
```

---

## Task 5: `/systems`: Agent Pipeline, Workflows section, renumber

**Files:**
- Create: `components/systems/AgentPipeline.tsx`
- Modify: `app/systems/page.tsx`
- Modify: `e2e/workflow.spec.ts` (append)

- [ ] **Step 1: Write the failing test (browser, desktop only)**

Append to `e2e/workflow.spec.ts` (add `import AxeBuilder from "@axe-core/playwright";` at the top):

```ts
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
```

- [ ] **Step 2: Create `components/systems/AgentPipeline.tsx`**

```tsx
import { getSystemDiagram } from "@/data/systems";
import { SystemDiagramCard } from "./SystemDiagramCard";

/** Audit fix 3: the agent-pipeline diagram existed in data and tests but no page rendered it. */
export function AgentPipeline() {
  const diagram = getSystemDiagram("agent-pipeline");
  if (!diagram) return null;
  return <SystemDiagramCard diagram={diagram} />;
}
```

- [ ] **Step 3: Edit `app/systems/page.tsx`**

Add imports:
```tsx
import { AgentPipeline } from "@/components/systems/AgentPipeline";
import { WorkflowDiagram } from "@/components/systems/WorkflowDiagram";
import { StatusChip } from "@/components/experiments/StatusChip";
import { Fill } from "@/components/ui/Placeholder";
import { getAllWorkflows } from "@/data/queries";
import { workflowsIntro } from "@/data/workflows";
import Link from "next/link";
```

In the Automation section, after the `AutomationEngine` `RevealText`, add:
```tsx
          <RevealText className="mt-16">
            <h3 className="text-[length:var(--text-xl)]">Agent Pipeline</h3>
          </RevealText>
          <RevealText className="mt-8">
            <AgentPipeline />
          </RevealText>
```
(If `--text-xl` is not a defined token, use the token the `h3`s elsewhere use; grep `app/globals.css` for `--text-` first.)

Insert the Workflows section between Automation and Strategy:
```tsx
      <section className="section border-t border-border" aria-labelledby="workflows-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">03 — WORKFLOWS</p>
            <p id="workflows-heading" className="prose-lab text-[length:var(--text-lg)] text-text-muted">
              <Fill value={workflowsIntro} />
            </p>
          </RevealText>

          {getAllWorkflows().map((w) => (
            <article key={w.slug} className="mt-16" aria-labelledby={`workflow-${w.slug}`}>
              <RevealText>
                <div className="flex flex-wrap items-center gap-4">
                  <p className="label">WORKFLOW_{w.id}</p>
                  <StatusChip status={w.status} />
                </div>
                <h2 id={`workflow-${w.slug}`} className="mt-4 text-[length:var(--text-2xl)]">
                  <Fill value={w.title} />
                </h2>
                {w.subtitle && <p className="mt-2 text-[length:var(--text-lg)] text-text-muted">{w.subtitle}</p>}
                <p className="prose-lab mt-6 text-[length:var(--text-lg)] text-text-muted">
                  <Fill value={w.summary} />
                </p>
              </RevealText>
              <div className="mt-8">
                <WorkflowDiagram workflow={w} />
              </div>
              <Link
                href={`/systems/${w.slug}`}
                className="label mt-6 inline-flex min-h-11 items-center gap-2 text-accent transition-colors duration-[var(--duration-fast)] hover:text-accent-dim"
              >
                READ THE WRITE-UP: {w.title} →
              </Link>
            </article>
          ))}
        </div>
      </section>
```
Note: `aria-labelledby="workflows-heading"` points at the intro paragraph, which has no heading role; acceptable as the accessible name of the region, and avoids adding a stray heading that would break the h2→h2 flow. Renumber: Strategy label → `04 — STRATEGY`, Capability label → `05 — CAPABILITY`.

- [ ] **Step 4: Build and run the tests**

```bash
npm run typecheck && npm run lint
ALLOW_PLACEHOLDERS_IN_PROD=1 npm run build
npx playwright test e2e/workflow.spec.ts --project=desktop -g "@workflow-ui"
```
Expected: build OK (with the override); 2 passed. If the page-level `/systems` hits a hydration/console error, fix before moving on.

- [ ] **Step 5: Commit**

```bash
git add components/systems/AgentPipeline.tsx app/systems/page.tsx e2e/workflow.spec.ts
git commit -m "feat(systems): render Agent Pipeline and Workflows section; renumber sections"
```

---

## Task 6: `/systems/[slug]` write-up page

**Files:**
- Create: `app/systems/[slug]/page.tsx`

Spec 7.2. Modelled on `app/work/[slug]/page.tsx`: `generateStaticParams`, `generateMetadata` (canonical `/systems/{slug}`, plain-text description via `stripDraftMarker`), `notFound()`, exactly one `h1`.

- [ ] **Step 1: Write the page**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllWorkflows, getWorkflow } from "@/data/queries";
import { stripDraftMarker } from "@/data/schema";
import { Fill } from "@/components/ui/Placeholder";
import { RevealText } from "@/components/effects/RevealText";
import { StatusChip } from "@/components/experiments/StatusChip";
import { WorkflowDiagram } from "@/components/systems/WorkflowDiagram";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllWorkflows().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const w = getWorkflow(slug);
  if (!w) return {};
  return {
    title: w.title,
    description: stripDraftMarker(w.summary),
    alternates: { canonical: `/systems/${w.slug}` },
  };
}

const Section = ({ n, label, children }: { n: string; label: string; children: React.ReactNode }) => (
  <section className="border-t border-border py-14" aria-labelledby={`s-${n}`}>
    <div className="container-lab">
      <RevealText>
        <p className="label mb-4">
          {n} — {label}
        </p>
        <h2 id={`s-${n}`} className="sr-only">
          {label}
        </h2>
      </RevealText>
      {children}
    </div>
  </section>
);

export default async function WorkflowPage({ params }: Params) {
  const { slug } = await params;
  const w = getWorkflow(slug);
  if (!w) notFound();

  const runsOn = w.integrations.find((i) => i.access === "runs on");

  return (
    <article>
      <header className="section">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">
              WORKFLOW_{w.id} · {w.year}
            </p>
            <h1 className="text-[length:var(--text-3xl)]">
              <Fill value={w.title} />
            </h1>
            {w.subtitle && <p className="mt-2 text-[length:var(--text-lg)] text-text-muted">{w.subtitle}</p>}
            <p className="prose-lab mt-8 text-[length:var(--text-lg)]">
              <Fill value={w.summary} />
            </p>
            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4">
              <div>
                <dt className="label">Status</dt>
                <dd className="mt-1">
                  <StatusChip status={w.status} />
                </dd>
              </div>
              {runsOn && (
                <div>
                  <dt className="label">Runs on</dt>
                  <dd className="mt-1 font-mono text-sm">{runsOn.name}</dd>
                </div>
              )}
            </dl>
          </RevealText>
        </div>
      </header>

      <Section n="01" label="WHY">
        <RevealText>
          <p className="prose-lab text-[length:var(--text-lg)] text-text-muted">
            <Fill value={w.why} />
          </p>
        </RevealText>
      </Section>

      <Section n="02" label="THE FLOW">
        <div className="mt-2">
          <WorkflowDiagram workflow={w} />
        </div>
      </Section>

      <Section n="03" label="CHECKS">
        <RevealText>
          <dl className="divide-y divide-border">
            {w.checks.map((c) => (
              <div key={c.rule} className="grid gap-2 py-4 md:grid-cols-[16rem_1fr] md:gap-8">
                <dt className="font-mono text-sm uppercase tracking-[0.08em] text-text">{c.rule}</dt>
                <dd className="prose-lab text-text-muted">
                  <Fill value={c.prevents} />
                </dd>
              </div>
            ))}
          </dl>
        </RevealText>
      </Section>

      <Section n="04" label="INTEGRATIONS">
        <RevealText>
          <ul className="divide-y divide-border">
            {w.integrations.map((i) => (
              <li key={i.name} className="grid gap-2 py-4 md:grid-cols-[16rem_9rem_1fr] md:gap-8">
                <span className="text-text">{i.name}</span>
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-text-faint">{i.access}</span>
                <span className="prose-lab text-text-muted">
                  <Fill value={i.note} />
                </span>
              </li>
            ))}
          </ul>
        </RevealText>
      </Section>

      <Section n="05" label="PRINCIPLES">
        <RevealText>
          <ul className="space-y-6">
            {w.principles.map((p) => (
              <li key={p.title}>
                <h3 className="font-mono text-sm uppercase tracking-[0.08em] text-text">{p.title}</h3>
                <p className="prose-lab mt-2 text-text-muted">
                  <Fill value={p.body} />
                </p>
              </li>
            ))}
          </ul>
        </RevealText>
      </Section>

      <Section n="06" label="LIMITS">
        <RevealText>
          <ul className="prose-lab space-y-4 text-[length:var(--text-lg)] text-text-muted">
            {w.limits.map((l, i) => (
              <li key={i} className="flex gap-4">
                <span className="text-accent">—</span>
                <Fill value={l} />
              </li>
            ))}
          </ul>
        </RevealText>
      </Section>

      {w.reflection && (
        <Section n="07" label="REFLECTION">
          <RevealText>
            <p className="prose-lab text-[length:var(--text-lg)] text-text-muted">{w.reflection}</p>
          </RevealText>
        </Section>
      )}

      <nav aria-label="Workflow navigation" className="border-t border-border py-10">
        <div className="container-lab">
          <Link href="/systems" className="label flex min-h-11 items-center hover:text-accent">
            ← All systems
          </Link>
        </div>
      </nav>
    </article>
  );
}
```

- [ ] **Step 2: Typecheck, lint, build; hit the route**

```bash
npm run typecheck && npm run lint && ALLOW_PLACEHOLDERS_IN_PROD=1 npm run build
```
Expected: build lists `/systems/[slug]` as SSG with `/systems/orbit`. The heading hierarchy (h1 → sr-only h2 per section → h3 phases) never skips.

- [ ] **Step 3: Commit**

```bash
git add "app/systems/[slug]/page.tsx"
git commit -m "feat(systems): add /systems/[slug] workflow write-up page"
```

---

## Task 7: Browser tests, route coverage and screenshots (Checkpoint B)

**Files:**
- Modify: `e2e/workflow.spec.ts`, `e2e/smoke.spec.ts`, `scripts/screenshots.mjs`

- [ ] **Step 1: Add the browser tests (spec §8 items 3-6)**

Append to `e2e/workflow.spec.ts`:

```ts
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

for (const size of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
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
```

- [ ] **Step 2: Add the three routes to the smoke suite and the screenshot script**

In `e2e/smoke.spec.ts` `ROUTES` add after `"/systems",`: `"/systems/orbit",`, and after `"/work/leadiq",`: `"/work/turbotork",`, and after `"/experiments/hidden",`: `"/experiments/ai-lead-generation-engine",`.

In `scripts/screenshots.mjs` `ROUTES` add: `["systems-orbit", "/systems/orbit"],`, `["work-turbotork", "/work/turbotork"],`, `["experiments-ai-lead-gen", "/experiments/ai-lead-generation-engine"],`.

- [ ] **Step 3: Build, then run the new and smoke tests**

```bash
ALLOW_PLACEHOLDERS_IN_PROD=1 npm run build
npx playwright test e2e/workflow.spec.ts e2e/smoke.spec.ts --project=desktop
```
Expected: all pass. If the sticky/in-viewport test fails, check that no ancestor has `overflow: hidden/auto` (that breaks `position: sticky`). `RevealText` only sets transform/opacity, which is fine. If a smoke route fails (e.g. `/work/turbotork` was previously untested), report the failure verbatim; it is an existing defect the audit predicted, and the fix goes in a separate commit.

- [ ] **Step 4: Screenshots, and actually read them**

```bash
ALLOW_PLACEHOLDERS_IN_PROD=1 npm run shot
```
Then **Read** `.screenshots/systems-orbit-*` (375 / 768 / 1280 / 1920) and `.screenshots/systems-*` with the Read tool. Check at 1280: five lanes, headers readable, no label clipped, no edge through a node, legend bottom-left under Phase B, phase captions legible and not colliding with tags (R3), caption panel visible. At 375/768: the list only, no horizontal scroll. Do not describe anything not seen.

- [ ] **Step 5: Run the repo gate once, then commit**

```bash
ALLOW_PLACEHOLDERS_IN_PROD=1 npm run verify
git add e2e/workflow.spec.ts e2e/smoke.spec.ts scripts/screenshots.mjs
git commit -m "test(workflows): browser, no-JS and route-coverage tests"
```

### Checkpoint B: STOP and report. Ask Aditya for `orbit-flowchart-reference.png` (R1), and flag R3 (caption offset) for his eye. Do not continue until he replies.

---

## Task 8: Wiring: sitemap, search, link suggestions, Ask the Lab, docs

**Files:**
- Modify: `app/sitemap.ts`, `lib/search.ts`, `lib/ai/link-suggestions.ts`, `lib/ai/knowledge.ts`, `ARCHITECTURE.md`
- Modify: `e2e/workflow.spec.ts`, `e2e/knowledge-retrieval.spec.ts`, `e2e/link-suggestions.spec.ts`

- [ ] **Step 1: Write the failing wiring tests**

Append to `e2e/workflow.spec.ts` (add imports `import sitemap from "@/app/sitemap";` and `import { searchCommands } from "@/lib/search";`):

```ts
test.describe("workflow wiring @workflow-wiring", () => {
  test("sitemap lists /systems/orbit at priority 0.6", () => {
    const entry = sitemap().find((e) => e.url.endsWith("/systems/orbit"));
    expect(entry?.priority).toBe(0.6);
  });

  test("the command palette finds ORBIT under a Systems group", () => {
    const hit = searchCommands("orbit").find((i) => i.href === "/systems/orbit");
    expect(hit?.group).toBe("Systems");
    expect(hit?.label).toBe("ORBIT");
  });
});
```

Append to `e2e/link-suggestions.spec.ts` (add `stripUnknownInternalPaths` to its existing `@/lib/ai/link-suggestions` import):

```ts
test("an answer that mentions ORBIT gets the /systems/orbit chip @links", () => {
  const link = suggestLink("ORBIT is his personal operating system built on scheduled agents.", "what personal automation has he built");
  expect(link).toEqual({ label: "ORBIT workflow", href: "/systems/orbit" });
});

test("/systems/orbit survives stripUnknownInternalPaths @links", () => {
  expect(stripUnknownInternalPaths("Read more at /systems/orbit for the flow.")).toContain("/systems/orbit");
});
```

Append to `e2e/knowledge-retrieval.spec.ts` (it already imports `getKnowledgeSections` and `selectSectionIds`):

```ts
test("ORBIT is its own retrievable section and answers a personal-automation question @retrieval", () => {
  expect(getKnowledgeSections().map((s) => s.id)).toContain("workflow-orbit");
  expect(selectSectionIds("What personal automation has he built?")).toContain("workflow-orbit");
});

test("Turbotork stays the primary reference for AI agent work @retrieval", () => {
  const pinned = new Set(getKnowledgeSections().filter((s) => s.pinned).map((s) => s.id));
  const ranked = selectSectionIds("Tell me about his AI agent work").filter((id) => !pinned.has(id));
  expect(ranked[0]).toBe("project-turbotork");
});

test("an unreviewed workflow's draft prose never reaches the corpus @retrieval", () => {
  const text = getKnowledgeSections().find((s) => s.id === "workflow-orbit")?.text ?? "";
  expect(text).not.toContain("AI_DRAFT_REVIEW");
  expect(text).not.toContain("Principle");
});
```
(The last test is correct only while the narrative fields are drafts; Aditya removes it or inverts it at Checkpoint C. Note this in the checkpoint report.)

- [ ] **Step 2: Run to verify they fail**

```bash
npx playwright test e2e/workflow.spec.ts e2e/link-suggestions.spec.ts e2e/knowledge-retrieval.spec.ts --project=desktop -g "@workflow-wiring|@links|@retrieval"
```
Expected: the new tests FAIL; existing ones still pass.

- [ ] **Step 3: Implement the wiring**

`app/sitemap.ts`: import `getAllWorkflows` and add after the experiments spread:
```ts
    ...getAllWorkflows().map((w) => ({
      url: `${site.url}/systems/${w.slug}`,
      lastModified: now,
      priority: 0.6,
    })),
```

`lib/search.ts`: import `getAllWorkflows`; `export type CommandGroup = "Navigate" | "Work" | "Experiments" | "Systems" | "AI";`; add in `buildIndex()`:
```ts
  const systems: CommandItem[] = getAllWorkflows().map((w) => ({
    id: `workflow-${w.slug}`,
    group: "Systems",
    label: titleOf(w.title, `WORKFLOW_${w.id}`),
    detail: w.subtitle,
    href: `/systems/${w.slug}`,
  }));
```
and return `[askTheLab, ...routes, ...projects, ...experiments, ...systems]`. Update the `searchCommands` doc comment to say "projects, experiments and workflows". `CommandPalette.tsx` needs no change (R4): confirm by reading that it renders `item.group` and no fixed list.

`lib/ai/link-suggestions.ts`: import `getAllWorkflows`; in `knownRoutes()` add `...getAllWorkflows().map((w) => `/systems/${w.slug}`),`; in `linkCandidates()` append:
```ts
    ...getAllWorkflows()
      .filter((w) => !isPlaceholder(w.title))
      .map((w) => ({
        title: w.title,
        leadTopics: w.leadTopics,
        label: `${w.title} workflow`,
        href: `/systems/${w.slug}`,
      })),
```

`lib/ai/knowledge.ts`: import `getAllWorkflows`; add after `buildExperimentSections`:
```ts
/**
 * One section per workflow (spec 7.3). The 49 node details are deliberately
 * left out: they would spend the token budget. Draft and placeholder fields
 * are skipped by field(), so this stays thin until Aditya approves the copy.
 */
function buildWorkflowSections(): KnowledgeSection[] {
  return getAllWorkflows()
    .map((w): KnowledgeSection | null => {
      const title = field(w.title);
      if (!title) return null;
      const text = section(`Workflow: ${title}${w.subtitle ? ` — ${w.subtitle}` : ""}`, [
        `Year: ${w.year}`,
        `Status: ${w.status}`,
        w.leadTopics.length > 0
          ? `PRIMARY REFERENCE for questions about: ${w.leadTopics.join(", ")}.`
          : null,
        field(w.summary) && `Summary: ${field(w.summary)}`,
        field(w.why) && `Why: ${field(w.why)}`,
        ...w.principles.map((p) => field(p.body) && `Principle, ${p.title}: ${field(p.body)}`),
        ...w.checks.map((c) => field(c.prevents) && `Check, ${c.rule}: prevents ${field(c.prevents)}`),
        ...w.integrations.map(
          (i) => field(i.note) && `Integration, ${i.name} (${i.access}): ${field(i.note)}`,
        ),
        ...w.limits.map((l) => field(l) && `Limit: ${field(l)}`),
        ...w.phases.map((p) => field(p.summary) && `Phase ${p.id}, ${p.label}: ${field(p.summary)}`),
        `Workflow page: /systems/${w.slug}`,
      ]);
      if (!text) return null;
      return {
        id: `workflow-${w.slug}`,
        text,
        topics: [title, ...w.leadTopics],
        pinned: false,
      };
    })
    .filter((s): s is KnowledgeSection => s !== null);
}
```
and in `buildKnowledgeSections()` add `...buildWorkflowSections(),` after `...buildExperimentSections(),`.

`ARCHITECTURE.md`: in the file tree, change the `components/systems/` line to `AutomationEngine, AgentPipeline, NeuralCore, ProcessDiagram, StrategyWall, WorkflowDiagram, WorkflowStepList` and add `│   ├── workflows.ts            # workflow content: flowchart nodes, checks, integrations` under `data/` after `experiments.ts`.

- [ ] **Step 4: Run to verify they pass, plus the budget suite**

```bash
npx playwright test e2e/workflow.spec.ts e2e/link-suggestions.spec.ts e2e/knowledge-retrieval.spec.ts e2e/knowledge-budget.spec.ts --project=desktop
```
Expected: all pass. **If "Turbotork stays the primary reference" fails (R5), stop and ask Aditya.** Do not edit `leadTopics`.

- [ ] **Step 5: Confirm the orbital hero is unchanged, then commit**

```bash
ALLOW_PLACEHOLDERS_IN_PROD=1 npm run build
npx playwright test e2e/mobile-audit.spec.ts --project=desktop
git add app/sitemap.ts lib/search.ts lib/ai/link-suggestions.ts lib/ai/knowledge.ts ARCHITECTURE.md e2e/workflow.spec.ts e2e/link-suggestions.spec.ts e2e/knowledge-retrieval.spec.ts
git commit -m "feat(workflows): wire into sitemap, command palette, link chips and Ask the Lab"
```
Expected: the mobile-audit orbital hero still reports 11 bodies.

---

## Task 9: Audit fixes (one commit each)

### 9a. Site URL fallback

**Files:** Modify `data/site.ts`; Create `e2e/site-url.spec.ts`

- [ ] **Step 1: Confirm the variable name against Vercel's current docs** (spec §9.1 requires it). Fetch https://vercel.com/docs/environment-variables/system-environment-variables and confirm `VERCEL_PROJECT_PRODUCTION_URL` exists and has no protocol. If it differs, use the documented name everywhere below.

- [ ] **Step 2: Write the failing test**

```ts
import { test, expect } from "@playwright/test";
import { resolveSiteUrl } from "@/data/site";

test.describe("site URL resolution @site-url", () => {
  test("an explicit NEXT_PUBLIC_SITE_URL wins", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://real.example",
        VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
        VERCEL_URL: "deploy-abc.vercel.app",
      }),
    ).toBe("https://real.example");
  });

  test("the production project URL beats the per-deployment URL", () => {
    expect(
      resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app", VERCEL_URL: "deploy-abc.vercel.app" }),
    ).toBe("https://prod.vercel.app");
  });

  test("then the per-deployment URL, then localhost", () => {
    expect(resolveSiteUrl({ VERCEL_URL: "deploy-abc.vercel.app" })).toBe("https://deploy-abc.vercel.app");
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});
```

- [ ] **Step 3: Run to verify it fails:** `npx playwright test e2e/site-url.spec.ts --project=desktop`. Expected: `resolveSiteUrl` is not exported.

- [ ] **Step 4: Implement.** In `data/site.ts` replace the function and its comment tail, keeping the existing history in the comment and adding the new step:

```ts
type Env = Record<string, string | undefined>;

export const resolveSiteUrl = (env: Env = process.env): string => {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL;
  // The stable production domain, not the per-deployment host. Without this,
  // an unset NEXT_PUBLIC_SITE_URL sent canonicals, the sitemap and OG images
  // to a deployment-specific URL (spec audit finding 1, 2026-10-04).
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:3000";
};
```
Update the comment above to list the three-step chain; `url: resolveSiteUrl()` stays as is.

- [ ] **Step 5: Run to verify it passes, then commit**

```bash
npx playwright test e2e/site-url.spec.ts --project=desktop && npm run typecheck
git add data/site.ts e2e/site-url.spec.ts
git commit -m "fix(seo): prefer the production project URL over the per-deployment URL"
```
Deployment follow-ups for Aditya, not done by this plan: set `NEXT_PUBLIC_SITE_URL` in Vercel (production); after the next deploy confirm the canonical tag and `/sitemap.xml` show the real host.

### 9b. LeadIQ link

**Blocked on Aditya (spec §11 #5).** Do not guess a URL. Leave `data/projects.ts` untouched and say so in the Checkpoint C report.

### 9c. Agent Pipeline

Already done in Task 5 (component + page + test). No further commit.

### 9d. Station copy

**Files:** Modify `data/stations.ts`

- [ ] **Step 1: Check nothing asserts the old strings:** `grep -rn "animated end to end\|customer-journey" e2e app components lib three data`. Expected: only `data/stations.ts`.

- [ ] **Step 2: Edit the two descriptions to match the real nodes** (Automation Engine has six: INPUT, DATA, ENRICH, AI, DECISION, OUTPUT; Strategy Wall has six: MARKET, SEGMENTATION, ICP, POSITIONING, CHANNEL, GTM):

```ts
    description: "Input → data → enrich → AI → decision → output, animated end to end, with running workflows beside it.",
```
```ts
    description: "Market, segmentation, ICP, positioning and channel, sequenced into a launch and laid out visually.",
```

- [ ] **Step 3: Verify and commit**

```bash
npm run typecheck && npx playwright test e2e/lab-environment.spec.ts --project=desktop
git add data/stations.ts
git commit -m "fix(stations): align Automation Engine and Strategy Wall copy with the built diagrams"
```

---

## Task 10: Full verification and Checkpoint C

- [ ] **Step 1: Full gate with the draft override, then fresh screenshots**

```bash
ALLOW_PLACEHOLDERS_IN_PROD=1 npm run verify
ALLOW_PLACEHOLDERS_IN_PROD=1 npm run shot
```
Expected: every verify step green (typecheck, lint, placeholders, build, bundle, e2e). Read `.screenshots/systems*`, `systems-orbit*`, `work-turbotork*`, `experiments-ai-lead-gen*` at all four widths before reporting.

- [ ] **Step 2: Confirm the guards hold**

```bash
npm run build
```
Expected: **FAILS** at `prebuild` on `[AI_DRAFT_REVIEW]` in `data/workflows.ts`. This proves drafts cannot ship. Also check: `git grep -n ALLOW_PLACEHOLDERS_IN_PROD -- ':!docs' ':!scripts' ':!*.md'` returns nothing (the variable is not baked into the repo config), and the homepage First Load JS in `npm run check:bundle` did not grow versus the Task 0 baseline.

- [ ] **Step 3: Checkpoint C report (CLAUDE.md §6 format), then STOP.** Do not merge or deploy. Include in BLOCKED ON, from spec §11: (1) review/approve all draft copy and every node detail and remove markers, then invert or delete the "draft prose never reaches the corpus" test and run `npm run verify` with no override; (2) ORBIT status `WORKING` vs `BUILDING`; (3) planes `ai` + `product`; (4) the nine integration names; (5) the LeadIQ production URL; (6) set `NEXT_PUBLIC_SITE_URL` in Vercel; (7) a Lab Log entry in his own words; (8) optional `reflection`; plus R1 (reference PNG), R3 (caption offset), R6 (Ask the Lab sees `Status` and `subtitle` pre-approval).

---

## Self-review (spec coverage, placeholders, type consistency)

**Spec coverage:** §3.1 schema/data/queries → Task 1. §3.2 diagram + stacked list → Tasks 2–4. §3.3 Workflows section → Task 5. §3.4 `/systems/[slug]` → Task 6. §3.5 wiring → Task 8. §3.6 tests → Tasks 1, 2, 3, 5, 7, 8, 9a. §3.7 audit fixes: 1 → 9a, 2 → 9b (blocked), 3 → Task 5/9c, 4 → 9d, 5 → Task 7. §6.1 geometry and routing → Task 2 (+ enforced no-crossing test). §6.2 shapes, tags, captions, legend → Task 4. §6.3 interaction (hover/focus/tap, sticky live caption, roles, skip link, Enter/Space/Escape, no particles, reduced motion) → Task 4, tested Task 7. §6.4 list + `<details>` → Tasks 3–4. §7.1 numbering and intro copy → Tasks 1, 5. §7.2 page structure → Task 6. §7.3 wiring table → Task 8. §8 test list → Tasks 1, 7, 8 (axe at 1280 for both pages; smoke covers the default viewport). §10 checkpoints → Tasks 1, 7, 10. §11/§12 → reported, not built. The `ALLOW_PLACEHOLDERS_IN_PROD` rule → Global Constraints, Tasks 5–10.

**Placeholder scan:** none. Every code step shows code. The only non-inline sources are spec §4/§5.2, extracted mechanically by script (exact, not paraphrased).

**Type consistency:** `layoutSwimlane` / `routeSwimlaneEdge` / `SWIMLANE` / `RoutedEdge` identical in Tasks 2 and 4. `KIND_TAG`, `nodeLabel`, `stepChips`, `phaseSteps` identical in Tasks 3 and 4. `getAllWorkflows` / `getWorkflow` identical in Tasks 1, 5, 6, 8. Anchor id `wf-after-${slug}` in Task 4 matches the `#wf-after-orbit` assertion in Task 7. `CommandGroup` gains `"Systems"` in Task 8 and the test expects `"Systems"`. The `workflow-orbit` section id matches the retrieval tests.
