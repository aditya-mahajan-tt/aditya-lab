# Mobile audit remediation + orbital hero — design spec

Date: 2026-09-06
Status: design approved by Aditya (data model + concept). Plane assignment
values are BLOCKED ON ADITYA — see §6.

Two workstreams in one spec because they share a cause: the site's most
expressive surfaces (the hero, the systems diagrams) currently either
carry no information or vanish entirely below 768px.

Workstream 1 (§2) is remediation and ships first — it blocks the
CLAUDE.md §2 thirty-second recruiter path on a phone.
Workstream 2 (§3–§6) is the hero redesign.

**These are two implementation plans, not one.** They share no code and no
data. Workstream 1 touches navigation chrome, the systems diagrams, the
chat panel and the build script; workstream 2 touches the hero, the schema
and the data layer. Planning them together would couple a fix that should
ship this week to a redesign gated on content decisions (§6). Each gets its
own plan, and workstream 1's plan is written first.

---

## 1. How the audit was run

Production build (`npm run build`, exit 0), served on an isolated port,
driven with Chromium under an iPhone 13 profile (touch, `isMobile`, DPR 2)
at 320 / 375 / 390 px across 12 routes, plus the menu, Ask-the-Lab and
command-palette open states. Instrumented for: document and element-level
horizontal overflow, tap-target size, non-nested interactive overlap,
single-line-descendant text clipping, console and page errors. Screenshots
captured at viewport size (not fullPage) and read.

### 1.1 What is NOT broken — stated so effort goes to the right place

- **No horizontal overflow** at any width on any route.
- **No console errors, no page errors.**
- **No genuinely overlapping interactive elements.** The instrument first
  reported 7–15 overlaps per page, all against `NavOverlay`'s links. These
  were verified false: `elementFromPoint` at a link's centre returns the
  page `h1`, and a synthetic click at that point does not navigate. A
  closed `<details>` panel is laid out but not hit-testable. Recorded here
  so a future audit does not re-raise it.

### 1.2 Instrument gap found

`body { overflow-x: hidden }` (`app/globals.css:130`) means the overflow
assertion in `scripts/screenshots.mjs`
(`documentElement.scrollWidth > innerWidth`) can never fire. The existing
overflow check is blind. Remediation: assert per-element bounding boxes
against `innerWidth` instead of the document scroll width.

---

## 2. Workstream 1 — mobile remediation

Ordered by impact on the CLAUDE.md §2 path.

### A. Navigation chrome

**A1 — Mobile menu wastes the top third and hides CONTACT / RESUME.**
`components/navigation/NavOverlay.tsx:79` applies `justify-center` with
`py-32` to a list taller than the viewport. Measured at 375×812: ~300px of
void above `SYSTEM · NAVIGATE`; `LAB` begins 23% down the screen; `ABOUT`
is clipped at the fold; CONTACT and RESUME require an unindicated scroll
inside the overlay.

Fix: below `md`, drop to `justify-start` with a normal top offset clearing
the header, and reduce per-item vertical padding so all ten routes fit one
812px screen. Centring is a desktop-only affordance.

**A2 — Four controls in a 375px header, one inert.**
`ADITYA LAB · ASK THE LAB · MENU · ⌘K`. The `⌘K` control consumes ~60px on
a device with no keyboard to press it with. `MENU` is unbordered while both
neighbours are bordered.

Fix: hide the `⌘K` trigger below `md`, making the command palette a
desktop-only accelerator. This is acceptable and deliberate: the palette is
a keyboard power-user shortcut and is not the only route to any content —
every destination it offers is reachable from the menu overlay, which is
what A1 fixes. Give `MENU` the same border treatment as its siblings.

**A3 — Tap targets below the 44px minimum.** Measured:

| Element | Size | Location |
|---|---|---|
| `Aditya Lab` wordmark | 77×15 | `components/layout/Header.tsx` |
| `LinkedIn` / `GitHub` / `Contact` | 62×14 / 46×14 / 54×14 | `components/layout/Footer.tsx` |
| `See the framework →` | 154×15 | home |
| `Full background →` | 139×15 | home |
| `← Previous` / `Next →` | 83×18 / 53×18 | `app/work/[slug]` |
| `Download it instead` | 141×19 | `app/resume` |
| Ask-the-Lab close `✕` | 32×32 | `components/ai/ChatWindow.tsx` |

Fix: `min-h-11` plus `inline-flex items-center` on each. The visual weight
of the type does not change; only the hit area grows.

### B. /systems — total content loss below 768px

**B1 — Every diagram is `hidden md:block`**
(`components/systems/SystemDiagramCard.tsx:50`). Below `md` the Strategy
Wall degrades to a wrapping run of mono text that breaks the arrow chain
across lines (`… ICP →` / newline / `POSITIONING …`). The route's own nav
description promises "Interactive diagrams of how the work actually runs";
on a phone there is neither diagram nor interaction.

Fix: replace the `<ol>` text fallback with a vertical stepped diagram —
the same nodes and connectors, laid out top-to-bottom in a single column,
using the existing `diagramLayout.ts` primitives with a vertical variant.
One SVG serves both breakpoints; `layoutSerpentine` gains a `maxCols: 1`
path. Node detail moves from hover-only into a tappable disclosure, since
`figcaption` "Hover a stage for detail" is unreachable on touch — this is
also a CLAUDE.md §4 violation today (hover-only critical information).

**B2 — ~350–400px empty bands** where the desktop diagram box was.
Resolved by B1: the section stops being empty. Section padding below `md`
additionally reduces from `6rem` to `4rem`.

### C. Ask the Lab

**C1 — ~700px of dead space** between the last suggested question and the
composer, from a desktop-height flex layout on an 812px screen. Fix: the
message region takes `flex-1` with the suggestions pinned to the top and
the composer to the bottom, so empty space collapses.

**C2 — No safe-area inset.** The composer sits flush to the viewport
bottom with the disclaimer beneath it; on a notched device that copy falls
under the home indicator. Fix: `padding-bottom: env(safe-area-inset-bottom)`
on the composer container.

### D. Content state reaching production

**D1 — Placeholder guard does not gate the build.** `[PROJECT_004_TITLE_REQUIRED]`
and `[PROJECT_004_SUMMARY_REQUIRED]` render live in a production build on
`/` and `/work`. `npm run build` exited 0 with them present, because
`check:placeholders` runs only inside `npm run verify`. CLAUDE.md §7 states
the check must fail the production build.

Fix: invoke `check:placeholders` from a `prebuild` script so it gates
`npm run build` directly, not only the verify path.

**D2 — `[AI_DRAFT_REVIEW]` copy dominates mobile.** Nearly all bio and
capability copy is still draft-marked, so `/about` and `/systems` at 375px
are largely dashed green boxes. This is the placeholder system behaving
correctly, and D1's fix will make it build-blocking. It is a content-intake
task for Aditya, not a layout defect — recorded here so it is not
misdiagnosed as one.

---

## 3. Workstream 2 — the orbital hero

### 3.1 Problem

`three/objects/Core.tsx` places five nodes at hardcoded angles
(`NODE_ANGLES_DEG = [-90, -18, 54, 126, 198]`) carrying no data. The object
is well-built and well-documented, but it is decoration: it demonstrates
that the site can render 3D without saying anything about Aditya.

Meanwhile `app/page.tsx`'s `h1` asserts "I build things at the intersection
of AI × Product × Business." CLAUDE.md §1 requires the site to prove its
claim by existing rather than asserting it. The hero is the one surface
positioned to do that and currently does not.

### 3.2 Concept

Three orbital planes — `AI`, `PRODUCT`, `BUSINESS` — at distinct
orientations, intersecting at the core. Two ring depths:

- **Inner ring — capability (how).** The five groups from `data/skills.ts`.
  Links to `/systems#neural-core`.
- **Outer ring — output (what).** Projects, experiments and selected
  experience. Links to the case study or experiment.

A body belonging to 2+ planes renders at their intersection and is marked
as spanning. The intersection is the argument, so it carries emphasis
rather than mere membership.

The existing core object — octahedron housing, glass shell, wireframe frame,
its motion vocabulary — is retained. What is replaced is the meaning of the
bodies around it.

### 3.3 Data model

New field on the schema, applied to projects, experiments and skill groups:

```ts
planes: z.array(z.enum(["ai", "product", "business"])).min(1)
```

This is an addition to `/data`, consistent with CLAUDE.md §4 (content lives
in the data layer, never in a component). The hero reads three sources —
`projects.ts`, `experiments.ts`, and selected entries from `experience.ts` —
through a new query in `data/queries.ts`. It does not duplicate content.

### 3.4 Desktop behaviour

Planes labelled at their outer edges. Hovering a body lights it and writes
its label and one-line detail into a caption row beneath the stage. No
tooltips: they do not survive touch, and a hover-only detail would repeat
the B1 defect. Click routes. Idle motion is the existing counter-rotation.

### 3.5 Mobile behaviour

Tabs `AI · PRODUCT · BUSINESS` at 44px, swipeable. The selected plane
rotates face-on; its bodies are labelled and tappable. Multi-plane bodies
remain visible on every tab, marked as spanning — this is what recovers the
intersection that a one-plane-at-a-time view would otherwise hide. The core
is always present.

### 3.6 Degradation ladder

| Layer | Renders | Audience |
|---|---|---|
| 0 | Grouped `<ul>` of every body under its plane heading, real `<a>` links | No-JS, crawlers, assistive tech — permanently in the DOM |
| 1 | SVG orbital (rewrite of `components/hero/CoreFallback.tsx`) | JS, no WebGL |
| 2 | R3F orbital (rewrite of `three/objects/Core.tsx`) | WebGL, tier ≥ medium |

`components/hero/CoreStage.tsx`'s gate — intersection-observed dynamic
import, one-way abandon on failure, `CanvasBoundary` — is sound and is not
modified. Under `prefers-reduced-motion: reduce` rotation parks; every body
stays readable and tappable. No layer is the only route to any content
(CLAUDE.md §3, principle 5).

### 3.7 Dependencies

None added. GSAP, R3F, drei and Three.js are already in
`ARCHITECTURE.md §Dependencies`.

---

## 4. Risks

- **Three intersecting rings can read as noise.** Mitigation: planes carry
  distinct stroke weight and dash; only the hovered or selected plane
  brightens. If the composition still reads as noise at implementation, the
  fallback is two planes plus a marked intersection axis, not more rings.
- **Nine bodies is near the legibility ceiling at 420px.** The mobile
  one-plane view exists precisely because of this. Desktop is verified by
  screenshot before the layer-2 3D work begins.
- **Layer 1 must stand alone.** The SVG orbital is built and verified
  first, with the 3D layer added only once it is good on its own — the
  same discipline the existing `CoreFallback` follows.

---

## 5. Definition of done

Per CLAUDE.md §4, for both workstreams: integrated (not a parallel island);
content from `/data`; correct at 375 / 768 / 1280 / 1920; zero console
errors and React warnings; keyboard-operable with visible focus; correct
under reduced motion; defined loading, empty and error states; no
regression against `QA_AND_PERFORMANCE.md`; verified by `npm run verify`
and by reading `npm run shot` output — plus a re-run of the §1 mobile
instrument at 320 / 375 / 390 showing zero sub-44px tap targets.

---

## 6. BLOCKED ON ADITYA

**Plane assignment.** Which of `ai` / `product` / `business` each item
belongs to is a statement about Aditya's own work, and CLAUDE.md §8
forbids deciding it. Implementation will write the field with the
derivation below as a starting proposal, each marked for confirmation;
none of it ships unconfirmed.

Derived from existing `category` values only:

| Item | Layer | `category` | Proposed |
|---|---|---|---|
| goSTOPS | project | Strategy, Marketing, Segmentation | business |
| Kensara AI | project | Strategy, GTM | business |
| Adda | project | Product, E-commerce | product, business |
| `[PROJECT_004_TITLE_REQUIRED]` | project | Product, Creative | product |
| `[EXPERIMENT_001_TITLE_REQUIRED]` | experiment | AI, Automation | ai |
| Turbotork | experience | AI Product Manager | ai, product |

**Why the outer ring reads three sources, not just projects.** None of the
four entries in `data/projects.ts` is AI work: goSTOPS and Kensara AI are
strategy/GTM (Kensara is GTM *for* an AI startup, not AI work by Aditya),
Adda is product/e-commerce, project 004 is product/creative. The only
AI-categorised item in the content layer is an experiment whose title is
still a placeholder. The real AI work — founding AI Product Manager at
Turbotork, agent workflows lifting team productivity ~70% — lives in
`data/experience.ts`, which the hero does not currently read.

Built against `projects.ts` alone, the AI plane would orbit nearly empty,
and a hero designed to prove "AI × Product × Business" would visually
disprove it. Drawing from projects + experiments + experience is what makes
the plane hold weight. Aditya confirmed this approach on 2026-09-06.
