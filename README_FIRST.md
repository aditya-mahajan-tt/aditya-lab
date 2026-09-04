# READ ME FIRST — how to use this doc set

## What this is

Your specification, restructured into six working documents that Claude Code can actually execute against. The original is excellent as a vision document and hard to execute as-is: it describes 116 topics at roughly equal weight, has no launch gate, and asks Claude Code to "inspect the result" when it cannot see a screen.

## Setup (5 minutes)

```bash
mkdir aditya-lab && cd aditya-lab
git init
# copy all seven .md files into the repo root
code .
claude
```

Then in Claude Code:

```
Read CLAUDE.md, PLAN.md and CONTENT_INTAKE.md. Confirm you understand the
project, the release gates, and the recruiter rule in CLAUDE.md §2.
Then generate CONTENT_TODO.md and tell me exactly what you need from me
before you can start Phase 1.
```

`CLAUDE.md` is loaded automatically at the start of every session, so the rules stay enforced without re-pasting anything.

## The documents

| File | Read when | Purpose |
|---|---|---|
| `CLAUDE.md` | always loaded | Rules, guardrails, definition of done, checkpoint format |
| `PLAN.md` | every phase | Sequence, exit criteria, copy-paste kickoff prompts |
| `ARCHITECTURE.md` | Phases 1–2, 8 | Structure, data models, state, dependencies, fallbacks |
| `DESIGN_SYSTEM.md` | Phases 1, 4–6 | Palette, type scale, spacing, motion, z-index |
| `AI_SPEC.md` | Phase 10 | Grounding, guardrails, cost control, failure modes |
| `CONTENT_INTAKE.md` | Phase 0, then weekly | What only you can supply, and what it blocks |
| `QA_AND_PERFORMANCE.md` | every checkpoint | Budgets, validation tests, accessibility, launch checklist |

## The seventeen changes made to your spec

**Sequencing**
1. A launch gate at Phase 7 — a deployed, recruiter-usable portfolio before any 3D or AI work begins.
2. Content intake moved to Phase 0. Written case studies are the real bottleneck; code should never wait on them mid-build.
3. AI and the interactive system diagrams moved *ahead* of the full 3D environment — they demonstrate the capability you're actually positioning on.
4. Build Mode moved earlier. It's cheap, and it's what makes "the portfolio is the project" literally true.

**Executability**
5. A verification harness in Phase 1 (Playwright screenshots + console-error assertions), so "inspect the result" becomes a real step rather than an assumption.
6. Every quality claim converted to a number that can fail a build.
7. Checkpoint report format fixed, so each stop produces comparable information.
8. Branch-per-phase and tag-per-checkpoint, so a bad phase is revertible.

**Risk**
9. Placeholder tokens now fail the production build — `[BIO_REQUIRED]` can never ship.
10. Zod validation on `/data`, so bad content fails at build time rather than in a recruiter's browser.
11. "Ask Aditya" reframed as a third-person Lab Assistant. An LLM speaking as you, to someone evaluating you for a role, is the one failure mode with real consequences.
12. Full AI guardrail spec: injection handling, output verification, spend caps, offline fallback, anonymous question logging.
13. Boot sequence constrained — 800ms, skippable, once per session, never a gate in front of content.

**Craft**
14. A concrete palette, type scale, spacing system and motion tokens. Your spec specified particle systems in detail and typography not at all; typography and colour are what decide whether the site reads as "incredible" in the first second.
15. Accessibility made mechanical: `aria-hidden` on the canvas, the ARIA combobox pattern for the palette, focus rings that survive the custom cursor.
16. Dependency list settled with reasons, including what to *exclude* — no second animation library, no smooth-scroll library, no vector database for a 20k-token corpus.
17. `zustand` added deliberately: React Context across the R3F reconciler boundary is a known source of re-render pain.

## One strategic note

Your spec leans hard on a six-station 3D world as the signature. That is a **creative-developer** signal, and it takes months. You're positioning as **AI × Product × Business**.

The things on this site that will actually move a hiring decision are the case studies, the thinking framework, the working AI assistant, and Build Mode explaining your own architecture. One excellent 3D hero object gives you the visual "wow" at a fraction of the cost; the full Lab environment is a Release 3 reward, not a launch requirement.

Build the Lab because you want to build it. Just don't let it stand between you and a live site.
