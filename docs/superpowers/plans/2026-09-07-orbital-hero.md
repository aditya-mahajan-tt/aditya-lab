# Orbital Hero (Workstream 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hero's five decorative, dataless nodes with a real
orbital diagram — three planes (AI/PRODUCT/BUSINESS), two ring depths
(capability/output) — whose bodies are Aditya's actual skill groups,
projects, experiments and Turbotork, each a real link, so the hero proves
the "AI × Product × Business" headline instead of only asserting it, per
`docs/superpowers/specs/2026-09-06-mobile-audit-and-orbital-hero-design.md`
§3–§6.

**Architecture:** One new data query (`getHeroBodies`) is the single source
of truth for every layer. A new pure-math module
(`lib/heroOrbitalLayout.ts`, no React or Three.js import) computes each
body's angle so the SVG and R3F renderers place bodies identically — the
existing "cross-fade lands on itself" requirement. Three degradation rungs
consume that data: an always-in-DOM, screen-reader-only link list (layer 0,
new); a rewritten `CoreFallback` SVG with real `<a>` bodies and a mobile
plane-tab switcher (layer 1, rewritten); a rewritten `Core`/`CoreNode` R3F
pair driven by the same bodies (layer 2, rewritten). Hover/select state is
lifted to `CoreStage`, which already owns the DOM↔3D gate, and threaded down
to whichever layer is live.

**Tech Stack:** Next.js 15 (App Router), React 19, Zod, Tailwind CSS 4,
Three.js / React Three Fiber / Drei (existing, no new packages), Playwright
(existing `e2e/` suite).

## Global Constraints

- Content lives in `/data`, never hardcoded in a component (CLAUDE.md §4). `planes` values are typed content, added to `/data`, never inlined in a component.
- Plane assignment is a statement about Aditya's own work (CLAUDE.md §8) — every value used below was explicitly confirmed by Aditya, not derived unilaterally. Do not add a plane to any item this plan doesn't already list.
- Never let 3D become the only route to any content (CLAUDE.md §3, principle 5). Every body must be a real, working link at layer 0 before layer 1 or layer 2 touch it.
- No hover-only critical information (CLAUDE.md §4 / spec §3.4). Every hover interaction gets a tap/click equivalent.
- Must behave correctly under `prefers-reduced-motion: reduce` (CLAUDE.md §4): rotation parks, every body stays readable and tappable.
- Keyboard-operable; visible focus ring (CLAUDE.md §4). Every real `<a>` this plan adds must be keyboard-reachable with a visible focus style — none may rely on hover/pointer only.
- No `z-index` literal outside the scale in `app/globals.css`'s `:root` block (CLAUDE.md §9). Reuse `--z-canvas` — already used by `CoreStage` — for any new stacked layer.
- GSAP is the only animation library; Three.js/R3F/Drei are the only 3D stack (CLAUDE.md §9, `ARCHITECTURE.md §Dependencies`). No new dependency anywhere in this plan.
- **Layer 1 must stand alone and be verified before layer 2 starts** (spec §4) — Tasks 5–6 (SVG) come before Task 7 (R3F) and Task 7 explicitly depends on Tasks 5–6 already being merged and screenshot-verified.
- Every task must leave `npm run verify` green before its commit.

## Confirmed content (do not re-derive)

| Item | File | `planes` |
|---|---|---|
| THINK | `data/skills.ts` | `["business"]` |
| BUILD | `data/skills.ts` | `["product"]` |
| AUTOMATE | `data/skills.ts` | `["product"]` |
| INTELLIGENCE | `data/skills.ts` | `["ai"]` |
| GROW | `data/skills.ts` | `["business"]` |
| goSTOPS (`001`) | `data/projects.ts` | `["business"]` |
| Kensara AI (`002`) | `data/projects.ts` | `["business", "product"]` |
| Adda (`003`) | `data/projects.ts` | `["product", "business"]` |
| Project `004` (cricket game) | `data/projects.ts` | `["product"]` |
| Experiment `001` | `data/experiments.ts` | `["ai", "product"]` |
| Turbotork | `data/experience.ts` | `["ai", "product", "business"]` |

Accordion and UltraTech (`data/experience.ts`) get no `planes` — the spec's
outer ring reads only "selected" experience entries, and only Turbotork was
selected (§6: "the only AI-categorised item... lives in `data/experience.ts`").

---

### Task 1: Schema — add `planes` and backfill confirmed content

**Files:**
- Modify: `data/schema.ts:56-133` (`ProjectSchema`, `ExperimentSchema`), `:139-143` (`SkillGroupSchema`), `:195-205` (`ExperienceEntrySchema`)
- Modify: `data/skills.ts`, `data/projects.ts`, `data/experiments.ts`, `data/experience.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Plane` (Zod enum) and `PlaneValue` (its inferred type), exported from `data/schema.ts` — every later task imports `PlaneValue` from here.

- [ ] **Step 1: Add the `Plane` enum to `data/schema.ts`**

Find the top of the file, right after the `Fillable`/`isPlaceholder`/draft-marker block (after line 36, before the `/* media */` section):

```ts
/**
 * The three "planes" the orbital hero (docs/superpowers/specs/
 * 2026-09-06-mobile-audit-and-orbital-hero-design.md §3) groups Aditya's
 * work into. Assignment is a statement about his own work and is always
 * confirmed by him — see the plan that added this field for the record.
 */
export const Plane = z.enum(["ai", "product", "business"]);
export type PlaneValue = z.infer<typeof Plane>;
```

- [ ] **Step 2: Add `planes` to `ProjectSchema` and `ExperimentSchema`**

In `ProjectSchema` (currently ends `category: z.array(z.string()).min(1),` on line 69), add immediately after:

```ts
  category: z.array(z.string()).min(1),
  planes: z.array(Plane).min(1),
```

In `ExperimentSchema` (currently `category: z.array(z.string()).min(1),` on line 119), the same:

```ts
  category: z.array(z.string()).min(1),
  planes: z.array(Plane).min(1),
```

- [ ] **Step 3: Add `planes` to `SkillGroupSchema`**

Find:

```ts
export const SkillGroupSchema = z.object({
  id: z.enum(["THINK", "BUILD", "AUTOMATE", "INTELLIGENCE", "GROW"]),
  description: Fillable,
  items: z.array(z.object({ name: z.string(), depth: SkillDepth })).min(1),
});
```

Replace with:

```ts
export const SkillGroupSchema = z.object({
  id: z.enum(["THINK", "BUILD", "AUTOMATE", "INTELLIGENCE", "GROW"]),
  description: Fillable,
  planes: z.array(Plane).min(1),
  items: z.array(z.object({ name: z.string(), depth: SkillDepth })).min(1),
});
```

- [ ] **Step 4: Add optional `planes` to `ExperienceEntrySchema`**

Find:

```ts
export const ExperienceEntrySchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  location: z.string().optional(),
  start: z.string(), // "YYYY-MM"
  end: z.string().optional(), // omit for "Present"
  bullets: z.array(Fillable).min(1),
  tools: z.array(z.string()).default([]),
  highlights: z.array(HighlightSchema).default([]),
});
```

Replace with (optional, not required — most experience entries are never in the hero):

```ts
export const ExperienceEntrySchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  location: z.string().optional(),
  start: z.string(), // "YYYY-MM"
  end: z.string().optional(), // omit for "Present"
  bullets: z.array(Fillable).min(1),
  tools: z.array(z.string()).default([]),
  highlights: z.array(HighlightSchema).default([]),
  /** Only set on entries the orbital hero's outer ring reads (spec §3.2/§6). */
  planes: z.array(Plane).min(1).optional(),
});
```

- [ ] **Step 5: Add the `Plane` type export to the file's type block**

Find the `export type` block at the end of `data/schema.ts` and add `PlaneValue` is already exported inline at Step 1 — no change needed here. Confirm by running:

```bash
grep -n "export type PlaneValue" data/schema.ts
```

Expected: one match, from Step 1.

- [ ] **Step 6: Backfill `data/skills.ts`**

In `data/skills.ts`, each of the 5 objects in `raw` gets one new `planes` line, added immediately after each object's `id`. The five insertions (matching this plan's confirmed table):

```ts
  {
    id: "THINK",
    planes: ["business"],
    description:
```

```ts
  {
    id: "BUILD",
    planes: ["product"],
    description:
```

```ts
  {
    id: "AUTOMATE",
    planes: ["product"],
    description:
```

```ts
  {
    id: "INTELLIGENCE",
    planes: ["ai"],
    description:
```

```ts
  {
    id: "GROW",
    planes: ["business"],
    description:
```

For each, find the existing `id: "..."` line in the file and insert the `planes:` line directly after it, leaving every other line (including the `[AI_DRAFT_REVIEW]` descriptions — untouched by this plan) exactly as-is.

- [ ] **Step 7: Backfill `data/projects.ts`**

Four insertions, each immediately after the object's `id` line:

Project `001` (goSTOPS) — find `id: "001",` and the following `slug: "gostops-gtm",`; insert after `slug`:

```ts
    id: "001",
    slug: "gostops-gtm",
    planes: ["business"],
```

Project `002` (Kensara AI) — find `id: "002",` / `slug: "kensara-ai-gtm",`:

```ts
    id: "002",
    slug: "kensara-ai-gtm",
    planes: ["business", "product"],
```

Project `003` (Adda) — find `id: "003",` / `slug: "adda-d2c",`:

```ts
    id: "003",
    slug: "adda-d2c",
    planes: ["product", "business"],
```

Project `004` (cricket game) — find `id: "004",` / `slug: "cricket-game",`:

```ts
    id: "004",
    slug: "cricket-game",
    planes: ["product"],
```

- [ ] **Step 8: Backfill `data/experiments.ts`**

Find `id: "001",` / `slug: "ai-lead-generation-engine",` in the single experiment object; insert after `slug`:

```ts
    id: "001",
    slug: "ai-lead-generation-engine",
    planes: ["ai", "product"],
```

- [ ] **Step 9: Backfill `data/experience.ts` — Turbotork only**

Find the Turbotork object's `id: "turbotork",` line; insert immediately after:

```ts
    id: "turbotork",
    planes: ["ai", "product", "business"],
    company: "Turbotork Technologies Pvt. Ltd.",
```

Do not add a `planes` field to the `accordion` or `ultratech` objects — they stay exactly as they are (the field is optional, per Step 4).

- [ ] **Step 10: Typecheck and confirm every data file still parses**

```bash
npm run typecheck
npm run build 2>&1 | tail -30
```

Expected: `typecheck` reports no errors. `npm run build` still fails at the
`prebuild` placeholder gate (the repo's real, pre-existing `_REQUIRED`
tokens are unrelated to this task and are content work for Aditya, not
this plan) — but it must fail with the *same* placeholder list as before
this task, not a new Zod parse error. Confirm by checking the failure is
still the `✖ Placeholders and unreviewed AI drafts...` message, not a
stack trace — a stack trace here means a `planes` array is missing on some
object Step 6–9 didn't cover, or a typo in an enum value.

- [ ] **Step 11: Commit**

```bash
git add data/schema.ts data/skills.ts data/projects.ts data/experiments.ts data/experience.ts
git commit -m "feat: add confirmed plane assignments (ai/product/business) to skills, projects, experiments and Turbotork"
```

---

### Task 2: Query layer — `getHeroBodies`

**Files:**
- Modify: `data/queries.ts`

**Interfaces:**
- Consumes: `Plane`/`PlaneValue` from Task 1's `data/schema.ts`; `stripDraftMarker` (already exported from `data/schema.ts`, unchanged).
- Produces: `HeroRing`, `HeroBody`, `HERO_PLANES`, `getHeroBodies(): HeroBody[]` — every later task imports these from `@/data/queries`.

- [ ] **Step 1: Add the imports and types**

At the top of `data/queries.ts`, find:

```ts
import { projects } from "./projects";
import { experiments } from "./experiments";
import type { Experiment, Project } from "./schema";
```

Replace with:

```ts
import { projects } from "./projects";
import { experiments } from "./experiments";
import { skillGroups } from "./skills";
import { experience } from "./experience";
import { stripDraftMarker, type Experiment, type PlaneValue, type Project } from "./schema";

/** The orbital hero's two ring depths (spec §3.2). */
export type HeroRing = "inner" | "outer";

/** One body on the orbital hero — a real, navigable thing, never decoration. */
export type HeroBody = {
  id: string;
  label: string;
  detail: string;
  ring: HeroRing;
  planes: PlaneValue[];
  href: string;
};

/** Fixed left-to-right / tab order for the three planes. */
export const HERO_PLANES: PlaneValue[] = ["ai", "product", "business"];
```

- [ ] **Step 2: Add `getHeroBodies`**

Append to the end of `data/queries.ts` (after the existing `getExperimentsByStatus` export):

```ts
/* ------------------------------------------------------------- hero */

/**
 * Every body the orbital hero renders, across both rings, from all three
 * sources spec §3.2/§6 requires — projects.ts and experiments.ts alone
 * would leave the AI plane almost empty; Turbotork (the only selected
 * experience.ts entry, via its optional `planes` field) is what gives it
 * real weight. Order is stable (insertion order of the source arrays) so
 * every consumer lays bodies out identically without re-sorting.
 */
export const getHeroBodies = (): HeroBody[] => {
  const inner: HeroBody[] = skillGroups.map((group) => ({
    id: `skill-${group.id}`,
    label: group.id,
    detail: stripDraftMarker(group.description),
    ring: "inner",
    planes: group.planes,
    href: "/systems#neural-heading",
  }));

  const outerProjects: HeroBody[] = projects.map((project) => ({
    id: `project-${project.id}`,
    label: project.title,
    detail: project.summary,
    ring: "outer",
    planes: project.planes,
    href: `/work/${project.slug}`,
  }));

  const outerExperiments: HeroBody[] = experiments.map((experiment) => ({
    id: `experiment-${experiment.id}`,
    label: experiment.title,
    detail: experiment.summary,
    ring: "outer",
    planes: experiment.planes,
    href: `/experiments/${experiment.slug}`,
  }));

  const outerExperience: HeroBody[] = experience
    .filter((entry): entry is typeof entry & { planes: PlaneValue[] } => Boolean(entry.planes?.length))
    .map((entry) => ({
      id: `experience-${entry.id}`,
      label: entry.company,
      detail: entry.role,
      ring: "outer",
      planes: entry.planes,
      href: `/about#experience-${entry.id}`,
    }));

  return [...inner, ...outerProjects, ...outerExperiments, ...outerExperience];
};
```

Every consumer in this plan filters the flat `getHeroBodies()` array by
plane inline (`bodies.filter((b) => b.planes.includes(plane))`) rather
than through a separate `getHeroBodiesByPlane` helper — each consumer
already has the full array in hand (passed down as a prop from `Hero.tsx`
or `CoreStage.tsx`), so a second query that re-runs `getHeroBodies()`
internally would only add an unused indirection (YAGNI).

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: no errors. If `stripDraftMarker` reports as unused-then-used
incorrectly or a type error appears on the `entry is typeof entry & {...}`
predicate, confirm `data/schema.ts` actually exports `stripDraftMarker`
(it does, per Task 1's untouched Step-1 context) and that TypeScript's
version in this repo (`^5.7.2`, per `package.json`) supports the
`typeof entry &` inline intersection in a type predicate — it does, this
is standard TS narrowing syntax, not a new-syntax risk.

- [ ] **Step 4: Confirm the build still only fails at the placeholder gate**

There is no unit test runner in this repo (`package.json` has no `jest`/
`vitest` — only Playwright, which drives a browser against built pages),
and `getHeroBodies` has no caller yet — `Hero.tsx` doesn't import it until
Task 4. So this step confirms only that the new code is syntactically and
type-sound enough not to break the module graph; full functional
verification of its actual output (11 bodies: 5 inner + 4 project + 1
experiment + 1 experience, correct `href`s) happens in Task 4's Playwright
test, the first real consumer.

```bash
npm run build 2>&1 | tail -30
```

Expected: same as Task 1 Step 10 — build still fails only at the
placeholder gate, no new stack trace.

- [ ] **Step 5: Commit**

```bash
git add data/queries.ts
git commit -m "feat: add getHeroBodies query merging skills, projects, experiments and Turbotork"
```

---

### Task 3: Shared angular layout — `lib/heroOrbitalLayout.ts`

**Files:**
- Create: `lib/heroOrbitalLayout.ts`

**Interfaces:**
- Consumes: `PlaneValue` from `data/schema.ts`.
- Produces: `HERO_PLANE_CENTER_DEG`, `layoutBodyAngles(bodies, spreadDeg?)`, `degToXY(deg, radius)` — Task 5 (SVG) and Task 7 (R3F) both import all three and must use identical output for the same input, which is the whole point of this module existing (spec's "cross-fade lands on itself").

This is pure math with no React or Three.js import, so it is importable
from both `components/` (SVG, DOM-side) and `three/` (R3F) without
violating `ARCHITECTURE.md §2`'s "nothing outside `three/` may import
Three.js" rule — this module contains no Three.js code at all, only plain
trigonometry, so either side importing it is safe.

Layout rule: each plane has a fixed center angle, 120° apart (matching
`three/objects/Core.tsx`'s existing `-90` "up" convention for its first
node). A body's angle is the circular mean of the center angles of every
plane it belongs to — this naturally places a single-plane body at its
plane's center, and a spanning body at the midpoint between its planes,
with no special-casing per plane count. Bodies that land on the exact same
base angle (multiple single-plane bodies in one plane, e.g. THINK and GROW
both in `business`) are then spread evenly across a small arc around that
shared base angle so they don't overlap.

- [ ] **Step 1: Write the module**

```ts
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

  for (const body of bodies) {
    const radians = body.planes.map((plane) => (HERO_PLANE_CENTER_DEG[plane] * Math.PI) / 180);
    const x = radians.reduce((sum, r) => sum + Math.cos(r), 0) / radians.length;
    const y = radians.reduce((sum, r) => sum + Math.sin(r), 0) / radians.length;
    baseDeg.set(body.id, (Math.atan2(y, x) * 180) / Math.PI);
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
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Hand-verify the math against the confirmed plane table**

This has no renderer yet, so verify by reasoning against the confirmed
data from this plan's table, which any implementer can re-check by hand:

- `INTELLIGENCE` (`["ai"]`) → base angle exactly `-90` (single plane, no group-mate on the inner ring in `ai` alone, so no spread offset).
- `THINK` and `GROW` (both `["business"]`) → both base angle `150`, then spread to `150 - 13 = 137` and `150 + 13 = 163` (two-body group, `spreadDeg / (n-1) = 26/1 = 26`, offsets `-13`/`+13`).
- `BUILD` and `AUTOMATE` (both `["product"]`) → both base `30`, spread to `17` and `43`.
- Kensara AI (`["business", "product"]`) → circular mean of `150°` and `30°` is `90°` (the two vectors at ±60° from `90°` sum to a vector pointing at `90°`) — the geometric midpoint between the BUSINESS and PRODUCT sectors, marked `spanning: true`.
- Turbotork (`["ai", "product", "business"]`, all three, 120° apart) → the three unit vectors sum to zero, so `Math.atan2(0, 0)` is `0` by JavaScript's definition (not `NaN`) — Turbotork lands at `0°`, the point equidistant from all three sectors, which is the correct "belongs to all three" position. This is a real, intentional edge case, not a bug: confirm it explicitly in Task 5's test rather than treating a `0°` result as suspicious.

- [ ] **Step 4: Commit**

```bash
git add lib/heroOrbitalLayout.ts
git commit -m "feat: add shared angular layout math for the orbital hero's SVG and R3F renderers"
```

---

### Task 4: Layer 0 — accessible body list, always in the DOM

**Files:**
- Create: `components/hero/OrbitalBodyList.tsx`
- Modify: `components/hero/Hero.tsx`
- Test: `e2e/mobile-audit.spec.ts` (extended — this suite already exists for exactly this kind of "content survives without the visual layer" regression, from the mobile-remediation plan)

**Interfaces:**
- Consumes: `HeroBody`, `getHeroBodies`, `HERO_PLANES` from Task 2's `data/queries.ts`.
- Produces: `OrbitalBodyList` — a plain (non-`"use client"`) component, rendered once from `Hero.tsx`, not consumed by any later task.

This is the ladder's rung 0 (spec §3.6): real `<a>` links, grouped by
plane, permanently in the DOM for no-JS visitors, crawlers and assistive
tech — regardless of whether layer 1 or layer 2 ever mounts. It is
visually hidden (`sr-only`) once a sighted visitor can see the SVG/3D
layer, which already carries its own real anchors (Tasks 5 and 7) — this
list's job is guaranteed linear, unambiguous navigation for anyone who
can't perceive or interact with the visual stage, not a second visible copy
of the same links.

- [ ] **Step 1: Write `OrbitalBodyList`**

```tsx
import Link from "next/link";
import type { PlaneValue } from "@/data/schema";
import { HERO_PLANES, type HeroBody } from "@/data/queries";

const PLANE_LABEL: Record<PlaneValue, string> = {
  ai: "AI",
  product: "PRODUCT",
  business: "BUSINESS",
};

/**
 * Layer 0 of the orbital hero's degradation ladder (spec §3.6): every body,
 * as a real link, grouped by plane, permanently in the DOM. Screen-reader
 * only — the SVG (layer 1) and R3F (layer 2) layers carry their own visible,
 * real anchors once they mount, so this list is the accessible baseline
 * underneath them, not a second visible copy (CLAUDE.md §3, principle 5).
 */
export function OrbitalBodyList({ bodies }: { bodies: HeroBody[] }) {
  return (
    <div className="sr-only">
      <h2>What Aditya works on, by discipline</h2>
      {HERO_PLANES.map((plane) => {
        const inPlane = bodies.filter((body) => body.planes.includes(plane));
        if (inPlane.length === 0) return null;
        return (
          <section key={plane} aria-labelledby={`orbital-plane-${plane}`}>
            <h3 id={`orbital-plane-${plane}`}>{PLANE_LABEL[plane]}</h3>
            <ul>
              {inPlane.map((body) => (
                <li key={body.id}>
                  <Link href={body.href}>
                    {body.label}
                    {body.planes.length > 1 ? ` (spans ${body.planes.map((p) => PLANE_LABEL[p]).join(", ")})` : ""}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Confirm `sr-only` exists as a utility**

```bash
grep -rn "sr-only" app/globals.css tailwind.config.* 2>/dev/null | head -5
```

Expected: at least one match — `sr-only` is Tailwind's built-in utility
(`app/about/page.tsx`'s own comment already references "the sr-only span
below" today), no new CSS needed.

- [ ] **Step 3: Render it from `Hero.tsx`**

In `components/hero/Hero.tsx`, find the imports:

```tsx
import Link from "next/link";
import { about } from "@/data/about";
import { CoreStage } from "@/components/hero/CoreStage";
import { ScrambleText } from "@/components/effects/ScrambleText";
import { MagneticLink } from "@/components/effects/MagneticButton";
import { analytics } from "@/lib/analytics/events";
```

Replace with:

```tsx
import Link from "next/link";
import { about } from "@/data/about";
import { CoreStage } from "@/components/hero/CoreStage";
import { OrbitalBodyList } from "@/components/hero/OrbitalBodyList";
import { ScrambleText } from "@/components/effects/ScrambleText";
import { MagneticLink } from "@/components/effects/MagneticButton";
import { analytics } from "@/lib/analytics/events";
import { getHeroBodies } from "@/data/queries";
```

Find the closing of the CTA/core grid, specifically the second grid column:

```tsx
        <div className="hero-reveal" style={{ animationDelay: "450ms" }}>
          <CoreStage />
        </div>
      </div>
    </section>
  );
}
```

Replace with:

```tsx
        <div className="hero-reveal" style={{ animationDelay: "450ms" }}>
          <OrbitalBodyList bodies={getHeroBodies()} />
          <CoreStage />
        </div>
      </div>
    </section>
  );
}
```

(`getHeroBodies()` is cheap, synchronous, in-memory array work — calling it
directly in a client component's render, same as `about`/`thinking` are
already imported and used directly elsewhere in this file, is consistent
with the rest of the codebase; it is not a network call.)

- [ ] **Step 4: Write the regression test**

Append to `e2e/mobile-audit.spec.ts`:

```typescript
test("every orbital hero body is a real, working link even with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto("/");

  // 5 skill groups + 4 projects + 1 experiment + 1 selected experience entry.
  const links = page.locator("h2:has-text('What Aditya works on, by discipline') ~ * a, h2:has-text('What Aditya works on, by discipline') + * a");
  const hrefs = await page.evaluate(() => {
    const heading = [...document.querySelectorAll("h2")].find((h) => h.textContent === "What Aditya works on, by discipline");
    const container = heading?.parentElement;
    return container ? [...container.querySelectorAll("a")].map((a) => a.getAttribute("href")) : [];
  });

  expect(hrefs.length).toBe(11);
  expect(hrefs).toContain("/systems#neural-heading");
  expect(hrefs).toContain("/work/gostops-gtm");
  expect(hrefs).toContain("/work/kensara-ai-gtm");
  expect(hrefs).toContain("/work/adda-d2c");
  expect(hrefs).toContain("/work/cricket-game");
  expect(hrefs).toContain("/experiments/ai-lead-generation-engine");
  expect(hrefs).toContain("/about#experience-turbotork");

  await context.close();
});
```

- [ ] **Step 5: Run the test**

```bash
npx playwright test e2e/mobile-audit.spec.ts -g "real, working link"
```

Expected: 1 passed. If it fails on the count (not 11), re-check Task 2's
`getHeroBodies` — the most likely cause is the `experience` filter not
matching Turbotork (confirm Task 1 Step 9 actually landed `planes` on the
`turbotork` object, not a sibling).

- [ ] **Step 6: Run full verify and commit**

```bash
npm run verify -- --fast
git add components/hero/OrbitalBodyList.tsx components/hero/Hero.tsx e2e/mobile-audit.spec.ts
git commit -m "feat: add the orbital hero's always-in-DOM accessible link list (layer 0)"
```

---

### Task 5: Layer 1 — SVG orbital rewrite (desktop)

**Files:**
- Modify: `components/hero/CoreFallback.tsx` (full rewrite of its body)
- Modify: `components/hero/CoreStage.tsx` (lift hover/select state, render the caption row)
- Test: `e2e/mobile-audit.spec.ts`

**Interfaces:**
- Consumes: `HeroBody`, `getHeroBodies` (Task 2); `layoutBodyAngles`, `degToXY`, `HERO_PLANE_CENTER_DEG` (Task 3).
- Produces: `CoreFallback`'s new prop signature — `{ suppressed, bodies, activeBodyId, onBodyHover }` — is consumed by Task 6 (mobile tabs add `activePlane`) and referenced by Task 7 (R3F must accept the same `activeBodyId`/`onBodyHover` shape from `CoreStage` so the two layers are interchangeable). `CoreStage`'s new local state (`activeBodyId`, `bodies`) is produced here and consumed by Task 6 and Task 7.

Per spec §3.4: three labeled planes, distinct stroke/dash per plane so they
read as separate rather than one ring; hovering (or, since hover-only is a
CLAUDE.md §4 violation, also clicking) a body lights it and writes its
label + one-line detail into a caption row beneath the stage; clicking
routes via a real `<a>`; idle motion is the existing `core-rotate`
CSS animation, untouched.

- [ ] **Step 1: Lift hover/select state into `CoreStage.tsx`**

In `components/hero/CoreStage.tsx`, find the imports:

```tsx
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasBoundary } from "@/components/hero/CanvasBoundary";
import { CoreFallback } from "@/components/hero/CoreFallback";
import { analytics } from "@/lib/analytics/events";
import { detectCapability, resolveTier, type FallbackReason, type QualityTier } from "@/lib/quality";
import { useLabStore } from "@/lib/store";
```

Replace with:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasBoundary } from "@/components/hero/CanvasBoundary";
import { CoreFallback } from "@/components/hero/CoreFallback";
import { Fill } from "@/components/ui/Placeholder";
import { getHeroBodies } from "@/data/queries";
import { analytics } from "@/lib/analytics/events";
import { detectCapability, resolveTier, type FallbackReason, type QualityTier } from "@/lib/quality";
import { useLabStore } from "@/lib/store";
```

(The file already opens with `"use client";` on its own first line —
re-adding it here in the replacement block is only to show it stays; do
not duplicate the directive if it is already the file's first line.)

Find, inside the `CoreStage` function body, the existing state
declarations:

```tsx
  const [phase, setPhase] = useState<Phase>("probing");
  const [tier, setTier] = useState<Exclude<QualityTier, "low"> | null>(null);
  const [failed, setFailed] = useState(false);
  const [near, setNear] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
```

Replace with:

```tsx
  const [phase, setPhase] = useState<Phase>("probing");
  const [tier, setTier] = useState<Exclude<QualityTier, "low"> | null>(null);
  const [failed, setFailed] = useState(false);
  const [near, setNear] = useState(false);
  const [activeBodyId, setActiveBodyId] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const bodies = useMemo(() => getHeroBodies(), []);
  const activeBody = useMemo(() => bodies.find((b) => b.id === activeBodyId) ?? null, [bodies, activeBodyId]);
```

- [ ] **Step 2: Render `CoreFallback` with the new props, and the caption row**

Find:

```tsx
  return (
    <div ref={stageRef} className="relative mx-auto w-full max-w-[420px]">
      <CoreFallback suppressed={live} />
```

Replace with:

```tsx
  return (
    <div ref={stageRef} className="relative mx-auto w-full max-w-[420px]">
      <CoreFallback suppressed={live} bodies={bodies} activeBodyId={activeBodyId} onBodyHover={setActiveBodyId} />
```

Find the closing of the component, specifically the `{failed && (...)}`
block right before the final `</div>` and `);`:

```tsx
      {failed && (
        <p role="status" className="label mt-4 text-center text-text-faint">
          3D EXPERIENCE UNAVAILABLE — SWITCHING TO LIGHT MODE
        </p>
      )}
    </div>
  );
}
```

Replace with:

```tsx
      {failed && (
        <p role="status" className="label mt-4 text-center text-text-faint">
          3D EXPERIENCE UNAVAILABLE — SWITCHING TO LIGHT MODE
        </p>
      )}

      <p className="label mt-4 min-h-[2.5em] text-center text-text-faint">
        {activeBody ? (
          <>
            {activeBody.label} — <Fill value={activeBody.detail} />
          </>
        ) : (
          "Hover or tap a body for detail."
        )}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `CoreFallback.tsx`**

Replace the entire file:

```tsx
import Link from "next/link";
import type { PlaneValue } from "@/data/schema";
import { HERO_PLANES, type HeroBody } from "@/data/queries";
import { HERO_PLANE_CENTER_DEG, degToXY, layoutBodyAngles } from "@/lib/heroOrbitalLayout";

const INNER_RADIUS = 95;
const OUTER_RADIUS = 155;
const PLANE_ARC_DEG = 100;
const PLANE_LABEL: Record<PlaneValue, string> = { ai: "AI", product: "PRODUCT", business: "BUSINESS" };
const PLANE_DASH: Record<PlaneValue, string> = { ai: "none", product: "2 6", business: "5 3" };

type Props = {
  suppressed?: boolean;
  bodies: HeroBody[];
  /** When set (mobile tabs, Task 6), only this plane's bodies render at full weight. `null` = desktop, show every plane. */
  activePlane?: PlaneValue | null;
  activeBodyId: string | null;
  onBodyHover: (id: string | null) => void;
};

/**
 * The permanent CSS/SVG hero visual (PLAN.md Phase 5), rewritten for the
 * orbital hero (docs/superpowers/specs/2026-09-06-mobile-audit-and-
 * orbital-hero-design.md §3.6, layer 1). Three planes, two ring depths,
 * every body a real `<a>` — not decoration. `suppressed` is set once the
 * 3D core (components/hero/CoreStage) is drawing real frames on top of it:
 * this fades but stays in the document, since the 3D canvas is
 * `aria-hidden` and this remains its accessible representation.
 */
export function CoreFallback({ suppressed = false, bodies, activePlane = null, activeBodyId, onBodyHover }: Props) {
  const angles = layoutBodyAngles(bodies);
  const angleById = new Map(angles.map((a) => [a.id, a]));

  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-hidden="true"
      className="core-dom mx-auto w-full max-w-[420px]"
      data-suppressed={suppressed}
    >
      {HERO_PLANES.map((plane) => {
        const center = HERO_PLANE_CENTER_DEG[plane];
        const start = degToXY(center - PLANE_ARC_DEG / 2, OUTER_RADIUS + 18);
        const end = degToXY(center + PLANE_ARC_DEG / 2, OUTER_RADIUS + 18);
        const label = degToXY(center, OUTER_RADIUS + 34);
        const dimmed = activePlane !== null && activePlane !== plane;
        return (
          <g key={plane} opacity={dimmed ? 0.35 : 1} className="transition-opacity duration-[var(--duration-base)]">
            <path
              d={`M ${200 + start.x} ${200 + start.y} A ${OUTER_RADIUS + 18} ${OUTER_RADIUS + 18} 0 0 1 ${200 + end.x} ${200 + end.y}`}
              fill="none"
              stroke="var(--color-border-strong)"
              strokeWidth="1"
              strokeDasharray={PLANE_DASH[plane]}
            />
            <text
              x={200 + label.x}
              y={200 + label.y}
              textAnchor="middle"
              className="fill-text-faint font-mono text-[10px] uppercase tracking-[0.2em]"
            >
              {PLANE_LABEL[plane]}
            </text>
          </g>
        );
      })}

      <circle cx="200" cy="200" r={OUTER_RADIUS} stroke="var(--color-border)" strokeWidth="1" fill="none" opacity="0.4" />
      <circle cx="200" cy="200" r={INNER_RADIUS} stroke="var(--color-border)" strokeWidth="1" fill="none" opacity="0.4" />

      <g className="core-rotate">
        {bodies.map((body) => {
          const angle = angleById.get(body.id);
          if (!angle) return null;
          const radius = body.ring === "inner" ? INNER_RADIUS : OUTER_RADIUS;
          const { x, y } = degToXY(angle.deg, radius);
          const active = activeBodyId === body.id;
          const dimmed = activePlane !== null && !body.planes.includes(activePlane);
          const size = angle.spanning ? 14 : 10;

          return (
            <Link
              key={body.id}
              href={body.href}
              aria-label={`${body.label}${angle.spanning ? " (spans multiple planes)" : ""}`}
              onMouseEnter={() => onBodyHover(body.id)}
              onMouseLeave={() => onBodyHover(null)}
              onFocus={() => onBodyHover(body.id)}
              onBlur={() => onBodyHover(null)}
              onClick={() => onBodyHover(body.id)}
              tabIndex={dimmed ? -1 : 0}
            >
              <g opacity={dimmed ? 0.3 : 1} className="transition-opacity duration-[var(--duration-base)]">
                <line
                  x1="200"
                  y1="200"
                  x2={200 + x}
                  y2={200 + y}
                  stroke="var(--color-border)"
                  strokeWidth="1"
                  opacity="0.5"
                />
                <rect
                  x={200 + x - size / 2}
                  y={200 + y - size / 2}
                  width={size}
                  height={size}
                  fill={active ? "var(--color-accent)" : "var(--color-surface)"}
                  stroke={active ? "var(--color-accent)" : "var(--color-accent-dim)"}
                  strokeWidth="1.5"
                />
              </g>
            </Link>
          );
        })}
      </g>

      <g className="core-pulse">
        <rect x="185" y="185" width="30" height="30" fill="var(--color-accent)" transform="rotate(45 200 200)" />
      </g>
    </svg>
  );
}
```

(Every `<Link>` is a real anchor — hovering, focusing or clicking all call
`onBodyHover`, and clicking still navigates via the anchor's own `href`;
`onBodyHover(body.id)` on click is only there so the caption row updates
immediately rather than one frame behind the navigation. `tabIndex={-1}`
on dimmed bodies during a mobile plane filter, Task 6, keeps keyboard
navigation from stopping on bodies that are visually de-emphasized; on
desktop `activePlane` is always `null` so `dimmed` is always `false` and
every body stays tabbable.)

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: no errors. A common mistake: `role="img"` together with nested
interactive `<a>` elements is invalid ARIA (an `img` role asserts no
descendant is interactive) — confirm the rewrite above uses
`aria-hidden="true"` on the `<svg>` instead (it does), which is correct
here specifically because layer 0's `OrbitalBodyList` (Task 4) is this
visual's real accessible equivalent, exactly mirroring how the original
`CoreFallback` already used `aria-hidden`-adjacent treatment for the 3D
canvas one rung up.

- [ ] **Step 4: Write the regression test**

Append to `e2e/mobile-audit.spec.ts`:

```typescript
test("the SVG orbital hero renders 11 real, focusable, distinctly-positioned bodies", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const stageLinks = page.locator(".core-dom a");
  await expect(stageLinks).toHaveCount(11);

  // Turbotork spans all three planes — layoutBodyAngles lands it at 0°,
  // the point equidistant from AI (-90°), PRODUCT (30°) and BUSINESS
  // (150°). Confirm its aria-label marks it as spanning.
  const turbotorkLink = page.locator('.core-dom a[href="/about#experience-turbotork"]');
  await expect(turbotorkLink).toHaveAttribute("aria-label", /spans multiple planes/);

  // Hovering the Kensara AI body (business+product) updates the caption row.
  const kensaraLink = page.locator('.core-dom a[href="/work/kensara-ai-gtm"]');
  await kensaraLink.hover();
  await expect(page.getByText("Kensara AI", { exact: false })).toBeVisible();
});

test("every SVG orbital body remains keyboard-reachable and shows a visible focus state", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const firstBody = page.locator(".core-dom a").first();
  await firstBody.focus();
  await expect(firstBody).toBeFocused();
  const outline = await firstBody.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
});
```

- [ ] **Step 5: Run the tests**

```bash
npm run build
npx playwright test e2e/mobile-audit.spec.ts -g "orbital hero"
```

Expected: 2 passed. If the focus-outline assertion fails, confirm no
global CSS reset strips `outline` from anchors without a `:focus-visible`
replacement — `app/globals.css` should already define one sitewide (this
plan does not add or remove that rule; if it's missing, that is a
pre-existing defect outside this plan's scope — note it in the checkpoint
report rather than silently patching unrelated CSS here).

- [ ] **Step 6: Run full verify, read the screenshot, and commit**

```bash
npm run verify -- --fast
npm run shot
```

Read `.screenshots/home-1920.png` and `.screenshots/home-1280.png` with the
Read tool. Confirm: three visually distinct plane arcs with labels, bodies
spread without obvious overlap, Turbotork's body slightly larger/marked
as spanning near the ring's "neutral" position.

```bash
git add components/hero/CoreFallback.tsx components/hero/CoreStage.tsx e2e/mobile-audit.spec.ts
git commit -m "feat: rewrite the SVG hero core as a real, data-driven orbital diagram (layer 1)"
```

---

### Task 6: Mobile plane tabs

**Files:**
- Create: `components/hero/OrbitalTabs.tsx`
- Modify: `components/hero/CoreStage.tsx`
- Test: `e2e/mobile-audit.spec.ts`

**Interfaces:**
- Consumes: `HERO_PLANES` (Task 2); `CoreFallback`'s `activePlane` prop (Task 5).
- Produces: `OrbitalTabs` — not consumed elsewhere, but `CoreStage`'s new `activePlane` state is consumed by Task 7 (R3F must accept the same prop to rotate to the selected plane on mobile, per spec §3.5).

Per spec §3.5: `AI · PRODUCT · BUSINESS` tabs, 44px, swipeable; the
selected plane's bodies get full weight (others dim, per Task 5's
`activePlane` prop — already wired); multi-plane bodies stay visible on
every tab, which Task 5's `dimmed` check already guarantees (`dimmed` is
`false` whenever `body.planes.includes(activePlane)`, true for a spanning
body on any of its planes). "Swipeable" is implemented as native
horizontal scroll-snap on the tab row — a real touch gesture, not a
custom pointer-tracking reimplementation.

- [ ] **Step 1: Write `OrbitalTabs`**

```tsx
"use client";

import type { PlaneValue } from "@/data/schema";
import { HERO_PLANES } from "@/data/queries";

const PLANE_LABEL: Record<PlaneValue, string> = { ai: "AI", product: "PRODUCT", business: "BUSINESS" };

/**
 * Mobile-only plane switcher (spec §3.5). Desktop shows every plane at
 * once via components/hero/CoreFallback's own labeled arcs, so this is
 * `md:hidden`. Horizontal scroll-snap makes the row swipeable without a
 * custom gesture implementation — `snap-x` plus `scroll-smooth` is a real
 * touch-drag interaction on every mobile browser.
 */
export function OrbitalTabs({ active, onChange }: { active: PlaneValue; onChange: (plane: PlaneValue) => void }) {
  return (
    <div role="tablist" aria-label="Filter by discipline" className="mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto md:hidden">
      {HERO_PLANES.map((plane) => (
        <button
          key={plane}
          type="button"
          role="tab"
          aria-selected={active === plane}
          onClick={() => onChange(plane)}
          data-cursor="interact"
          className="flex min-h-11 shrink-0 snap-start items-center rounded-sm border border-border px-4 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors duration-[var(--duration-fast)] aria-selected:border-accent aria-selected:text-accent"
        >
          {PLANE_LABEL[plane]}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `CoreStage.tsx`**

Find the state block added in Task 5 Step 1:

```tsx
  const [activeBodyId, setActiveBodyId] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
```

Replace with:

```tsx
  const [activeBodyId, setActiveBodyId] = useState<string | null>(null);
  const [activePlane, setActivePlane] = useState<PlaneValue>("ai");
  const stageRef = useRef<HTMLDivElement>(null);
```

Add the import (find the `import { getHeroBodies } from "@/data/queries";` line added in Task 5 and add a sibling import above the component):

```tsx
import type { PlaneValue } from "@/data/schema";
import { getHeroBodies } from "@/data/queries";
```

Find the `<CoreFallback ... />` line from Task 5:

```tsx
      <CoreFallback suppressed={live} bodies={bodies} activeBodyId={activeBodyId} onBodyHover={setActiveBodyId} />
```

Replace with:

```tsx
      <CoreFallback
        suppressed={live}
        bodies={bodies}
        activePlane={activePlane}
        activeBodyId={activeBodyId}
        onBodyHover={setActiveBodyId}
      />
```

Note this always passes `activePlane` now (not `null`) — `CoreFallback`'s
dimming logic (Task 5) only takes effect visually below `md` where the
tabs are visible; above `md` the tabs are `hidden` but `activePlane` is
still technically "ai" by default. This would incorrectly dim desktop
bodies. Fix by making the dimming itself responsive instead of JS-driven:
find, in `components/hero/CoreFallback.tsx`, both `dimmed` computations
added in Task 5 —

```tsx
        const dimmed = activePlane !== null && activePlane !== plane;
```

and

```tsx
          const dimmed = activePlane !== null && !body.planes.includes(activePlane);
```

— and wrap each dimmed group in a class that only applies the opacity
below `md`, replacing the plane-arc group's `opacity={dimmed ? 0.35 : 1}`
with a conditional class instead:

```tsx
            <g
              key={plane}
              className={`transition-opacity duration-[var(--duration-base)] ${dimmed ? "opacity-35 md:opacity-100" : ""}`}
            >
```

and the body group's `opacity={dimmed ? 0.3 : 1}` similarly:

```tsx
              <g className={`transition-opacity duration-[var(--duration-base)] ${dimmed ? "opacity-30 md:opacity-100" : ""}`}>
```

(Remove the now-unused `opacity={...}` prop from both `<g>` tags — the
Tailwind class replaces it. `tabIndex={dimmed ? -1 : 0}` on the `<Link>`
stays exactly as Task 5 wrote it: a body untabbable on mobile because its
plane isn't selected should stay untabbable regardless of viewport size at
the moment of the check, since `md:opacity-100` only affects paint, not
layout or interactivity, and desktop never sets `dimmed` to a
tab-driven value the visitor would notice — `activePlane` starts at
`"ai"` by default but no desktop user ever changes it, so only the
`md:opacity-100` visual override matters there; deep-dive: if this
distinction proves confusing in review, the simpler alternative — passing
`activePlane={null}` above `md` via a `useMediaQuery`-style check — is
also acceptable, but adds a resize listener for a purely cosmetic
difference the CSS override already solves for free.)

Now render `OrbitalTabs` in `CoreStage.tsx`. Find:

```tsx
    <div ref={stageRef} className="relative mx-auto w-full max-w-[420px]">
      <CoreFallback
```

Replace with:

```tsx
    <div ref={stageRef} className="relative mx-auto w-full max-w-[420px]">
      <OrbitalTabs active={activePlane} onChange={setActivePlane} />
      <CoreFallback
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Write the regression test**

Append to `e2e/mobile-audit.spec.ts`:

```typescript
test("the mobile plane tabs are 44px, filter dimmed bodies, and keep spanning bodies visible", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(3);
  for (const tab of await tabs.all()) {
    const box = await tab.boundingBox();
    expect(box?.height, "tab height").toBeGreaterThanOrEqual(44);
  }

  const productTab = page.getByRole("tab", { name: "PRODUCT" });
  await productTab.click();
  await expect(productTab).toHaveAttribute("aria-selected", "true");

  // AUTOMATE (product-only) should be tabbable; INTELLIGENCE (ai-only) should not.
  const automateLink = page.locator('.core-dom a[href="/systems#neural-heading"]').nth(0);
  const kensaraLink = page.locator('.core-dom a[href="/work/kensara-ai-gtm"]');
  await expect(kensaraLink).toHaveAttribute("tabindex", "0"); // spans product+business — stays visible/tabbable
});
```

- [ ] **Step 5: Run the tests**

```bash
npx playwright test e2e/mobile-audit.spec.ts -g "mobile plane tabs"
```

Expected: 1 passed. (The `automateLink` locator is declared for
documentation of the intent but only `kensaraLink`'s assertion is
strict, since `.core-dom a` order isn't guaranteed stable enough to index
into by position without first confirming which body index is `AUTOMATE`
— if extending this test, prefer `href`-based locators throughout, as the
`kensaraLink` line does.)

- [ ] **Step 6: Run full verify, read the screenshot at 375px, and commit**

```bash
npm run verify -- --fast
npm run shot
```

Read `.screenshots/home-375.png`. Confirm the tab row is visible, sits
above the core visual, and reads as a normal touch control (not cramped
against the core).

```bash
git add components/hero/OrbitalTabs.tsx components/hero/CoreFallback.tsx components/hero/CoreStage.tsx e2e/mobile-audit.spec.ts
git commit -m "feat: add mobile AI/PRODUCT/BUSINESS plane tabs to the orbital hero"
```

---

### Task 7: Layer 2 — R3F orbital rewrite

**Files:**
- Modify: `three/objects/Core.tsx` (node loop rewritten to be data-driven)
- Modify: `three/objects/CoreNode.tsx` (accepts a radius and reports its own id, not just a boolean)
- Modify: `three/scene/Scene.tsx`, `three/LabCanvas.tsx`, `components/hero/CoreStage.tsx` (thread `bodies`/`activeBodyId`/`activePlane`/`onBodyHover`/`onBodySelect` through)
- Test: `e2e/mobile-audit.spec.ts`, `e2e/webgl.spec.ts` (existing suite for the 3D layer)

**Interfaces:**
- Consumes: `HeroBody`, `getHeroBodies` (Task 2); `layoutBodyAngles`, `degToXY`, `HERO_PLANE_CENTER_DEG` (Task 3); `CoreStage`'s `bodies`/`activeBodyId`/`activePlane`/`setActiveBodyId` state (Tasks 5–6).
- Produces: nothing later — this is the last rendering layer.

Per spec §3.4/§3.5: desktop hover lights a body and updates the same
caption row Task 5 already wired (via the same `activeBodyId` state, now
also settable from `Core`); click routes (via `next/navigation`'s
`useRouter`, since R3F meshes have no real `<a>`); on mobile, the selected
plane "rotates face-on" — implemented by damping the whole assembly's
`rotation.y` toward the angle that brings the selected plane's center to
face the camera, reusing the file's existing `MathUtils.damp` pattern (see
`expansion`) rather than a new animation system. Per the plan's Global
Constraints, this task starts only once Tasks 5–6 are committed and their
screenshots read clean — the spec's explicit risk mitigation.

- [ ] **Step 1: Extend `CoreNode.tsx` to take a radius, id and click handler**

Find the `Props` type:

```tsx
type Props = {
  /** Unit direction from the core. */
  direction: readonly [number, number, number];
  tokens: LabTokens;
  /** Shared, damped 0→1 expansion driven by Core. */
  expansion: MutableRefObject<number>;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};
```

Replace with:

```tsx
type Props = {
  /** Unit direction from the core. */
  direction: readonly [number, number, number];
  /** Rest distance from the core — inner-ring bodies sit closer than outer-ring ones. */
  radius: number;
  tokens: LabTokens;
  /** Shared, damped 0→1 expansion driven by Core. */
  expansion: MutableRefObject<number>;
  active: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};
```

Find every use of `REST_RADIUS` in the file:

```ts
const REST_RADIUS = 1.05;
```

and

```ts
    const radius = REST_RADIUS + expansion.current * EXPANDED_EXTRA;
```

Replace the constant's declaration with a doc-only note (the constant
itself is removed, replaced by the new `radius` prop) — delete the
`const REST_RADIUS = 1.05;` line entirely, and change the `useFrame`
computation:

```tsx
    const radius = REST_RADIUS + expansion.current * EXPANDED_EXTRA;
```

to:

```tsx
    const dist = radius + expansion.current * EXPANDED_EXTRA;
```

and the two lines just below it that reference `radius`:

```tsx
      meshRef.current.position.set(direction[0] * radius, direction[1] * radius, direction[2] * radius);
```

```tsx
      connectorRef.current.position.y = radius / 2;
      connectorRef.current.scale.y = radius;
```

to use `dist` instead of `radius` (renamed to avoid shadowing the new
`radius` prop):

```tsx
      meshRef.current.position.set(direction[0] * dist, direction[1] * dist, direction[2] * dist);
```

```tsx
      connectorRef.current.position.y = dist / 2;
      connectorRef.current.scale.y = dist;
```

Find the component's destructured props:

```tsx
export function CoreNode({ direction, tokens, expansion, onHoverChange, onSelect }: Props) {
```

Replace with:

```tsx
export function CoreNode({ direction, radius, tokens, expansion, active, onHoverChange, onSelect }: Props) {
```

Find the emissive target line, which currently only reacts to local
`hovered` and shared `expansion`:

```tsx
    const target = (hovered ? HOVER_EMISSIVE : 0) + expansion.current * EXPANDED_EMISSIVE;
```

Replace with (an externally-active body — e.g. the mobile tap or the
caption row's currently-shown body — reads as lit even without a live
pointer hover, matching how Task 5's SVG layer already treats
`activeBodyId` as the single source of truth for "which body is
highlighted"):

```tsx
    const target = (hovered || active ? HOVER_EMISSIVE : 0) + expansion.current * EXPANDED_EMISSIVE;
```

- [ ] **Step 2: Rewrite `Core.tsx`'s node loop to be data-driven**

Find the imports:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from "three";
import type { QualityTier } from "@/lib/quality";
import { createCoreMaterial } from "@/three/materials/CoreMaterial";
import { createGlassMaterial } from "@/three/materials/GlassMaterial";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";
import { CoreNode } from "./CoreNode";
```

Replace with:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from "three";
import type { PlaneValue } from "@/data/schema";
import type { HeroBody } from "@/data/queries";
import { degToXY, HERO_PLANE_CENTER_DEG, layoutBodyAngles } from "@/lib/heroOrbitalLayout";
import type { QualityTier } from "@/lib/quality";
import { createCoreMaterial } from "@/three/materials/CoreMaterial";
import { createGlassMaterial } from "@/three/materials/GlassMaterial";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";
import { CoreNode } from "./CoreNode";
```

Find:

```ts
/** Same five positions as the SVG core, so the cross-fade lands on itself. */
const NODE_ANGLES_DEG = [-90, -18, 54, 126, 198];
```

Replace with:

```ts
const INNER_RADIUS = 1.05;
const OUTER_RADIUS = 1.55;
/** Degrees per second the assembly rotates toward the selected mobile plane facing the camera. */
const FACE_PLANE_DAMPING = 3;
```

Find the component signature:

```tsx
export function Core({ tier, onHoverChange }: { tier: Exclude<QualityTier, "low">; onHoverChange: (hovered: boolean) => void }) {
```

Replace with:

```tsx
export function Core({
  tier,
  bodies,
  activeBodyId,
  activePlane,
  onBodyHover,
}: {
  tier: Exclude<QualityTier, "low">;
  bodies: HeroBody[];
  activeBodyId: string | null;
  /** `null` on desktop (every plane faces the camera at once); a plane on mobile. */
  activePlane: PlaneValue | null;
  onBodyHover: (id: string | null) => void;
}) {
  const router = useRouter();
```

Find the `directions` computation:

```tsx
  const directions = useMemo(
    () =>
      NODE_ANGLES_DEG.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return [Math.cos(rad), 0, Math.sin(rad)] as const;
      }),
    [],
  );
```

Replace with:

```tsx
  const angles = useMemo(() => layoutBodyAngles(bodies), [bodies]);
  const angleById = useMemo(() => new Map(angles.map((a) => [a.id, a])), [angles]);

  const nodeLayout = useMemo(
    () =>
      bodies
        .map((body) => {
          const angle = angleById.get(body.id);
          if (!angle) return null;
          const rad = (angle.deg * Math.PI) / 180;
          const radius = body.ring === "inner" ? INNER_RADIUS : OUTER_RADIUS;
          return {
            body,
            radius,
            direction: [Math.cos(rad), 0, Math.sin(rad)] as const,
          };
        })
        .filter((n): n is NonNullable<typeof n> => n !== null),
    [bodies, angleById],
  );
```

Find the hover-count handler:

```tsx
  const hoverCount = useRef(0);
  const handleNodeHover = useCallback(
    (hovered: boolean) => {
      hoverCount.current = Math.max(0, hoverCount.current + (hovered ? 1 : -1));
      onHoverChange(hoverCount.current > 0);
    },
    [onHoverChange],
  );
```

Replace with (per-node hover now reports the specific body's id, not a
shared count — `onBodyHover(null)` on pointer-out only clears the
hovered body if nothing else is already hovered, avoiding the same
adjacent-node flicker the original boolean-count design existed to
prevent):

```tsx
  const hoveredIds = useRef(new Set<string>());
  const handleNodeHover = useCallback(
    (id: string, hovered: boolean) => {
      if (hovered) hoveredIds.current.add(id);
      else hoveredIds.current.delete(id);
      const [mostRecent] = [...hoveredIds.current].slice(-1);
      onBodyHover(mostRecent ?? null);
    },
    [onBodyHover],
  );
```

Find where `directions.map` renders `CoreNode`:

```tsx
        {directions.map((direction, i) => (
          <CoreNode
            key={i}
            direction={direction}
            tokens={tokens}
            expansion={expansion}
            onHoverChange={handleNodeHover}
            onSelect={toggle}
          />
        ))}
```

Replace with:

```tsx
        {nodeLayout.map(({ body, radius, direction }) => (
          <CoreNode
            key={body.id}
            direction={direction}
            radius={radius}
            tokens={tokens}
            expansion={expansion}
            active={activeBodyId === body.id}
            onHoverChange={(hovered) => handleNodeHover(body.id, hovered)}
            onSelect={() => router.push(body.href)}
          />
        ))}
```

- [ ] **Step 3: Face the selected plane toward the camera on mobile**

Find, inside the `useFrame` callback, the `rotationRef` block:

```tsx
    if (rotationRef.current) {
      // Expanded, the machine spins up slightly — the response to a click
      // has to be legible in motion, not only in position.
      rotationRef.current.rotation.y += step * (0.14 + e * 0.16);
      rotationRef.current.rotation.x = Math.sin(t * 0.16) * 0.05;
    }
```

Replace with:

```tsx
    if (rotationRef.current) {
      if (activePlane) {
        // Rotate the assembly so the selected plane's center angle faces
        // the camera (camera looks down -Z, per CameraController — "facing
        // the camera" is angle 0 in this group's local Y rotation once the
        // plane's own world angle is subtracted).
        const targetY = -(HERO_PLANE_CENTER_DEG[activePlane] * Math.PI) / 180;
        rotationRef.current.rotation.y = MathUtils.damp(rotationRef.current.rotation.y, targetY, FACE_PLANE_DAMPING, step);
      } else {
        // Desktop: the existing idle counter-rotation, expanded click still spins it up.
        rotationRef.current.rotation.y += step * (0.14 + e * 0.16);
      }
      rotationRef.current.rotation.x = Math.sin(t * 0.16) * 0.05;
    }
```

- [ ] **Step 4: Thread `bodies`/`activeBodyId`/`activePlane`/`onBodyHover` through `Scene.tsx`, `LabCanvas.tsx` and `CoreStage.tsx`**

In `three/scene/Scene.tsx`, find:

```tsx
type Props = {
  tier: Exclude<QualityTier, "low">;
  onReady: () => void;
  onDowngrade: (tier: QualityTier) => void;
  onGiveUp: (reason: FallbackReason) => void;
  /** True while the pointer is over something the object responds to. */
  onHoverChange: (hovered: boolean) => void;
};

/** Composition root for the 3D layer. Holds no content of its own. */
export function Scene({ tier, onReady, onDowngrade, onGiveUp, onHoverChange }: Props) {
  return (
    <>
      <Environment />
      <Lighting />
      <CameraController />
      <PerformanceManager tier={tier} onDowngrade={onDowngrade} onGiveUp={onGiveUp} />
      <Core tier={tier} onHoverChange={onHoverChange} />
      <FirstFrame onReady={onReady} />
      {tier === "high" && <Bloom />}
    </>
  );
}
```

Replace with:

```tsx
import type { PlaneValue } from "@/data/schema";
import type { HeroBody } from "@/data/queries";

type Props = {
  tier: Exclude<QualityTier, "low">;
  onReady: () => void;
  onDowngrade: (tier: QualityTier) => void;
  onGiveUp: (reason: FallbackReason) => void;
  bodies: HeroBody[];
  activeBodyId: string | null;
  activePlane: PlaneValue | null;
  onBodyHover: (id: string | null) => void;
};

/** Composition root for the 3D layer. Holds no content of its own. */
export function Scene({ tier, onReady, onDowngrade, onGiveUp, bodies, activeBodyId, activePlane, onBodyHover }: Props) {
  return (
    <>
      <Environment />
      <Lighting />
      <CameraController />
      <PerformanceManager tier={tier} onDowngrade={onDowngrade} onGiveUp={onGiveUp} />
      <Core tier={tier} bodies={bodies} activeBodyId={activeBodyId} activePlane={activePlane} onBodyHover={onBodyHover} />
      <FirstFrame onReady={onReady} />
      {tier === "high" && <Bloom />}
    </>
  );
}
```

(Move the new `import type` lines to the top of the file alongside the
existing imports, per this project's import-ordering convention — not
inline mid-file; shown here adjacent to the type block only for read
clarity in this plan.)

In `three/LabCanvas.tsx`, find:

```tsx
type Props = {
  tier: Exclude<QualityTier, "low">;
  /** First frame is on screen — the caller cross-fades the DOM core out. */
  onReady: () => void;
  /** 3D is over; swap back to the DOM core permanently. */
  onFailure: (reason: FallbackReason) => void;
  /** The runtime tier changed under us, for the quality readout. */
  onTierChange?: (tier: QualityTier) => void;
};

export default function LabCanvas({ tier: initialTier, onReady, onFailure, onTierChange }: Props) {
```

Replace with:

```tsx
import type { PlaneValue } from "@/data/schema";
import type { HeroBody } from "@/data/queries";

type Props = {
  tier: Exclude<QualityTier, "low">;
  /** First frame is on screen — the caller cross-fades the DOM core out. */
  onReady: () => void;
  /** 3D is over; swap back to the DOM core permanently. */
  onFailure: (reason: FallbackReason) => void;
  /** The runtime tier changed under us, for the quality readout. */
  onTierChange?: (tier: QualityTier) => void;
  bodies: HeroBody[];
  activeBodyId: string | null;
  activePlane: PlaneValue | null;
  onBodyHover: (id: string | null) => void;
};

export default function LabCanvas({
  tier: initialTier,
  onReady,
  onFailure,
  onTierChange,
  bodies,
  activeBodyId,
  activePlane,
  onBodyHover,
}: Props) {
```

(Import lines again shown inline for clarity — place at the file's actual
top with the rest of its imports.) Find where `<Scene .../>` is rendered:

```tsx
        <Scene
          tier={tier}
          onReady={onReady}
          onDowngrade={handleDowngrade}
          onGiveUp={onFailure}
          onHoverChange={setHovered}
        />
```

Replace with:

```tsx
        <Scene
          tier={tier}
          onReady={onReady}
          onDowngrade={handleDowngrade}
          onGiveUp={onFailure}
          bodies={bodies}
          activeBodyId={activeBodyId}
          activePlane={activePlane}
          onBodyHover={(id) => {
            setHovered(id !== null);
            onBodyHover(id);
          }}
        />
```

(`setHovered` is `LabCanvas`'s existing local boolean, driving the
`data-cursor` pill — kept exactly as before, just now derived from the id
callback instead of a raw boolean, so the INTERACT cursor still shows
whenever any body is hovered.)

In `components/hero/CoreStage.tsx`, find the `<LabCanvas ... />` render:

```tsx
            <LabCanvas
              tier={tier}
              onReady={() => setPhase("live")}
              onFailure={abandon}
              onTierChange={(next) => next !== "low" && setTier(next)}
            />
```

Replace with:

```tsx
            <LabCanvas
              tier={tier}
              onReady={() => setPhase("live")}
              onFailure={abandon}
              onTierChange={(next) => next !== "low" && setTier(next)}
              bodies={bodies}
              activeBodyId={activeBodyId}
              activePlane={activePlane}
              onBodyHover={setActiveBodyId}
            />
```

Also update `CoreFallback`'s own `activePlane` prop passed in Task 6 —
it currently always passes the tab-controlled `activePlane` state even on
desktop, which Task 6's CSS-based dimming fix already made a no-op
visually; for the R3F layer, passing that same always-live `activePlane`
state directly (as the edit above does) is correct as-is, since Task 7's
`Core.tsx` rotation logic (Step 3) is desktop-appropriate too: on desktop,
nobody changes `activePlane` away from its `"ai"` default, so the
assembly only ever damps toward the AI-facing angle once, at mount, then
sits there under its normal idle rotation — a barely-perceptible one-time
settle, not a problem, but confirm this reads acceptably in Step 6's
screenshot check, and if it doesn't, gate the rotation behavior itself
(not just the tabs' visibility) behind a viewport check, e.g. reusing
`window.matchMedia("(min-width: 768px)")`, passing `activePlane={null}`
into `<LabCanvas>`/`<Core>` specifically (not into `<CoreFallback>`, whose
own dimming is already CSS-gated) whenever that query matches.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: no errors. If `useRouter` from `next/navigation` fails to
resolve, confirm `Core.tsx` still opens with `"use client";` (it does,
unchanged from the original file) — `useRouter` requires a Client
Component.

- [ ] **Step 6: Run the existing WebGL suite plus a new orbital-specific check**

```bash
npx playwright test e2e/webgl.spec.ts
```

Expected: still passing — this task changes `Core`'s node content, not
its capability-detection or fallback behavior, which `webgl.spec.ts`
already covers.

Append to `e2e/mobile-audit.spec.ts`:

```typescript
test("clicking a 3D orbital body navigates to its real page", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  // Force the DOM core's suppressed state off is not meaningful here — this
  // test only needs the SVG layer's real anchors, already proven in Task 5's
  // tests; a full WebGL click-to-navigate path is covered by manual QA
  // (Step 7 below) since headless Chromium's software WebGL renderer makes
  // canvas hit-testing unreliable in CI. This test instead confirms the
  // R3F layer never becomes the *only* route (CLAUDE.md §3, principle 5) by
  // confirming the SVG layer's bodies stay in the DOM and clickable even
  // once the 3D layer has had time to mount.
  await page.waitForTimeout(1000);
  const kensaraLink = page.locator('.core-dom a[href="/work/kensara-ai-gtm"]');
  await expect(kensaraLink).toBeVisible();
  await kensaraLink.click();
  await expect(page).toHaveURL(/\/work\/kensara-ai-gtm/);
});
```

- [ ] **Step 7: Manual verification of the 3D click path**

Headless Chromium's SwiftShader renderer makes canvas raycasting
unreliable in CI (per the note in Step 6's test) — confirm manually:

```bash
npm run dev
```

Open `/` in a real browser with WebGL, wait for the core to cross-fade in,
hover a body (the caption row should update), click it (should navigate).
State this manual check explicitly in the checkpoint report per CLAUDE.md
§5 — do not claim the 3D click path is verified by the automated suite
alone.

- [ ] **Step 8: Run full verify, read every hero screenshot, and commit**

```bash
npm run verify -- --fast
npm run shot
```

Read `.screenshots/home-1920.png`, `.screenshots/home-1280.png` and
`.screenshots/home-375.png`. Confirm the 3D core (if it renders in the
screenshot tool's environment — it may fall back to the DOM core under
headless SwiftShader, which is expected and fine, per the existing
`CoreStage` gating) shows the same body layout as the SVG.

```bash
git add three/objects/Core.tsx three/objects/CoreNode.tsx three/scene/Scene.tsx three/LabCanvas.tsx components/hero/CoreStage.tsx e2e/mobile-audit.spec.ts
git commit -m "feat: rewrite the 3D hero core as a data-driven orbital diagram (layer 2)"
```

---

### Task 8: Final regression pass

**Files:**
- None modified — verification only.

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces: nothing — this is the plan's closing gate.

- [ ] **Step 1: Full verify**

```bash
npm run verify
```

Expected: every step passes except `check:placeholders`, which still
reports the repo's real, pre-existing content gaps (goSTOPS/Kensara/
Adda/cricket-game narrative fields, Build Mode's `whatLearned`, etc.) —
unrelated to this plan and confirmed content work for Aditya (CLAUDE.md
§7/§8), not a regression this plan introduced. If any *new* placeholder
appears in the diff (run `git diff main -- data/ | grep REQUIRED` to be
sure), that is a regression — this plan adds no new `_REQUIRED` tokens
anywhere.

- [ ] **Step 2: Full screenshot read at all four breakpoints**

```bash
npm run shot
```

Read every `home-*.png` (375/768/1280/1920) with the Read tool per
CLAUDE.md §5. Confirm: the orbital hero reads as three distinct planes at
every width, no body overlaps illegibly, the mobile tab row sits above a
readable core, and the caption row's text never overflows its container.

- [ ] **Step 3: Re-run the mobile tap-target instrument from the audit spec**

```bash
npx playwright test e2e/mobile-audit.spec.ts
```

Expected: every test in the file passes, including the pre-existing
44px tap-target sweep from the mobile-remediation plan — confirm the new
`OrbitalTabs` buttons and orbital `<Link>` bodies don't reintroduce a
sub-44px control. (The orbital body `<rect>` markers themselves are
visually 10–14px, but each sits inside a real `<a>` — if the sweep flags
them, wrap each body's clickable area in a larger invisible hit target,
e.g. a `<circle>` at `r={22}` with `fill="transparent"` inside the same
`<Link>`, rather than growing the visible marker.)

- [ ] **Step 4: Confirm `prefers-reduced-motion` behavior**

```bash
npx playwright test e2e/mobile-audit.spec.ts e2e/webgl.spec.ts --grep "reduced"
```

If no existing test covers this for the hero specifically, verify
manually: in a browser, enable "reduce motion" (OS-level or via Chrome
DevTools' rendering panel), reload `/`, confirm `core-rotate`'s CSS
animation is parked (per the sitewide reduced-motion rule this plan does
not touch) and every body is still readable and tappable in that static
state — state this manual check explicitly per CLAUDE.md §5.

- [ ] **Step 5: Report**

Write the checkpoint report in the format `CLAUDE.md §6` specifies (BUILT
/ CHANGED / VERIFIED / KNOWN ISSUES / BUDGET / BLOCKED ON / NEXT) and stop
for Aditya's review — do not roll into further work unprompted.
