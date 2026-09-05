# About Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/about`'s text-heavy static sections with an interactive 3D identity map, a merged education+work timeline, and icon/visual-weight capability cards — per `docs/superpowers/specs/2026-09-05-about-page-redesign-design.md`.

**Architecture:** A new 3D object (`ProgressionCore`) echoes the hero Core's visual grammar but makes each of its 6 nodes individually selectable, reusing the hero's quality-gating machinery (`lib/quality`, `CanvasBoundary`, materials, `Environment`/`Lighting`/`PerformanceManager`) wholesale. Its permanent DOM companion (`ProgressionFallback`) is six native `<details>` elements — not a decorative lookalike like `CoreFallback`, but the actual accessible control surface, always fully functional whether or not 3D ever loads. A new `Timeline` component merges `data/education.ts` (new) and `data/experience.ts` by date. Capability cards get 5 hand-drawn group icons and drop their printed depth labels for visual weight.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict, Tailwind, Zod, Three.js / React Three Fiber (existing dynamic-import chunk), Playwright.

## Global Constraints

- No icon library — inline SVG only, 1.5px stroke, 24px grid, `currentColor` (`DESIGN_SYSTEM.md` §9).
- Every piece of information must be reachable with JavaScript off and WebGL absent (`CLAUDE.md` §3, principle 5). The 3D canvas is always `aria-hidden="true"` and holds no unique content.
- Content lives in `/data`, Zod-validated at module load — bad content fails the build, not the browser.
- Never invent personal facts. `data/education.ts`'s structural fields (institution, program, dates) come directly from `Aditya_Mahajan_OnePager.pdf` and are written without a draft marker, matching `data/experience.ts`'s existing treatment of its own structural fields.
- Motion tokens only (`--duration-*`, `--ease-out-lab`) — no ad-hoc durations.
- `npm run verify` (typecheck, lint, placeholders, build, bundle budget, e2e) must stay green after every task; `npm run shot` reviewed before the plan is considered done.
- Branch: `feature/about-redesign` (already created, based on current `main`). Commit at every green task.

---

## File Structure

```
data/schema.ts                                MODIFY  — add EducationEntrySchema + type
data/education.ts                             CREATE  — 2 entries, from the resume PDF
components/icons/TimelineIcons.tsx            CREATE  — WORK / EDUCATION icons
components/icons/CapabilityIcons.tsx          CREATE  — THINK/BUILD/AUTOMATE/INTELLIGENCE/GROW icons
components/about/Timeline.tsx                 CREATE  — merged education+work list
components/about/ProgressionFallback.tsx      CREATE  — the 6-stage <details> control surface
three/objects/ProgressionNode.tsx             CREATE  — one selectable 3D node
three/objects/ProgressionCore.tsx             CREATE  — the 3D object (6 nodes + housing)
three/systems/ProgressionCameraController.tsx CREATE  — pointer-parallax only, no scroll dolly
three/scene/ProgressionScene.tsx              CREATE  — composition root
three/ProgressionCanvas.tsx                   CREATE  — dynamic-import entry point
components/about/ProgressionStage.tsx         CREATE  — client orchestrator (gating + state)
app/about/page.tsx                            MODIFY  — final integration, full rewrite
scripts/check-bundle.mjs                      MODIFY  — extend 3D-isolation check to /about
e2e/about-progression.spec.ts                 CREATE  — WebGL-off / no-JS / HIGH-tier coverage
```

---

### Task 1: Education data — schema and content

**Files:**
- Modify: `data/schema.ts` (insert after `ExperienceEntrySchema`, ~line 192)
- Create: `data/education.ts`

**Interfaces:**
- Produces: `EducationEntrySchema` (Zod schema), `EducationEntry` (inferred type), `education: EducationEntry[]` (exported array) — consumed by Task 5 (`Timeline.tsx`).

- [ ] **Step 1: Add the schema**

In `data/schema.ts`, immediately after the `/* ------------------------------------------------------------ experience */` block (after `ExperienceEntrySchema`, before `/* ----------------------------------------------------------------- site */`), insert:

```ts
/* ------------------------------------------------------------ education */

export const EducationEntrySchema = z.object({
  id: z.string(),
  institution: z.string(),
  program: z.string(),
  location: z.string().optional(),
  start: z.string(), // "YYYY" — the resume gives year-only precision for education
  end: z.string().optional(), // omit for "Present"
  note: z.string().optional(), // e.g. a scholarship
});
```

Then in the `/* ---------------------------------------------------------------- types */` block at the bottom of the file, add:

```ts
export type EducationEntry = z.infer<typeof EducationEntrySchema>;
```

- [ ] **Step 2: Run typecheck to confirm the schema compiles**

Run: `npm run typecheck`
Expected: no errors (nothing consumes `EducationEntrySchema` yet, so this only confirms the Zod chain is valid TypeScript).

- [ ] **Step 3: Create the data file**

Create `data/education.ts`:

```ts
import { z } from "zod";
import { EducationEntrySchema } from "./schema";

/**
 * From Aditya_Mahajan_OnePager.pdf (supplied 2026-09-05). Structural facts —
 * institution, program, dates — written directly, no draft marker, same
 * treatment data/experience.ts already gives its own company/role/dates
 * fields. School-level entries (CBSE X/XII) are excluded per Aditya's
 * decision: higher ed + work only, matching how the resume itself is
 * weighted for a recruiter audience.
 */
const raw = [
  {
    id: "masters-union",
    institution: "Masters' Union",
    program: "Post Graduate Programme in Technology & Business Management (PGP TBM)",
    location: "Gurugram",
    start: "2026",
    note: "25% scholarship — Pankaj Bansal Scholarship for Young Leaders",
  },
  {
    id: "bits-pilani",
    institution: "Birla Institute of Technology & Science, Pilani",
    program: "B.E. Chemical Engineering",
    location: "Goa",
    start: "2018",
    end: "2022",
  },
];

export const education = z.array(EducationEntrySchema).parse(raw);
```

- [ ] **Step 4: Verify the data parses**

Run: `npm run typecheck && npm run build`
Expected: both succeed. A failure here means the `raw` array doesn't match `EducationEntrySchema` — read the Zod error, it names the exact field.

- [ ] **Step 5: Commit**

```bash
git add data/schema.ts data/education.ts
git commit -m "Add EducationEntrySchema and real education data from the resume"
```

---

### Task 2: Timeline icons

**Files:**
- Create: `components/icons/TimelineIcons.tsx`

**Interfaces:**
- Produces: `timelineIcons: { WORK: ComponentType<SVGProps<SVGSVGElement>>, EDUCATION: ComponentType<SVGProps<SVGSVGElement>> }` — consumed by Task 5 (`Timeline.tsx`).

- [ ] **Step 1: Write the icon file**

Create `components/icons/TimelineIcons.tsx`:

```tsx
import type { SVGProps } from "react";

/** DESIGN_SYSTEM.md §9 — inline SVG, 1.5px stroke, 24px grid, currentColor. No icon library. */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function WorkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x={3} y={7.5} width={18} height={12} rx={1.5} />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <path d="M3 13h18" />
    </svg>
  );
}

function EducationIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4 2 8.5 12 13l10-4.5Z" />
      <path d="M6 10.8v4.7c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.7" />
      <path d="M21 8.5v6" />
    </svg>
  );
}

export const timelineIcons = { WORK: WorkIcon, EDUCATION: EducationIcon } as const;
```

- [ ] **Step 2: Verify it compiles and lints**

Run: `npm run typecheck && npm run lint`
Expected: both pass (the file isn't imported anywhere yet, this just confirms valid TSX).

- [ ] **Step 3: Commit**

```bash
git add components/icons/TimelineIcons.tsx
git commit -m "Add WORK/EDUCATION timeline icons"
```

---

### Task 3: Capability icons

**Files:**
- Create: `components/icons/CapabilityIcons.tsx`

**Interfaces:**
- Produces: `capabilityIcons: Record<"THINK"|"BUILD"|"AUTOMATE"|"INTELLIGENCE"|"GROW", ComponentType<SVGProps<SVGSVGElement>>>` — consumed by Task 8 (`app/about/page.tsx`).

- [ ] **Step 1: Write the icon file**

Create `components/icons/CapabilityIcons.tsx`:

```tsx
import type { SVGProps } from "react";

/** DESIGN_SYSTEM.md §9 — inline SVG, 1.5px stroke, 24px grid, currentColor. No icon library. */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function ThinkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx={12} cy={12} r={8} />
      <circle cx={12} cy={12} r={3} />
      <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
    </svg>
  );
}

function BuildIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 6.5a3.5 3.5 0 0 0-4.6 4.6l-6.4 6.4a1.5 1.5 0 0 0 2.1 2.1l6.4-6.4a3.5 3.5 0 0 0 4.6-4.6l-2.6 2.6-2-2Z" />
    </svg>
  );
}

function AutomateIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12a8 8 0 0 1 13.3-6M20 12a8 8 0 0 1-13.3 6" />
      <path d="M17.3 6v-3.2M17.3 6h-3.2M6.7 18v3.2M6.7 18h3.2" />
    </svg>
  );
}

function IntelligenceIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
    </svg>
  );
}

function GrowIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 18 10 12l3.5 3.5L21 8" />
      <path d="M15.5 8H21v5.5" />
    </svg>
  );
}

export const capabilityIcons = {
  THINK: ThinkIcon,
  BUILD: BuildIcon,
  AUTOMATE: AutomateIcon,
  INTELLIGENCE: IntelligenceIcon,
  GROW: GrowIcon,
} as const;
```

- [ ] **Step 2: Verify it compiles and lints**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add components/icons/CapabilityIcons.tsx
git commit -m "Add THINK/BUILD/AUTOMATE/INTELLIGENCE/GROW capability icons"
```

---

### Task 4: Extend the bundle check to `/about`

`check-bundle.mjs` currently only asserts Three.js is absent from the homepage's initial bundle. Task 7 puts a second Three.js consumer on `/about`, so this gap has to close before that lands, not after.

**Files:**
- Modify: `scripts/check-bundle.mjs`

- [ ] **Step 1: Widen the initial-chunk set**

In `scripts/check-bundle.mjs`, find:

```js
const initial = [...new Set(manifest.pages?.["/page"] ?? [])].filter((f) => f.endsWith(".js"));
```

Replace with:

```js
const initial = [
  ...new Set([...(manifest.pages?.["/page"] ?? []), ...(manifest.pages?.["/about/page"] ?? [])]),
].filter((f) => f.endsWith(".js"));
```

- [ ] **Step 2: Update the messages to name both routes**

Find:

```js
if (initial.length === 0) {
  console.error("✖ Could not resolve the homepage chunk set from the build manifest.");
  process.exit(1);
}
```

Leave as-is (message still accurate — it names "the homepage chunk set" but the array now also covers `/about`; not worth a wording change here since this branch only fires when the manifest is missing entirely).

Find:

```js
    console.error(`✖ Three.js found in an initial chunk: ${rel}`);
```

Replace with:

```js
    console.error(`✖ Three.js found in an initial chunk (/ or /about): ${rel}`);
```

Find:

```js
if (!threeInInitial) console.log("✔ 3D isolation — Three.js is not in the homepage's initial bundle");
```

Replace with:

```js
if (!threeInInitial) console.log("✔ 3D isolation — Three.js is not in the initial bundle of / or /about");
```

- [ ] **Step 3: Verify against the current build (before Task 7 lands, this should still pass trivially)**

Run: `npm run build && node scripts/check-bundle.mjs`
Expected: `✔ 3D isolation — Three.js is not in the initial bundle of / or /about` (and every other check unchanged) — `/about` has no 3D yet at this point in the plan, so this only proves the manifest lookup doesn't error on a route with no matching chunks.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-bundle.mjs
git commit -m "Extend the 3D-isolation bundle check to cover /about"
```

---

### Task 5: Timeline component

**Files:**
- Create: `components/about/Timeline.tsx`

**Interfaces:**
- Consumes: `education` from `data/education.ts` (Task 1), `experience` from `data/experience.ts` (existing), `timelineIcons` from `components/icons/TimelineIcons.tsx` (Task 2), `Fill` from `components/ui/Placeholder.tsx` (existing).
- Produces: `Timeline` — a zero-prop Server Component, consumed by Task 8 (`app/about/page.tsx`).

- [ ] **Step 1: Write the component**

Create `components/about/Timeline.tsx`:

```tsx
import { education } from "@/data/education";
import { experience } from "@/data/experience";
import { timelineIcons } from "@/components/icons/TimelineIcons";
import { Fill } from "@/components/ui/Placeholder";

/** "2018" -> "2018-01"; "2025-07" is untouched — a comparable sort key regardless of precision. */
function sortKey(date: string): string {
  return /^\d{4}$/.test(date) ? `${date}-01` : date;
}

/** "2025-07" -> "JUL 2025"; "2018" -> "2018" (year-only stays year-only). */
function formatDate(value: string): string {
  if (/^\d{4}$/.test(value)) return value;
  const [y, m] = value.split("-");
  const month = new Date(Number(y), Number(m) - 1).toLocaleString("en-US", { month: "short" });
  return `${month.toUpperCase()} ${y}`;
}

/** No end date reads as "PRESENT". */
function formatRange(start: string, end?: string): string {
  return `${formatDate(start)} — ${end ? formatDate(end) : "PRESENT"}`;
}

type Entry = {
  kind: "work" | "education";
  id: string;
  title: string;
  subtitle: string;
  location?: string;
  start: string;
  end?: string;
  bullets: string[];
  note?: string;
};

function buildEntries(): Entry[] {
  const work: Entry[] = experience.map((job) => ({
    kind: "work",
    id: job.id,
    title: job.company,
    subtitle: job.role,
    location: job.location,
    start: job.start,
    end: job.end,
    bullets: job.bullets,
  }));

  const school: Entry[] = education.map((entry) => ({
    kind: "education",
    id: entry.id,
    title: entry.institution,
    subtitle: entry.program,
    location: entry.location,
    start: entry.start,
    end: entry.end,
    bullets: [],
    note: entry.note,
  }));

  return [...work, ...school].sort((a, b) => sortKey(b.start).localeCompare(sortKey(a.start)));
}

/**
 * Design spec §3.4 — education + work merged into one reverse-chronological
 * list. A plain Server Component: expand/collapse is a native <details>, so
 * it needs zero client JavaScript.
 */
export function Timeline() {
  const entries = buildEntries();

  return (
    <ol className="divide-y divide-border border-y border-border">
      {entries.map((entry) => {
        const Icon = timelineIcons[entry.kind === "work" ? "WORK" : "EDUCATION"];
        return (
          <li key={entry.id}>
            <details className="group">
              <summary className="flex min-h-11 cursor-pointer list-none flex-col gap-2 py-6 marker:hidden md:flex-row md:items-baseline md:justify-between md:gap-10 [&::-webkit-details-marker]:hidden">
                <span className="flex items-baseline gap-4">
                  <Icon className="h-5 w-5 shrink-0 text-accent" />
                  <span>
                    <span className="block font-mono text-sm uppercase tracking-widest text-text">
                      {entry.title}
                    </span>
                    <span className="mt-1 block text-text-muted">{entry.subtitle}</span>
                  </span>
                </span>
                <span className="label shrink-0">
                  {formatRange(entry.start, entry.end)}
                  {entry.location ? ` · ${entry.location}` : ""}
                </span>
              </summary>

              {entry.kind === "work" ? (
                <ul className="prose-lab mt-2 space-y-3 pb-6 pl-9 text-text-muted">
                  {entry.bullets.map((bullet, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="text-accent">—</span>
                      <Fill value={bullet} />
                    </li>
                  ))}
                </ul>
              ) : entry.note ? (
                <p className="prose-lab mt-2 pb-6 pl-9 text-text-muted">{entry.note}</p>
              ) : null}
            </details>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck && npm run lint`
Expected: both pass (unused-import/unreferenced-component warnings would appear here if `Timeline` isn't exported correctly — it's not wired into a page yet, which is fine, ESLint only flags unused *local* variables, not unused exports).

- [ ] **Step 3: Commit**

```bash
git add components/about/Timeline.tsx
git commit -m "Add the merged education+work Timeline component"
```

---

### Task 6: `ProgressionFallback` — the accessible control surface

This is the most important accessibility decision in the plan, so it's worth stating precisely: unlike `components/hero/CoreFallback` (which is purely decorative once the 3D core is live, because `Core`'s nodes carry no information), `ProgressionFallback` stays the **real** interactive surface for the whole page's life — the 3D canvas is a visual companion above it, never a replacement. It therefore never fades, dims, or gets `aria-hidden`.

**Files:**
- Create: `components/about/ProgressionFallback.tsx`

**Interfaces:**
- Consumes: `about.progression` from `data/about.ts` (existing, unchanged), `Fill` from `components/ui/Placeholder.tsx`.
- Produces: `ProgressionFallback({ activeStage: number | null, onToggle: (index: number, open: boolean) => void })` — consumed by Task 10 (`ProgressionStage.tsx`).

- [ ] **Step 1: Write the component**

Create `components/about/ProgressionFallback.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { about } from "@/data/about";
import { Fill } from "@/components/ui/Placeholder";

/**
 * The permanent DOM representation of the identity progression (design spec
 * §3.2). Six native <details> elements, closed by default — every stage's
 * text is reachable with JavaScript entirely off, and closed-by-default is
 * also what fixes the "wall of text" complaint the whole feature exists to
 * address.
 *
 * This is not a decorative lookalike the way components/hero/CoreFallback
 * is (Core's nodes carry no information, so CoreFallback can safely go
 * inert once 3D loads). This component IS the accessible control surface,
 * for the page's whole life: a 3D node click opens the matching <details>
 * programmatically via `activeStage`; a real click on a <summary> fires the
 * native `toggle` event, reported back up via `onToggle` so 3D and DOM stay
 * in sync through one piece of state.
 */
export function ProgressionFallback({
  activeStage,
  onToggle,
}: {
  activeStage: number | null;
  onToggle: (index: number, open: boolean) => void;
}) {
  const refs = useRef<Array<HTMLDetailsElement | null>>([]);

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (el && el.open !== (activeStage === i)) el.open = activeStage === i;
    });
  }, [activeStage]);

  return (
    <ol className="divide-y divide-border border-y border-border">
      {about.progression.map((step, i) => (
        <li key={step.label}>
          <details
            ref={(el) => {
              refs.current[i] = el;
            }}
            onToggle={(e) => onToggle(i, e.currentTarget.open)}
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-baseline gap-4 py-6 marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="label">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-mono text-sm uppercase tracking-widest text-text">{step.label}</h3>
            </summary>
            <div className="prose-lab pb-6 pl-9 text-text-muted">
              <Fill value={step.body} as="p" />
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add components/about/ProgressionFallback.tsx
git commit -m "Add ProgressionFallback — the always-functional identity-map control surface"
```

---

### Task 7: `ProgressionNode` and `ProgressionCore` — the 3D object

**Files:**
- Create: `three/objects/ProgressionNode.tsx`
- Create: `three/objects/ProgressionCore.tsx`

**Interfaces:**
- Consumes: `createMetalMaterial`/`createGlassMaterial`/`createCoreMaterial` from `three/materials/*` (existing, unchanged), `readTokens`/`LabTokens` from `three/materials/tokens.ts` (existing), `QualityTier` from `lib/quality.ts` (existing).
- Produces: `ProgressionCore({ tier: Exclude<QualityTier,"low">, activeStage: number|null, onSelectStage: (i:number)=>void, onHoverChange: (h:boolean)=>void })` — consumed by Task 8 (`ProgressionScene.tsx`).

- [ ] **Step 1: Write `ProgressionNode`**

Create `three/objects/ProgressionNode.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Color, MathUtils, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from "three";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import type { LabTokens } from "@/three/materials/tokens";

/**
 * One progression-stage node and its connector (design spec §3.2). Unlike
 * three/objects/CoreNode, a node here carries real, distinct information —
 * it is one of six identity stages — so its position never moves; only its
 * emissive state changes, driven by `active`/hover.
 */
const RADIUS = 1.05;
const DAMPING = 6;
const HOVER_EMISSIVE = 2.4;
const ACTIVE_EMISSIVE = 1.6;

type Props = {
  direction: readonly [number, number, number];
  tokens: LabTokens;
  active: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};

export function ProgressionNode({ direction, tokens, active, onHoverChange, onSelect }: Props) {
  const [hovered, setHovered] = useState(false);

  const material = useMemo(() => createMetalMaterial(tokens), [tokens]);
  const connectorMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(tokens.borderStrong),
        transparent: true,
        opacity: 0.85,
        toneMapped: false,
      }),
    [tokens],
  );

  const orientation = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...direction)),
    [direction],
  );

  useEffect(() => {
    material.emissive = new Color(tokens.accent);
    material.emissiveIntensity = 0;
    return () => {
      material.dispose();
      connectorMaterial.dispose();
    };
  }, [material, connectorMaterial, tokens]);

  const meshRef = useRef<Mesh>(null);
  const connectorRef = useRef<Mesh>(null);
  const restColor = useMemo(() => new Color(tokens.borderStrong), [tokens]);
  const activeColor = useMemo(() => new Color(tokens.accentDim), [tokens]);

  useFrame((_, delta) => {
    const step = Math.min(delta, 1 / 30);

    if (meshRef.current) {
      meshRef.current.position.set(direction[0] * RADIUS, direction[1] * RADIUS, direction[2] * RADIUS);
      const targetScale = hovered ? 1.35 : active ? 1.15 : 1;
      const scale = MathUtils.damp(meshRef.current.scale.x, targetScale, DAMPING, step);
      meshRef.current.scale.setScalar(scale);
    }

    if (connectorRef.current) {
      connectorRef.current.position.y = RADIUS / 2;
      connectorRef.current.scale.y = RADIUS;
    }

    const target = hovered ? HOVER_EMISSIVE : active ? ACTIVE_EMISSIVE : 0;
    material.emissiveIntensity = MathUtils.damp(material.emissiveIntensity, target, DAMPING, step);

    const lit = Math.min(material.emissiveIntensity / HOVER_EMISSIVE, 1);
    connectorMaterial.color.lerpColors(restColor, activeColor, lit);
    connectorMaterial.opacity = 0.85 + lit * 0.15;
  });

  function setHover(next: boolean) {
    setHovered(next);
    onHoverChange(next);
  }

  return (
    <>
      <group quaternion={orientation}>
        <mesh ref={connectorRef} material={connectorMaterial}>
          <cylinderGeometry args={[0.014, 0.014, 1, 6]} />
        </mesh>
      </group>

      <mesh
        ref={meshRef}
        material={material}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHover(false);
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <boxGeometry args={[0.085, 0.085, 0.085]} />
      </mesh>
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 3: Write `ProgressionCore`**

Create `three/objects/ProgressionCore.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from "three";
import type { QualityTier } from "@/lib/quality";
import { createCoreMaterial } from "@/three/materials/CoreMaterial";
import { createGlassMaterial } from "@/three/materials/GlassMaterial";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";
import { ProgressionNode } from "./ProgressionNode";

/**
 * The identity progression object (design spec §3.2) — echoes the hero
 * Core's visual grammar (rings, frame, housing) at the same scale, but each
 * of its 6 nodes maps to one data/about.ts progression stage and is
 * individually selectable, unlike Core's single shared expand toggle.
 * Lighter than Core (no meridian/tilt rings) — the selection state does the
 * work Core's expansion animation did there.
 */
const NODE_ANGLES_DEG = [-90, -30, 30, 90, 150, 210];
const MODULE_COUNT = 12;
const MODULE_RING_RADIUS = 1.9;
const RING_SEGMENTS: Record<Exclude<QualityTier, "low">, number> = { high: 160, medium: 80 };

type Props = {
  tier: Exclude<QualityTier, "low">;
  activeStage: number | null;
  onSelectStage: (index: number) => void;
  onHoverChange: (hovered: boolean) => void;
};

export function ProgressionCore({ tier, activeStage, onSelectStage, onHoverChange }: Props) {
  const tokens = useMemo(readTokens, []);
  const segments = RING_SEGMENTS[tier];

  const materials = useMemo(
    () => ({
      core: createCoreMaterial(tokens),
      glass: createGlassMaterial(tokens, tier),
      metal: createMetalMaterial(tokens),
    }),
    [tokens, tier],
  );

  useEffect(() => {
    return () => {
      materials.core.dispose();
      materials.glass.dispose();
      materials.metal.dispose();
    };
  }, [materials]);

  const directions = useMemo(
    () =>
      NODE_ANGLES_DEG.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return [Math.cos(rad), 0, Math.sin(rad)] as const;
      }),
    [],
  );

  const modules = useMemo(
    () =>
      Array.from({ length: MODULE_COUNT }, (_, i) => {
        const rad = (i / MODULE_COUNT) * Math.PI * 2;
        return {
          position: [Math.cos(rad) * MODULE_RING_RADIUS, 0, Math.sin(rad) * MODULE_RING_RADIUS] as const,
          rotation: [0, -rad, 0] as const,
        };
      }),
    [],
  );

  const hoverCount = useRef(0);
  const handleNodeHover = useCallback(
    (hovered: boolean) => {
      hoverCount.current = Math.max(0, hoverCount.current + (hovered ? 1 : -1));
      onHoverChange(hoverCount.current > 0);
    },
    [onHoverChange],
  );

  const rotationRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const step = Math.min(delta, 1 / 30);
    const anySelected = activeStage !== null;

    if (rotationRef.current) {
      rotationRef.current.rotation.y += step * 0.12;
      rotationRef.current.rotation.x = Math.sin(t * 0.16) * 0.05;
    }

    if (coreRef.current) {
      const material = coreRef.current.material as MeshStandardMaterial;
      const pulse = Math.sin(t * 1.6);
      const target = 1.1 + pulse * 0.45 + (anySelected ? 0.45 : 0);
      material.emissiveIntensity = MathUtils.damp(material.emissiveIntensity, target, 4.5, step);
      coreRef.current.scale.setScalar(1 + pulse * 0.06);
      coreRef.current.rotation.y += step * 0.2;
    }
  });

  return (
    <group rotation={[0.24, 0, 0.08]} scale={0.72}>
      <group ref={rotationRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.metal}>
          <torusGeometry args={[1.9, 0.02, 3, segments]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.metal}>
          <torusGeometry args={[1.5, 0.015, 3, Math.round(segments * 0.75)]} />
        </mesh>

        {modules.map((module, i) => (
          <mesh key={i} position={module.position} rotation={module.rotation} material={materials.metal}>
            <boxGeometry args={[0.05, 0.085, 0.13]} />
          </mesh>
        ))}

        {directions.map((direction, i) => (
          <ProgressionNode
            key={i}
            direction={direction}
            tokens={tokens}
            active={activeStage === i}
            onHoverChange={handleNodeHover}
            onSelect={() => onSelectStage(i)}
          />
        ))}
      </group>

      <mesh>
        <octahedronGeometry args={[1.34, 0]} />
        <meshBasicMaterial color={tokens.borderStrong} wireframe transparent opacity={0.65} toneMapped={false} />
      </mesh>

      <mesh material={materials.glass}>
        <octahedronGeometry args={[0.38, 0]} />
      </mesh>

      <mesh ref={coreRef} material={materials.core} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.22, 0]} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add three/objects/ProgressionNode.tsx three/objects/ProgressionCore.tsx
git commit -m "Add the ProgressionCore 3D object — 6 individually selectable identity nodes"
```

---

### Task 8: `ProgressionCameraController` and `ProgressionScene`

**Files:**
- Create: `three/systems/ProgressionCameraController.tsx`
- Create: `three/scene/ProgressionScene.tsx`

**Interfaces:**
- Consumes: `ProgressionCore` (Task 7), `Environment`/`Lighting` from `three/scene/*` (existing, unchanged), `PerformanceManager` from `three/systems/PerformanceManager.tsx` (existing, unchanged), `Bloom` from `three/effects/Bloom.tsx` (existing, unchanged).
- Produces: `ProgressionScene({ tier, activeStage, onSelectStage, onReady, onDowngrade, onGiveUp, onHoverChange })` — consumed by Task 9 (`ProgressionCanvas.tsx`).

- [ ] **Step 1: Write `ProgressionCameraController`**

Create `three/systems/ProgressionCameraController.tsx`:

```tsx
"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";

/**
 * Camera for the identity progression object (design spec §3.2). Same
 * hard-clamped pointer-parallax approach as three/systems/CameraController,
 * deliberately without its scroll-linked dolly: that exists to make the
 * hero recede as it leaves the viewport, which has no equivalent meaning
 * for a small object embedded mid-page on /about. This one just holds
 * still except for the pointer parallax.
 */
const BASE_Z = 5.2;
const MAX_OFFSET_X = 0.55;
const MAX_OFFSET_Y = 0.34;
const DAMPING = 2.4;

export function ProgressionCameraController() {
  useFrame((state, delta) => {
    const { camera, pointer } = state;
    const targetX = MathUtils.clamp(pointer.x, -1, 1) * MAX_OFFSET_X;
    const targetY = MathUtils.clamp(pointer.y, -1, 1) * MAX_OFFSET_Y;
    const step = Math.min(delta, 1 / 30);

    camera.position.x = MathUtils.damp(camera.position.x, targetX, DAMPING, step);
    camera.position.y = MathUtils.damp(camera.position.y, targetY, DAMPING, step);
    camera.position.z = BASE_Z;

    camera.position.x = MathUtils.clamp(camera.position.x, -MAX_OFFSET_X, MAX_OFFSET_X);
    camera.position.y = MathUtils.clamp(camera.position.y, -MAX_OFFSET_Y, MAX_OFFSET_Y);

    camera.lookAt(0, 0, 0);
  });

  return null;
}
```

- [ ] **Step 2: Write `ProgressionScene`**

Create `three/scene/ProgressionScene.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { FallbackReason, QualityTier } from "@/lib/quality";
import { Bloom } from "@/three/effects/Bloom";
import { ProgressionCore } from "@/three/objects/ProgressionCore";
import { ProgressionCameraController } from "@/three/systems/ProgressionCameraController";
import { PerformanceManager } from "@/three/systems/PerformanceManager";
import { Environment } from "./Environment";
import { Lighting } from "./Lighting";

type Props = {
  tier: Exclude<QualityTier, "low">;
  activeStage: number | null;
  onSelectStage: (index: number) => void;
  onReady: () => void;
  onDowngrade: (tier: QualityTier) => void;
  onGiveUp: (reason: FallbackReason) => void;
  onHoverChange: (hovered: boolean) => void;
};

/** Fires once the renderer has put actual pixels on screen — see three/scene/Scene.tsx's FirstFrame. */
function FirstFrame({ onReady }: { onReady: () => void }) {
  const fired = useRef(false);
  const callback = useRef(onReady);

  useEffect(() => {
    callback.current = onReady;
  }, [onReady]);

  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    callback.current();
  });

  return null;
}

/** Composition root for the /about identity map — mirrors three/scene/Scene.tsx's shape. */
export function ProgressionScene({
  tier,
  activeStage,
  onSelectStage,
  onReady,
  onDowngrade,
  onGiveUp,
  onHoverChange,
}: Props) {
  return (
    <>
      <Environment />
      <Lighting />
      <ProgressionCameraController />
      <PerformanceManager tier={tier} onDowngrade={onDowngrade} onGiveUp={onGiveUp} />
      <ProgressionCore tier={tier} activeStage={activeStage} onSelectStage={onSelectStage} onHoverChange={onHoverChange} />
      <FirstFrame onReady={onReady} />
      {tier === "high" && <Bloom />}
    </>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add three/systems/ProgressionCameraController.tsx three/scene/ProgressionScene.tsx
git commit -m "Add ProgressionCameraController and ProgressionScene composition root"
```

---

### Task 9: `ProgressionCanvas` — the dynamic-import entry point

**Files:**
- Create: `three/ProgressionCanvas.tsx`

**Interfaces:**
- Consumes: `ProgressionScene` (Task 8), `dprFor`/`FallbackReason`/`QualityTier` from `lib/quality.ts` (existing).
- Produces: default export `ProgressionCanvas({ tier, activeStage, onSelectStage, onReady, onFailure, onTierChange? })` — consumed by Task 10 (`ProgressionStage.tsx`) via `next/dynamic`.

- [ ] **Step 1: Write the file**

Create `three/ProgressionCanvas.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { dprFor, type FallbackReason, type QualityTier } from "@/lib/quality";
import { ProgressionScene } from "./scene/ProgressionScene";

/**
 * The second (and only other) consumer of three/, alongside three/LabCanvas
 * — the dynamic-import entry point for the /about identity map. Same
 * aria-hidden / no-unique-content contract: everything drawn here is also
 * drawn by components/about/ProgressionFallback, which stays in the DOM
 * as the real control surface regardless of whether this ever mounts.
 */
type Props = {
  tier: Exclude<QualityTier, "low">;
  activeStage: number | null;
  onSelectStage: (index: number) => void;
  onReady: () => void;
  onFailure: (reason: FallbackReason) => void;
  onTierChange?: (tier: QualityTier) => void;
};

export default function ProgressionCanvas({
  tier: initialTier,
  activeStage,
  onSelectStage,
  onReady,
  onFailure,
  onTierChange,
}: Props) {
  const [tier, setTier] = useState<Exclude<QualityTier, "low">>(initialTier);
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setTier(initialTier);
  }, [initialTier]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setVisible(entry.isIntersecting);
      },
      { rootMargin: "120px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleContextLost = useCallback(
    (event: Event) => {
      event.preventDefault();
      onFailure("context-lost");
    },
    [onFailure],
  );

  useEffect(() => {
    return () => {
      canvasRef.current?.removeEventListener("webglcontextlost", handleContextLost);
    };
  }, [handleContextLost]);

  const handleDowngrade = useCallback(
    (next: QualityTier) => {
      if (next === "low") return;
      setTier(next);
      onTierChange?.(next);
    },
    [onTierChange],
  );

  return (
    <div ref={containerRef} className="h-full w-full" aria-hidden="true" data-cursor={hovered ? "interact" : undefined}>
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={dprFor(tier)}
        camera={{ position: [0, 0, 5.2], fov: 38, near: 0.1, far: 20 }}
        gl={{
          alpha: true,
          antialias: tier === "high",
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
          gl.domElement.addEventListener("webglcontextlost", handleContextLost);
        }}
      >
        <ProgressionScene
          tier={tier}
          activeStage={activeStage}
          onSelectStage={onSelectStage}
          onReady={onReady}
          onDowngrade={handleDowngrade}
          onGiveUp={onFailure}
          onHoverChange={setHovered}
        />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add three/ProgressionCanvas.tsx
git commit -m "Add ProgressionCanvas — the dynamic-import entry point for the identity map"
```

---

### Task 10: `ProgressionStage` — the client orchestrator

**Files:**
- Create: `components/about/ProgressionStage.tsx`

**Interfaces:**
- Consumes: `ProgressionCanvas` (Task 9, via `next/dynamic`), `ProgressionFallback` (Task 6), `CanvasBoundary` from `components/hero/CanvasBoundary.tsx` (existing, unchanged), `detectCapability`/`resolveTier` from `lib/quality.ts` (existing), `analytics` from `lib/analytics/events.ts` (existing), `useLabStore` from `lib/store.ts` (existing).
- Produces: `ProgressionStage` — a zero-prop client component, consumed by Task 11 (`app/about/page.tsx`).

- [ ] **Step 1: Write the component**

Create `components/about/ProgressionStage.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasBoundary } from "@/components/hero/CanvasBoundary";
import { ProgressionFallback } from "@/components/about/ProgressionFallback";
import { analytics } from "@/lib/analytics/events";
import { detectCapability, resolveTier, type FallbackReason, type QualityTier } from "@/lib/quality";
import { useLabStore } from "@/lib/store";

const ProgressionCanvas = dynamic(() => import("@/three/ProgressionCanvas"), { ssr: false });

type Phase = "probing" | "dom" | "mounting" | "live";

/**
 * Orchestrates the identity progression map (design spec §3.2). Deliberately
 * NOT a crossfade the way components/hero/CoreStage is:
 * components/about/ProgressionFallback is the permanent, fully-functional
 * control surface — its <details> are what a keyboard/screen-reader user
 * actually operates — not a decorative lookalike that goes inert once 3D
 * loads. It never dims or hides; it just gains a 3D companion visual above
 * it when one successfully mounts.
 */
export function ProgressionStage() {
  const preference = useLabStore((s) => s.quality);
  const setWebglAvailable = useLabStore((s) => s.setWebglAvailable);

  const [phase, setPhase] = useState<Phase>("probing");
  const [tier, setTier] = useState<Exclude<QualityTier, "low"> | null>(null);
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [near, setNear] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const element = stageRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    detectCapability().then((capability) => {
      if (cancelled) return;
      setWebglAvailable(capability.webgl);
      const resolved = resolveTier(capability, preference);
      if (!resolved.tier || resolved.tier === "low") {
        analytics.webglFallback(resolved.reason ?? "no-webgl");
        setPhase("dom");
        return;
      }
      analytics.qualityTier(resolved.tier);
      setTier(resolved.tier);
      setPhase("mounting");
    });
    return () => {
      cancelled = true;
    };
  }, [preference, setWebglAvailable]);

  const abandon = useCallback(
    (reason: FallbackReason) => {
      setPhase("dom");
      setTier(null);
      setWebglAvailable(false);
      analytics.webglFallback(reason);
    },
    [setWebglAvailable],
  );

  const handleToggle = useCallback((index: number, open: boolean) => {
    setActiveStage((current) => (open ? index : current === index ? null : current));
  }, []);

  const live = phase === "live";

  return (
    <div ref={stageRef}>
      {tier && near && (phase === "mounting" || live) && (
        <CanvasBoundary
          onError={(message) => {
            console.warn("[lab] progression map failed, falling back to the DOM list:", message);
            abandon("runtime-error");
          }}
        >
          <div
            className="relative mx-auto mb-8 aspect-square w-full max-w-[320px] opacity-0 transition-opacity duration-[var(--duration-slow)] ease-[var(--ease-out-lab)] data-[ready=true]:opacity-100"
            data-ready={live}
          >
            <ProgressionCanvas
              tier={tier}
              activeStage={activeStage}
              onSelectStage={(i) => setActiveStage((current) => (current === i ? null : i))}
              onReady={() => setPhase("live")}
              onFailure={abandon}
              onTierChange={(next) => next !== "low" && setTier(next)}
            />
          </div>
        </CanvasBoundary>
      )}

      <ProgressionFallback activeStage={activeStage} onToggle={handleToggle} />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add components/about/ProgressionStage.tsx
git commit -m "Add ProgressionStage — quality-gated orchestrator for the identity map"
```

---

### Task 11: Wire everything into `/about`

**Files:**
- Modify: `app/about/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `ProgressionStage` (Task 10), `Timeline` (Task 5), `capabilityIcons` (Task 3), `about`/`skillGroups` from `data/about.ts`/`data/skills.ts` (existing, unchanged), `Fill`/`RevealText` (existing).

- [ ] **Step 1: Replace the page**

Replace the full contents of `app/about/page.tsx`:

```tsx
import type { Metadata } from "next";
import { about } from "@/data/about";
import { skillGroups } from "@/data/skills";
import { Fill } from "@/components/ui/Placeholder";
import { RevealText } from "@/components/effects/RevealText";
import { ProgressionStage } from "@/components/about/ProgressionStage";
import { Timeline } from "@/components/about/Timeline";
import { capabilityIcons } from "@/components/icons/CapabilityIcons";

export const metadata: Metadata = {
  title: "About",
  description: "Who Aditya is, how he got here, and what he can actually do.",
  alternates: { canonical: "/about" },
};

/**
 * data/skills.ts's SkillDepth has two real-world values today (`comfortable`,
 * `working knowledge` — `strong` is unused). Design spec §3.5: map to visual
 * weight, never print the word — an unlabelled self-assessment reads as an
 * unverified claim.
 */
const depthWeight: Record<string, string> = {
  comfortable: "text-text",
  "working knowledge": "text-text-faint",
  strong: "text-text",
};

export default function AboutPage() {
  return (
    <>
      <section className="section">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">IDENTITY</p>
            <h1 className="text-[length:var(--text-3xl)]">Who is Aditya?</h1>
          </RevealText>

          <RevealText className="prose-lab mt-8 max-w-[68ch] text-[length:var(--text-2xl)] text-text">
            <Fill value={about.shortBio} as="p" />
          </RevealText>

          <RevealText className="mt-14">
            <ProgressionStage />
          </RevealText>

          <RevealText className="mt-10">
            <details>
              <summary className="label inline-flex min-h-11 cursor-pointer items-center text-accent marker:hidden [&::-webkit-details-marker]:hidden">
                Read the longer version →
              </summary>
              <div className="prose-lab mt-6 max-w-[68ch] text-text-muted">
                <Fill value={about.longBio} as="p" />
              </div>
            </details>
          </RevealText>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="timeline-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">TIMELINE</p>
            <h2 id="timeline-heading" className="text-[length:var(--text-2xl)]">
              Where the work — and the learning — happened
            </h2>
          </RevealText>

          <RevealText className="mt-12">
            <Timeline />
          </RevealText>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="skills-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">CAPABILITIES</p>
            <h2 id="skills-heading" className="text-[length:var(--text-2xl)]">
              What I can actually do
            </h2>
          </RevealText>

          <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {skillGroups.map((group) => {
              const Icon = capabilityIcons[group.id];
              return (
                <section key={group.id} className="bg-surface p-6" aria-labelledby={`sg-${group.id}`}>
                  <Icon className="h-6 w-6 text-accent" />
                  <h3 id={`sg-${group.id}`} className="mt-3 font-mono text-sm uppercase tracking-widest text-accent">
                    {group.id}
                  </h3>
                  <p className="mt-3 text-sm text-text-muted">
                    <Fill value={group.description} />
                  </p>
                  <ul className="mt-5 space-y-2">
                    {group.items.map((item) => (
                      <li key={item.name} className={`text-sm ${depthWeight[item.depth] ?? "text-text-muted"}`}>
                        {item.name}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="problems-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">PROBLEMS I ENJOY</p>
            <h2 id="problems-heading" className="sr-only">
              Problems I enjoy
            </h2>
            <div className="prose-lab text-[length:var(--text-lg)] text-text-muted">
              <Fill value={about.problemsIEnjoy} as="p" />
            </div>
          </RevealText>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Run the full mechanical gate**

Run: `npm run verify -- --fast`
Expected: typecheck, lint, placeholders, build, bundle all pass. Read the bundle step's output specifically — it should now say `✔ 3D isolation — Three.js is not in the initial bundle of / or /about` (this is the first point in the plan where `/about` actually has a Three.js dynamic import to check).

- [ ] **Step 3: Run the existing e2e suite to confirm nothing on `/about` regressed**

Run: `npm run build && npx playwright test e2e/smoke.spec.ts -g "route /about" --project=desktop`
Expected: all 5 existing `/about` assertions pass (exactly one `h1`, no console errors, no horizontal overflow, every image has alt, heading levels never skip, no axe violations).

Also run the existing quality-control test, since it's driven from `/about`:

Run: `npx playwright test e2e/webgl.spec.ts -g "quality control is keyboard-operable" --project=desktop`
Expected: passes unchanged — this test only touches the global `QualityControl` widget, not anything this task modified.

- [ ] **Step 4: Capture and read screenshots**

Run: `npm run shot`
Then use the Read tool on `.screenshots/about-375.png`, `.screenshots/about-768.png`, `.screenshots/about-1280.png`, `.screenshots/about-1920.png`. Confirm: the identity section reads as a pull-quote + collapsed stage list (not a wall of text), the timeline entries are collapsed by default with visible icons, the capability cards show icons and no printed depth words, nothing overflows at 375px.

- [ ] **Step 5: Commit**

```bash
git add app/about/page.tsx
git commit -m "Wire ProgressionStage, Timeline and capability icons into /about"
```

---

### Task 12: e2e coverage for the identity map

**Files:**
- Create: `e2e/about-progression.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `e2e/about-progression.spec.ts`:

```ts
import { test, expect, type Page } from "@playwright/test";

/**
 * Coverage for components/about/ProgressionStage (design spec §3.2),
 * mirroring e2e/webgl.spec.ts's helpers and rigor for the site's second
 * WebGL consumer.
 */

function captureProblems(page: Page) {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  return problems;
}

async function forceQuality(page: Page, quality: string) {
  await page.addInitScript((value) => {
    window.localStorage.setItem(
      "aditya-lab",
      JSON.stringify({ state: { soundEnabled: false, quality: value }, version: 0 }),
    );
  }, quality);
}

async function disableWebGL(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, id: string, ...rest: unknown[]) {
      if (id === "webgl" || id === "webgl2" || id === "experimental-webgl") return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (original as any).call(this, id, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

test("with WebGL unavailable, all six progression stages are still present as native <details>", async ({ page }) => {
  await disableWebGL(page);
  await page.goto("/about");

  await expect(page.locator("canvas")).toHaveCount(0);

  const first = page.locator("details").first();
  await expect(first).toBeVisible();
  await first.locator("summary").click();
  await expect(first).toHaveAttribute("open", "");
});

test("every progression stage and timeline entry opens with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/about");

  // 6 progression stages + at least 2 timeline entries (education) — the
  // exact experience.ts count can grow, so this only asserts a floor.
  const summaries = page.locator("summary");
  expect(await summaries.count()).toBeGreaterThanOrEqual(8);

  const firstDetails = page.locator("details").first();
  await firstDetails.locator("summary").click();
  await expect(firstDetails).toHaveAttribute("open", "");

  await context.close();
});

test("an explicit HIGH mounts the progression canvas without breaking the DOM controls", async ({ page }) => {
  const problems = captureProblems(page);
  await forceQuality(page, "high");
  await page.goto("/about");

  const canvas = page.locator("canvas");
  await expect(canvas).toHaveCount(1, { timeout: 15_000 });

  const box = await canvas.boundingBox();
  if (!box) throw new Error("the progression canvas has no layout box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);

  // The DOM <details> list is the real control surface and must still work
  // once the 3D layer is live.
  const first = page.locator("details").first();
  await first.locator("summary").click();
  await expect(first).toHaveAttribute("open", "");

  await expect(canvas).toHaveCount(1);
  expect(problems, "the progression map produced console errors").toEqual([]);
});

test("the progression canvas is aria-hidden and never the only route to its content", async ({ page }) => {
  await forceQuality(page, "high");
  await page.goto("/about");

  await expect(page.locator("canvas")).toHaveCount(1, { timeout: 15_000 });
  await expect(
    page.locator("canvas").locator("xpath=ancestor::*[@aria-hidden='true']").first(),
  ).toHaveCount(1);

  // The six stage labels are real text in the DOM, not canvas-only content.
  await expect(page.getByText("CURIOUS", { exact: true })).toBeVisible();
});
```

- [ ] **Step 2: Run the new tests to see the current state**

Run: `npm run build && npx playwright test e2e/about-progression.spec.ts --project=desktop`
Expected: **PASS** — every task up through Task 11 is already implemented at this point in the plan, so this is confirmation, not red-green. (If any assertion fails, it names exactly which behavior from Tasks 6–11 doesn't match what got built — fix the component, not the test, unless the test itself is wrong.)

- [ ] **Step 3: Run the same spec on mobile too**

Run: `npx playwright test e2e/about-progression.spec.ts --project=mobile`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add e2e/about-progression.spec.ts
git commit -m "Add e2e coverage for the /about identity map"
```

---

### Task 13: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Run the complete gate**

Run: `npm run verify`
Expected: typecheck, lint, placeholders, build, bundle, and the **full** e2e suite (desktop + mobile, every spec file) all pass — this is the first time in the plan the entire suite runs together, catching any cross-file interaction the per-task runs above didn't.

- [ ] **Step 2: Capture and read every `/about` screenshot one more time**

Run: `npm run shot`
Read `.screenshots/about-375.png`, `-768.png`, `-1280.png`, `-1920.png` with the Read tool. Confirm no regression from Task 11's review and no layout issues introduced by Task 12's tests (there shouldn't be any — Task 12 added no product code).

- [ ] **Step 3: Confirm the placeholder story is honest**

Run: `cat CONTENT_TODO.md`
Expected: `data/education.ts` does **not** appear (it has no `_REQUIRED` or `AI_DRAFT_REVIEW` tokens — every field is a direct fact from the resume). `data/about.ts`, `data/skills.ts`, `data/experience.ts` still show their pre-existing `AI_DRAFT_REVIEW` markers — unchanged by this plan, still Aditya's to review separately.

- [ ] **Step 4: Report**

No commit for this task (verification only) — summarize the `npm run verify` result and screenshot review to Aditya, matching `CLAUDE.md` §6's checkpoint report format.

---

## Self-Review Notes

**Spec coverage:** §3.1 page restructure → Task 11. §3.2 identity map (3D + fallback) → Tasks 6–10. §3.3 bio restructuring → Task 11 Step 1. §3.4 timeline → Tasks 1, 2, 5. §3.5 capability cards → Tasks 3, 11. §5 fallback chain → covered by reusing `lib/quality`/`CanvasBoundary` unchanged (Tasks 7–10) plus explicit e2e coverage (Task 12). §6 testing → Tasks 4, 11 Step 3, 12, 13. §7 out-of-scope items (bio/progression copy rewriting, photo, `NeuralCore`) — untouched by every task above, confirmed by inspection.

**Deviation from the spec, and why:** §3.2 originally described a separate "DOM button group" alongside a numbered-list fallback. Building both would mean two different DOM representations of the same six stages and, worse, a reveal-panel pattern that only shows one stage's text without JavaScript — which fails the "reachable with JS off" constraint for the other five. Task 6 merges them into one component: six native `<details>`, permanently the real control surface, synced with the 3D layer through one `activeStage` value. This is a strict improvement (fully accessible, no duplicate markup) that preserves everything the spec actually required.

**Type consistency check:** `activeStage: number | null` and `onSelectStage(index: number)` are the same shape from `ProgressionFallback` (Task 6) through `ProgressionStage` (Task 10), `ProgressionCanvas` (Task 9), `ProgressionScene` (Task 8), down to `ProgressionCore`/`ProgressionNode` (Task 7) — verified by re-reading each task's Props type above. `EducationEntry`'s `start`/`end` (`Task 1`, string `"YYYY"`) vs `ExperienceEntry`'s (`"YYYY-MM"`, existing) are intentionally different precision, reconciled only inside `Timeline.tsx`'s local `sortKey()`/`formatDate()` (Task 5) — neither schema pretends to match the other.
