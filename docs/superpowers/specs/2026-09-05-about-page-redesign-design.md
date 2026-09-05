# About page redesign — design spec

Date: 2026-09-05
Status: approved by Aditya, ready for implementation planning

## 1. Problem

The current `/about` page (`app/about/page.tsx`) is five stacked text-heavy
sections: a static numbered progression list, two full-paragraph bios, a
plain experience list, a skills grid with self-assessed depth labels
("comfortable" / "working knowledge"), and a closing paragraph. Feedback:

1. The "who am I" section is a wall of text with no interaction — it should
   be an interactive element the visitor explores rather than reads.
2. Too much running prose generally; needs visual/interactive treatment.
3. The skill depth labels ("comfortable" etc.) read poorly — an unverified
   self-assessment printed as a word next to every tag.
4. No iconography anywhere on the page or its cards.
5. No timeline — education (BITS Pilani, Masters' Union) and work history
   are presented as two disconnected lists with no chronological, interactive
   view.

## 2. Constraints this design must respect

Pulled from `CLAUDE.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, and the
project's own `design-update-referene.md` master spec — not invented for
this feature:

- **Progressive enhancement is non-negotiable.** Every piece of information
  on this page must be reachable with JavaScript off and WebGL absent.
  3D never becomes the only route to content (CLAUDE.md §3, principle 5).
- **No icon library.** Inline SVG only, 1.5px stroke, 24px grid,
  `currentColor` (DESIGN_SYSTEM.md §9).
- **Never invent personal facts.** Education dates/institutions come
  directly from `Aditya_Mahajan_OnePager.pdf` (supplied 2026-09-05) —
  objective, structural facts, same treatment as `experience.ts`'s
  company/role/dates fields (written directly, no draft marker; only
  narrative bullets get `[AI_DRAFT_REVIEW]`).
- **3D is selective, not default.** The existing 3D core (`three/objects/Core.tsx`,
  gated by `components/hero/CoreStage.tsx`) is the only precedent for 3D content on
  this site. This design explicitly extends that precedent to `/about` — a deliberate
  choice Aditya made after being shown the 2D-only alternative — rather than
  introducing 3D as a default pattern for content pages generally.
- **Content lives in `/data`, Zod-validated at build time.**

## 3. Architecture

### 3.1 Page structure (`app/about/page.tsx`)

Four sections, replacing today's five:

1. **Identity** — headline, the `ProgressionStage` interactive map, the
   pull-quote `shortBio`, and a `<details>` disclosure holding `longBio`.
2. **Timeline** — the new `<Timeline />` component (merged education + work).
3. **Capabilities** — today's skill groups, restyled with group-level icons
   and visual-weight depth instead of word labels.
4. **Problems I enjoy** — unchanged.

### 3.2 The identity map — `ProgressionStage`

Mirrors `components/hero/CoreStage.tsx`'s exact gating machinery, reused
as-is (not reimplemented):

```
components/about/ProgressionStage.tsx   (client — orchestrator, mirrors CoreStage)
components/about/ProgressionFallback.tsx (server — the DOM/no-JS equivalent)
three/objects/ProgressionCore.tsx        (the 3D object, mirrors Core.tsx)
three/ProgressionCanvas.tsx              (mirrors LabCanvas.tsx — the dynamic-import entry point)
```

**Reused without modification:** `lib/quality.ts` (`detectCapability`,
`resolveTier`), `components/hero/CanvasBoundary.tsx`, the materials in
`three/materials/*`, `three/scene/Environment.tsx`, `three/scene/Lighting.tsx`.

**New, because the interaction model is different from the hero Core:**
the hero's `Core` has one shared boolean `expanded` state and its nodes
carry no information (its own doc comment: "the node carries no
information — it lights up and the whole assembly responds"). The
progression map's nodes *are* the information — each of the 6 nodes maps to
one `about.progression` entry (CURIOUS, BUILDER, MARKETER, PRODUCT THINKER,
AI EXPLORER, STILL EXPERIMENTING) and must be individually selectable, not
a single collective toggle.

`ProgressionCore` therefore takes `activeStage: number | null` and
`onSelectStage: (i: number) => void` as props (lifted state, not internal) —
same shape as `NeuralCore`'s `active`/`setActive` pattern, just crossing
into the 3D layer. Hovering a node calls `onHoverChange` (cursor feedback
only, same as `Core`); clicking calls `onSelectStage(i)`.

`ProgressionStage` (the client wrapper) owns `activeStage` and renders:
- The gated canvas (`aria-hidden="true"`, same `probing → dom → mounting →
  live` phase machine as `CoreStage`), passing `activeStage`/`onSelectStage`
  through.
- A real DOM button group below it — one button per stage, `aria-pressed`,
  identical accessibility pattern to `NeuralCore`'s capability buttons.
  Clicking a 3D node and clicking its DOM button call the same handler.
- The revealed stage body (`about.progression[activeStage].body`) in a
  panel next to/below the map.

**Fallback (`ProgressionFallback`):** today's existing numbered `<ol>` list
in `app/about/page.tsx` (lines 34-50), extracted into its own component
unchanged. This is the permanent no-WebGL / reduced-motion / LOW-tier /
no-JS view — not a decorative SVG lookalike (unlike `CoreFallback`, there's
no crossfade requirement forcing a visual match, so the existing accessible
list is kept rather than rebuilt). `ProgressionStage` renders this
component exactly where `CoreStage` renders `CoreFallback`, `suppressed`
once the 3D layer is live.

**Budget:** treated as a second instance of the existing 3D budget, not
additive scope creep. `Core` runs ~4.6k triangles with 5 nodes; with one
more node (6 vs. 5) `ProgressionCore` should land close to ~5.2k triangles
— still trivial against the 60k HIGH / 20k MEDIUM budget in `PLAN.md`
Phase 9. No new bundle cost beyond this one object: it dynamic-imports
through the same `three`/`@react-three/fiber` chunk already paid for by
the homepage.

### 3.3 Bio restructuring

- `shortBio`: rendered as a large pull-quote (editorial type scale, not
  `prose-lab` body text) directly under the headline.
- `longBio`: moved into a native `<details>`/`<summary>` ("Read the longer
  version") — full content preserved, zero JS required, just not force-fed.
- No data/schema changes — same two fields, different presentation only.

### 3.4 Timeline — `components/about/Timeline.tsx`

**New schema** (`data/schema.ts`):

```ts
export const EducationEntrySchema = z.object({
  id: z.string(),
  institution: z.string(),
  program: z.string(),
  location: z.string().optional(),
  start: z.string(), // "YYYY" — the resume gives year-only precision for education
  end: z.string().optional(), // omit for "Present"
  note: z.string().optional(), // e.g. scholarship
});
```

Deliberately `"YYYY"`, not `ExperienceEntrySchema`'s `"YYYY-MM"` — the
resume gives no month for either degree, and a schema shouldn't assert
false precision. This means the two entry types aren't directly
string-sortable against each other as-is (`"2018"` vs. `"2025-07"`); the
merge in `Timeline.tsx` normalizes both to a comparable key (year-only
dates treated as `-01`) before sorting, rather than forcing one schema's
format onto the other's real precision.

**New data** (`data/education.ts`), populated directly from the resume PDF —
objective structural facts, no draft marker (same treatment as
`experience.ts`'s company/role/dates):

- Masters' Union — PGP TBM, 2026–Present, Gurugram, note: "25% scholarship
  — Pankaj Bansal Scholarship for Young Leaders"
- BITS Pilani — B.E. Chemical Engineering, 2018–2022, Goa

School-level entries (Birla School XII 2017, Omkar International X 2015)
are **excluded** per Aditya's decision — higher ed + work only, matching
how the resume itself is weighted for a recruiter audience.

**Component:** merges `education` + `experience` into one list sorted by
`start` date, rendered as native `<details>` per entry (progressive
enhancement — works with zero JS, click-to-expand is free). Collapsed:
institution/company, role/program, date range, one of two icons (work vs.
education — not one per entry). Expanded: the bullets (work) or the note
(education). Hover gets a subtle border/accent treatment on pointer
devices only (`@media (pointer: fine)`), consistent with the rest of the
site's hover conventions — never the only way to reach the expanded state.

### 3.5 Capability cards — icon + depth rework

**Icons:** one hand-drawn SVG per capability group (THINK, BUILD, AUTOMATE,
INTELLIGENCE, GROW — 5 total), same authoring approach as
`components/icons/StackIcons.tsx` (built in Phase 12 for Build Mode).
**Not** one icon per individual skill tag (Strategy, SQL, Python, ...) —
~26 one-off icons for individual tools is disproportionate effort for
signal and cuts against the "less but stronger" principle; the group-level
icon is what makes each card scannable.

**Depth:** no schema or data change. `data/skills.ts` only ever uses two of
`SkillDepth`'s three enum values today (`comfortable`, `working knowledge`
— never `strong`). The fix is purely presentational: instead of printing
the depth word next to each item, map depth to visual weight (bolder/full
`text-text` for `comfortable`, dimmer `text-text-muted` for `working
knowledge`). Nothing under the hood changes; `SkillDepth` stays a 3-value
enum for future flexibility, it just stops being rendered as text.

## 4. Data flow

```
data/education.ts ─┐
data/experience.ts ─┴─→ components/about/Timeline.tsx (merge + sort — a plain
                          Server Component; native <details> needs no client JS)
data/about.ts (progression) → components/about/ProgressionStage.tsx → three/ProgressionCanvas.tsx (dynamic import)
                                                                     └→ ProgressionFallback.tsx (always rendered, suppressed when 3D is live)
data/skills.ts → app/about/page.tsx capability cards (icon lookup by group id, depth → CSS class)
```

## 5. Error handling / fallback chain

Identical to the existing 3D fallback chain in `ARCHITECTURE.md` §6 — this
feature adds no new failure modes, it's a second consumer of the same gate:

| Failure | Behaviour |
|---|---|
| No WebGL / context lost | `ProgressionFallback` (the existing numbered list), same as `CoreFallback` |
| `prefers-reduced-motion` | Fallback only, no camera/particle motion |
| LOW quality tier (explicit user choice) | Fallback only — this is a real choice, not degraded |
| JavaScript disabled | Fallback only, fully accessible, no boot dependency |
| `Timeline` `<details>` — no JS | Native disclosure still opens/closes, no interaction lost |

## 6. Testing

- Extend `e2e/smoke.spec.ts`'s existing `/about` coverage (already in
  `ROUTES`) — no new route, same page.
- New assertions needed: the progression DOM button group is fully
  keyboard-operable and `aria-pressed` toggles correctly (mirrors the
  existing `NeuralCore` pattern, which has no dedicated test today — worth
  adding for both while here).
- Follow `e2e/webgl.spec.ts`'s existing pattern (`with WebGL unavailable...`,
  `reduced motion never loads the 3D layer...`) for `ProgressionStage`,
  same assertions, second component.
- `npm run shot` at all 4 breakpoints for `/about`, read before claiming done.
- `npm run verify` full run (typecheck, lint, placeholders, build, bundle
  budget, e2e) must stay green — bundle check must confirm no *new* chunk
  beyond what the existing 3D infra already accounts for.

## 7. Explicitly out of scope

- Re-authoring `shortBio`/`longBio`/`progression` copy itself — those are
  currently `[AI_DRAFT_REVIEW]`-marked from a prior session and need
  Aditya's review regardless of this redesign; this spec only changes
  *presentation*.
- Photo/media — `about.photo` remains unset; not part of this request.
- Any change to `/systems`' `NeuralCore` — it stays as-is; this design
  does not touch it, only draws on it as a pattern reference.
