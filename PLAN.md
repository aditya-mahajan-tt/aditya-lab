# PLAN.md — ADITYA LAB Build Plan

> Execution sequence. Read `CLAUDE.md` first — it contains the rules that apply to every phase.
> Work one phase at a time. Stop at every checkpoint and report.

---

## 0. What changed from the original spec, and why

The original specification is strong on vision and weak on sequencing risk. Five deliberate changes:

1. **Launch gate moved forward.** The original plan launches after 17 phases. That is a 3–6 month runway during which nothing is live and no recruiter can see anything. This plan ships a real, deployed, recruiter-usable portfolio at **Phase 7**, then layers the Lab on top of a live site.
2. **AI before the full 3D world.** "Ask the Lab" demonstrates AI/product capability — the thing Aditya is actually positioning on. A six-station 3D environment demonstrates WebGL craft, which is a different job title. The AI layer and the interactive system diagrams are the differentiators; the 3D is the frame around them. So AI ships in Release 2, the full Lab in Release 3.
3. **Content intake is Phase 0, not Phase 8.** The bottleneck on this project is written case studies, not code. Code waits on content; content does not wait on code.
4. **Every "quality" claim is now a number.** "Smooth on capable hardware" is untestable. `QA_AND_PERFORMANCE.md` replaces it with budgets that fail the build.
5. **Verification is mechanised.** Claude Code cannot see the screen. Phase 1 builds a screenshot + console-error harness so "inspect the result" becomes a real step instead of an assumption.

---

## 1. Release gates

| Release | Contains | Gate |
|---|---|---|
| **V1 — Portfolio That Works** | Phases 0–7 | Deployed to the real domain. Passes the 5s / 30s / recruiter / mobile / failure tests. **No 3D, no AI.** |
| **V1.5 — Lab Signature** | Phases 8–12 | Hero 3D core, Ask the Lab, interactive system diagrams, Build Mode, Lab Log. |
| **V2 — Full Lab** | Phases 13–16 | 3D environment with stations, experiments playground, easter eggs, sound, physics. |

**V1 goes live before any Release 2 work starts.** A live imperfect portfolio beats an unlaunched perfect one.

---

## 2. Phase table

| # | Phase | Blocks on | Checkpoint |
|---|---|---|---|
| 0 | Content intake & repo setup | Aditya | — |
| 1 | Foundation & verification harness | — | **CP1** |
| 2 | Content system & schema validation | Phase 0 content | — |
| 3 | Navigation & routing | — | — |
| 4 | Core pages (content-first, no motion) | Phase 0 content | **CP2** |
| 5 | Hero & boot sequence (DOM only) | — | — |
| 6 | Motion layer | — | **CP3** |
| 7 | Launch prep & deploy | domain, links | **CP4 — V1 LIVE** |
| 8 | 3D foundation & quality system | — | — |
| 9 | Hero computational core | — | **CP5** |
| 10 | Ask the Lab (AI) | knowledge base | **CP6** |
| 11 | Interactive systems & project visualisation | — | — |
| 12 | Build Mode & Lab Log | — | **CP7 — V1.5** |
| 13 | Lab environment & stations | — | **CP8** |
| 14 | Experiments playground | experiment content | — |
| 15 | Easter eggs, sound, physics | — | — |
| 16 | Full regression, performance, accessibility audit | — | **CP9 — V2** |

---

# RELEASE 1 — THE PORTFOLIO THAT WORKS

## Phase 0 — Content intake & repo setup

**Goal:** Nothing gets built on guesses.

Claude Code:
- Initialise the repo, `.gitignore`, Node version pin, `README.md` skeleton.
- Read `CONTENT_INTAKE.md`. Produce `CONTENT_TODO.md` listing every item Aditya has not yet supplied, sorted by which phase it blocks.
- Do **not** start Phase 1 until Aditya has supplied at least the **P0 (launch-blocking)** items in `CONTENT_INTAKE.md`.

**Exit:** `CONTENT_TODO.md` exists; all P0 content is in hand or explicitly deferred by Aditya with a placeholder token.

---

## Phase 1 — Foundation & verification harness

**Goal:** A clean shell plus the ability to prove it works.

Build:
- Next.js (App Router) + TypeScript strict + Tailwind + ESLint + Prettier.
- Design tokens from `DESIGN_SYSTEM.md` as CSS custom properties in `globals.css`, mirrored into the Tailwind theme. **No hardcoded colours or durations anywhere in the codebase from this point on.**
- Fonts: self-hosted via `next/font`, max two families, max four weights total.
- Root layout, skip-to-content link, semantic landmarks, `<main>`.
- **Verification harness** — this is the important part of the phase:
  - `scripts/verify.ts` → typecheck, lint, `next build`, Playwright smoke run.
  - `scripts/screenshots.ts` → Playwright captures every route at 375 / 768 / 1280 / 1920 into `.screenshots/`.
  - Playwright smoke test asserts: every route returns 200, no `console.error`, no unhandled rejection, no horizontal overflow (`document.documentElement.scrollWidth <= innerWidth`).
  - `scripts/check-placeholders.ts` per `CLAUDE.md` §7.
  - npm scripts: `verify`, `shot`, `analyze` (bundle analyzer).
- GitHub Actions: run `verify` on every push.

**Exit criteria:**
- `npm run verify` green.
- `npm run shot` produces readable screenshots; you have read them.
- Lighthouse on the empty shell ≥ 95 across the board.

> **CHECKPOINT 1 — Foundation.** Report and stop.

**Kickoff prompt:**
> Read CLAUDE.md, PLAN.md Phase 1, and DESIGN_SYSTEM.md. Scaffold the Next.js App Router project with TypeScript strict mode, Tailwind, ESLint and Prettier. Implement the design tokens exactly as specified — CSS custom properties in globals.css mirrored into tailwind.config. Then build the verification harness described in Phase 1: verify.ts, screenshots.ts, check-placeholders.ts, the Playwright smoke suite, and the GitHub Actions workflow. Run `npm run verify` and `npm run shot`, read the screenshots, and give me the Checkpoint 1 report.

---

## Phase 2 — Content system & schema validation

**Goal:** All content lives in `/data`, typed and validated.

Build:
- `/data/{projects,experiments,skills,timeline,about,navigation,site}.ts` per `ARCHITECTURE.md`.
- Zod schemas in `/data/schema.ts`. Every data file is parsed at module load — **bad content fails the build, not the browser.**
- Populate with the real content from Phase 0; placeholder tokens for the rest.
- Helper functions: `getProject(slug)`, `getAllProjects()`, `getFeaturedProjects()`, filtering, sorting.

**Exit:** Adding a project = editing one file. Schema violation = failed build. `CONTENT_TODO.md` regenerates correctly.

**Kickoff prompt:**
> Read PLAN.md Phase 2, ARCHITECTURE.md §Data models, and CONTENT_INTAKE.md. Build the /data layer with Zod schemas validated at module load. Populate with the content I've supplied and explicit [X_REQUIRED] placeholder tokens elsewhere. Regenerate CONTENT_TODO.md. Run verify.

---

## Phase 3 — Navigation & routing

**Goal:** Every route reachable three ways: link, menu, command palette.

Build:
- Header: `ADITYA LAB` wordmark left, `MENU` + `⌘K` right. Fixed, blur backdrop, hides on scroll down / reveals on scroll up.
- Expanded menu overlay: LAB · WORK · EXPERIMENTS · THINKING · ABOUT · CONTACT · RESUME.
- Command palette (`⌘K` / `Ctrl+K`): fuzzy search across routes, projects and experiments. Full keyboard support, focus trap, `Escape` closes, focus returns to trigger. ARIA combobox pattern.
- Mobile menu: full-screen, touch-sized targets (≥44px), body scroll lock while open.
- Routes: `/`, `/work`, `/work/[slug]`, `/experiments`, `/experiments/[slug]`, `/thinking`, `/about`, `/contact`, `/resume`, `not-found.tsx`.

**Exit:** Full site navigable by keyboard only. Palette opens in <100ms. No focus escapes an open overlay.

---

## Phase 4 — Core pages, content-first

**Goal:** The entire portfolio readable and useful with zero animation.

Build:
- `/work` — project archive as ARTIFACT cards: `PROJECT_001 / title / categories / status / EXPLORE →`. Filter by category. Static layout, no motion yet.
- `/work/[slug]` — the nine-section case study structure. Generous typography, real hierarchy, pull quotes, image slots. Prev/next project. Not a wall of text: every section capped, with visual breaks.
- `/experiments`, `/experiments/[slug]` — same treatment, status chips including `FAILED`.
- `/thinking` — the OBSERVE → QUESTION → UNDERSTAND → FRAME → BUILD → TEST → LEARN → ITERATE framework as a static diagram (SVG), plus written explanation of each step.
- `/about` — the progression (CURIOUS → BUILDER → MARKETER → PRODUCT THINKER → AI EXPLORER → STILL EXPERIMENTING), then real biography, then the capability-based skill system (THINK / BUILD / AUTOMATE / INTELLIGENCE / GROW).
- `/contact` — LET'S BUILD SOMETHING. Email, LinkedIn, GitHub, Resume. Mailto or a form with server-side validation and rate limiting.
- `/resume` — either an embedded PDF viewer with a prominent download, or an HTML resume plus PDF download. **This route must load in under 1s.**

**Exit criteria:**
- Every route passes the 30-second test with JS disabled entirely.
- Reading experience is genuinely good in plain HTML. If it isn't, no amount of 3D will save it.
- Zero horizontal overflow at 375px.

> **CHECKPOINT 2 — Non-3D portfolio complete.** This is already a shippable portfolio. Report and stop.

---

## Phase 5 — Hero & boot sequence (DOM only, no 3D)

**Goal:** A first impression that works without WebGL.

Build:
- **Boot sequence** — strict rules:
  - Max 800ms. Skippable by any key, click, or scroll.
  - Runs **once per session** (`sessionStorage`), never on internal navigation.
  - Fully skipped under `prefers-reduced-motion`.
  - The hero content is in the DOM behind it the whole time — the boot is an overlay, never a gate. A crawler and a screen reader see the hero immediately.
- **Hero:** `I BUILD THINGS AT THE INTERSECTION OF AI × PRODUCT × BUSINESS.` staged reveal, secondary line, `ENTER THE LAB` + `EXPLORE WORK` CTAs.
- **Placeholder core visual:** animated CSS/SVG composition where the 3D core will later live. This is the permanent WebGL fallback — build it properly now, not as a throwaway.
- Below the fold: a compressed version of the whole site — featured work, thinking, about teaser, contact. The homepage must stand alone.

**Exit:** Hero passes the 5-second test ("Who is this person?" → "AI, product and business"). LCP < 2.0s on simulated 4G.

---

## Phase 6 — Motion layer

**Goal:** Premium feel without motion sickness.

Build:
- GSAP + ScrollTrigger. Motion tokens only — no ad-hoc durations or easings.
- Reusable text effects: `RevealText`, `SplitText`, `CharacterReveal`, `MaskReveal`. `ScrambleText` sparingly, chrome only.
- Scroll reveals for sections; parallax on selected images only.
- Custom cursor — desktop with fine pointer only (`@media (pointer: fine)`), states: default · VIEW · OPEN · INTERACT · DRAG. **Never replaces or hides the native focus outline.**
- Magnetic behaviour on exactly four things: primary CTA, contact CTA, project card CTA, palette trigger.
- Page transitions: fast (≤400ms), non-blocking, never delaying the first paint of the destination.

**Rules:**
- No smooth-scroll library. Native scroll only.
- Max **two** pinned ScrollTrigger sections site-wide.
- Every ScrollTrigger must `refresh()` correctly on resize and orientation change — test it.
- Under `prefers-reduced-motion`: all transforms become opacity fades ≤150ms; parallax, magnetics and custom cursor off; content identical.

**Exit criteria:**
- 60fps scroll on desktop, ≥30fps on a throttled 4× CPU profile.
- Reduced-motion pass: every piece of content still reachable and readable.
- No layout shift from any animation (CLS < 0.1).

> **CHECKPOINT 3 — Motion complete.**

---

## Phase 7 — Launch prep & deploy

Build:
- SEO: per-route metadata, canonical, sitemap, robots, JSON-LD `Person` schema.
- Custom OG image (`ADITYA LAB / AI × PRODUCT × BUSINESS / BUILD · EXPERIMENT · ITERATE`) — verify it in the LinkedIn and X preview inspectors.
- Favicon set: `A` / `AL` mark, all sizes, `manifest.json`.
- Analytics: privacy-respecting (Vercel Analytics or Plausible — no cookie banner needed). Events per `QA_AND_PERFORMANCE.md`. No PII.
- Error monitoring (Sentry or Vercel equivalent).
- Full accessibility pass — `QA_AND_PERFORMANCE.md` §Accessibility.
- Full performance pass — profile before optimising.
- Failure tests: JS off, slow 3G, images failing, reduced motion.
- Deploy to Vercel, connect domain, SSL, env vars, preview deploys on PRs.

> **CHECKPOINT 4 — V1 LIVE.** Report with the live URL, Lighthouse scores, and the outstanding `CONTENT_TODO.md`. **Stop. Do not begin Release 2 until Aditya confirms.**

---

# RELEASE 2 — THE LAB SIGNATURE

## Phase 8 — 3D foundation & quality system

Build:
- R3F `<Canvas>` in a **dynamically imported, client-only chunk**. Zero Three.js bytes in the initial bundle.
- `PerformanceManager`: detects WebGL support, GPU tier, device memory, `prefers-reduced-motion`, and battery saver; resolves quality to `AUTO | HIGH | MEDIUM | LOW`. User-overridable, persisted.
- WebGL failure and context-loss handling: catch, log, swap to the Phase 5 CSS/SVG fallback, show `3D EXPERIENCE UNAVAILABLE — SWITCHING TO LIGHT MODE`.
- `<Canvas aria-hidden="true">` with a real DOM equivalent behind it. The 3D layer is never announced to a screen reader and never holds unique content.
- Camera controller with hard clamps — no free orbit, no motion beyond defined bounds.
- Lighting rig, environment, and material library (core, glass, metal).

**Exit:** With WebGL disabled in devtools, the site is indistinguishable in usefulness from V1. Initial JS unchanged from Phase 7.

---

## Phase 9 — Hero computational core

Build the signature object: a modular computational machine — layered rings, structural frame, data nodes, connection lines, a slow-pulsing energy core. Custom-feeling, not a glowing sphere, brain, or crypto cube.

Interactions: subtle idle drift · pointer parallax (damped, clamped) · node illumination on hover · expansion on click · scroll-linked camera dolly.

Budget: ≤ 60k triangles at HIGH, ≤ 20k at MEDIUM, static fallback at LOW. One bloom pass maximum. Two lights maximum.

> **CHECKPOINT 5 — 3D core complete.**

---

## Phase 10 — Ask the Lab (AI)

Build per `AI_SPEC.md` in full. Summary: server-route-only API access, curated knowledge file as grounding context, strict refusal behaviour, streaming responses, rate limiting, cost caps, cached canned answers for the six suggested questions, graceful `AI CORE TEMPORARILY OFFLINE` fallback that still routes the visitor to the manual content.

> **CHECKPOINT 6 — AI complete.**

---

## Phase 11 — Interactive systems & project visualisation

**This is the highest-signal work in the project.** It is where the site stops describing capability and starts demonstrating it.

Build (2D canvas/SVG first — these do not need WebGL):
- **Automation Engine:** INPUT → DATA → ENRICH → AI → DECISION → AUTOMATION → OUTPUT, with particles travelling the connections and hover detail per node.
- **Neural Core:** capability graph (AI · PRODUCT · AUTOMATION · STRATEGY) where nodes link to real projects.
- **Project process diagrams:** per-project animated flows (e.g. PROBLEM → RESEARCH → SEGMENTATION → STRATEGY → EXECUTION → OUTCOME), driven from project data so they are reusable, not bespoke per page.
- **Strategy Wall:** segmentation, GTM, positioning, customer journey work presented visually.

Every diagram has a static SVG fallback and a text equivalent.

---

## Phase 12 — Build Mode & Lab Log

- **Build Mode:** a toggle that transforms the site into its own technical documentation — stack, architecture diagram, decisions taken, what broke, what was learned. Cheap to build, very high signal for the technical-reviewer test, and it makes the "the portfolio is the project" claim literal.
- **Lab Log:** reverse-chronological entries from `/data/timeline.ts`, filterable by type. Every entry written by Aditya — never generated.

> **CHECKPOINT 7 — V1.5 complete.**

---

# RELEASE 3 — THE FULL LAB

## Phase 13 — Lab environment & stations
Six stations (Workstation · Neural Core · Automation Engine · Strategy Wall · Experiment Table · Communication Terminal) in a dark, minimal, industrial-editorial space. Scroll- and click-driven camera transitions with hard bounds. Every station also reachable as a normal route. Instancing, frustum culling, lazy station loading.

> **CHECKPOINT 8 — Lab complete.**

## Phase 14 — Experiments playground
Interactive, actually-runnable experiments where practical. Statuses IDEA · PROTOTYPE · BUILDING · WORKING · LIVE · ARCHIVED · FAILED. Include at least one `FAILED` with an honest write-up — it is more persuasive than three successes.

## Phase 15 — Easter eggs, sound, physics
`⌘K` discovery hints · `sudo` response · Konami code · hidden `/experiments/hidden` route · bottom-of-page message. Sound default OFF with a visible control. Physics only on draggable artifacts, never global. None of this may interfere with usability or the recruiter path.

## Phase 16 — Full regression, performance & accessibility audit
Full pass of `QA_AND_PERFORMANCE.md` on the whole site. Profile before optimising.

> **CHECKPOINT 9 — V2 complete.**

---

## 3. Rules that apply between every phase

```
BUILD → npm run verify → npm run shot → READ screenshots → FIX → COMMIT
```

- Never begin a phase on a red build.
- Never begin a phase whose content is still placeholders — build the shell, then stop and ask.
- If a phase is taking materially longer than expected, stop and report rather than pushing through half-finished work.
- If an original-spec feature conflicts with the recruiter path in `CLAUDE.md` §2, the recruiter path wins — flag the conflict, do not silently resolve it.
