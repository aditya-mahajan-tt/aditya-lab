# CLAUDE.md — ADITYA LAB

> This file is loaded automatically at the start of every Claude Code session in this repo.
> It contains rules that apply to **all** work. The build sequence lives in `PLAN.md`.

---

## 1. What this project is

**ADITYA LAB** — an interactive personal portfolio for Aditya Mahajan, positioned as a *digital laboratory*.

Owner: Product Manager (Turbotork), PGP TBM at Masters' Union, engineering degree (BITS Pilani), former tech co-founder.
Positioning: **AI × Product × Business** — a curious builder who combines technology and business to solve problems.

The site must prove that claim by existing, not by asserting it.

**Stack:** Next.js (App Router) · React · TypeScript · Tailwind · GSAP · Three.js / React Three Fiber · Vercel.

---

## 2. The single most important rule

**A recruiter must be able to find the resume, one real project, and the contact link within 30 seconds — on a mid-range phone, with JavaScript-heavy features disabled or failing.**

Every creative decision is subordinate to this. If a scene, transition, gate, or animation delays that path, it is wrong and gets cut or shortened. No exceptions, no negotiation.

---

## 3. Non-negotiable principles

1. **Content is the product; effects are the packaging.** A beautiful empty portfolio is a failure. Do not build effects for sections whose content is still a placeholder.
2. **Progressive enhancement, always.** HTML/CSS first → React → motion → 3D → AI. Every layer degrades to the one below it without losing information.
3. **Every animation must justify itself.** If it does not communicate meaning, aid discovery, or demonstrate a capability, delete it.
4. **Never invent personal facts.** No fabricated companies, clients, metrics, dates, awards, or capabilities. Use the placeholder system (§7) and stop to ask.
5. **Never let 3D become the only route to content.** Every station, artifact, and node in the 3D layer has a plain DOM route that works with WebGL off.
6. **Ship small, ship often.** Working deployed increment > impressive local branch.
7. **Accessibility and performance are acceptance criteria, not a later phase.** They are checked at every checkpoint, not at Phase 15.

---

## 4. Definition of done

Compiling is not done. `npm run build` passing is not done.

A feature is done when **all** of the following are true:

- [ ] Implemented and integrated with existing systems (not a parallel island)
- [ ] Content comes from `/data`, never hardcoded in a component
- [ ] Renders correctly at 375px, 768px, 1280px, 1920px
- [ ] Zero console errors and zero React warnings in dev and prod builds
- [ ] Keyboard-operable; visible focus ring; no hover-only critical information
- [ ] Behaves correctly with `prefers-reduced-motion: reduce`
- [ ] Has a defined loading state, empty state, and error state
- [ ] Does not regress the performance budget in `QA_AND_PERFORMANCE.md`
- [ ] Verified by the self-verification loop below — not assumed

---

## 5. Self-verification loop (mandatory)

You cannot see the screen. Do not claim something "looks good" or "works" without evidence. After every meaningful change, run the verification script and read its output:

```bash
npm run verify        # typecheck + lint + build + playwright smoke + console-error check
npm run shot          # captures screenshots to .screenshots/ at 4 breakpoints
```

`npm run shot` writes PNGs. **Read them with the Read tool** — do not describe a UI you have not looked at.

Rules:
- If `verify` fails, fix it before doing anything else. Never stack a new feature on a red build.
- If you cannot verify something programmatically (subjective visual quality, feel of an animation), say so explicitly and ask Aditya to look. Do not silently approve your own work.
- Report console errors verbatim. Do not summarise them away.

---

## 6. Working rhythm

```
READ PLAN.md phase  →  BUILD smallest slice  →  npm run verify  →  READ screenshots
   →  FIX  →  COMMIT  →  next slice  →  ... →  CHECKPOINT REPORT  →  wait for Aditya
```

- One git branch per phase: `phase/03-navigation`. Tag at each checkpoint: `checkpoint-2`.
- Commit at every green slice. Small commits, imperative messages.
- **Stop at every checkpoint listed in `PLAN.md` and report.** Do not roll into the next phase unprompted.

Checkpoint report format:

```
CHECKPOINT N — <name>
BUILT:        <what now exists>
CHANGED:      <what was modified or refactored>
VERIFIED:     <commands run + result; screenshots reviewed>
KNOWN ISSUES: <honest list, including things you could not verify>
BUDGET:       <bundle size, LCP, any budget movement>
BLOCKED ON:   <content or decisions needed from Aditya>
NEXT:         <next phase, first 3 actions>
```

---

## 7. Placeholder system

Never write filler prose. Never write lorem ipsum. Never invent a metric.

When content is missing, emit an explicit token in the data layer:

```ts
summary: "[PROJECT_SUMMARY_REQUIRED]",
outcome: "[PROJECT_OUTCOME_REQUIRED]",
```

Rules:
- Token format: `[UPPER_SNAKE_REQUIRED]`.
- `scripts/check-placeholders.ts` runs in `npm run verify` and **fails the production build** if any `_REQUIRED` token exists in `/data` when `NODE_ENV=production`. This is deliberate — placeholders must never reach the live site.
- In dev, placeholders render in a visible amber outline so they are impossible to miss.
- Maintain `CONTENT_TODO.md` at the repo root: an auto-generated list of every outstanding placeholder, regenerated by the same script.

---

## 8. Hard stops — ask Aditya, do not decide

Stop and ask when you need:

- Any biographical fact, date, employer detail, or education detail not already in `/data/about.ts`
- Any project outcome, metric, client name, or result
- Any external link (LinkedIn, GitHub, email, resume URL, live project URL)
- Any image, screenshot, video, or logo
- Permission to add a dependency not listed in `ARCHITECTURE.md` §Dependencies
- Permission to change the visual direction, palette, or type scale in `DESIGN_SYSTEM.md`
- Anything that would delay the 30-second recruiter path

---

## 9. Anti-patterns — do not do these

- Building the full 3D Lab environment before the non-3D site is deployed and usable
- A boot/intro sequence that blocks content for more than 800ms, or replays on every navigation
- Scroll hijacking, scroll trapping, aggressive snap, or a smooth-scroll library added "for feel"
- Custom cursor that hides or replaces the native focus outline
- `z-index: 9999` anywhere — use the z-index scale in `DESIGN_SYSTEM.md`
- Two animation libraries doing the same job (GSAP is the choice; do not also add Framer Motion)
- Project copy living inside `.tsx` components
- Shaders, physics, sound, or easter eggs before Checkpoint 6
- Adding a dependency to solve something the existing stack solves cleanly
- Marking a task complete because the code compiles

---

## 10. Tone of the product

System language for interface chrome: `SYSTEM · STATUS · ONLINE · INPUT · OUTPUT · BUILD · TEST · ITERATE · ARCHIVE · PROTOCOL`.

Human language for substance: curious, building, breaking, learning.

Position Aditya as a curious builder who connects technology and business — **never** as a master of everything. Confidence without inflation. Admitted failures (a `FAILED` experiment status) are a feature, not a liability.

---

## 11. Reference documents

| File | Contains |
|---|---|
| `PLAN.md` | Phase sequence, exit criteria, checkpoints, kickoff prompts |
| `ARCHITECTURE.md` | File structure, data models, state, 3D architecture, dependencies |
| `DESIGN_SYSTEM.md` | Palette, type scale, spacing, motion tokens, z-index, cursor |
| `AI_SPEC.md` | Ask-the-Lab assistant: grounding, guardrails, cost, failure modes |
| `CONTENT_INTAKE.md` | Everything Aditya must supply, and which phase it blocks |
| `QA_AND_PERFORMANCE.md` | Budgets, validation tests, accessibility checklist, browser matrix |
| `CONTENT_TODO.md` | Auto-generated outstanding placeholders |
