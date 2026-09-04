# ADITYA LAB

An interactive personal portfolio positioned as a digital laboratory.
**AI × Product × Business.**

---

## Quick start

```bash
npm install
npx playwright install chromium   # once, for the verification harness
cp .env.example .env.local
npm run dev                       # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run verify` | **The gate.** typecheck → lint → placeholders → build → bundle budgets → e2e |
| `npm run verify -- --fast` | Same, skipping e2e (mid-iteration only) |
| `npm run shot` | Screenshots every route at 375/768/1280/1920 into `.screenshots/` |
| `npm run check:placeholders` | Lists unfilled content tokens, regenerates `CONTENT_TODO.md` |
| `npm run analyze` | Bundle analyzer |

Nothing is "done" until `npm run verify` is green **and** you have looked at the
screenshots. See `CLAUDE.md` §5.

## Documentation

Read these in order. `CLAUDE.md` is loaded automatically by Claude Code.

| File | Purpose |
|---|---|
| `README_FIRST.md` | How the doc set works, and what changed from the original spec |
| `CLAUDE.md` | Rules, guardrails, definition of done, checkpoint format |
| `PLAN.md` | Phase sequence, exit criteria, copy-paste kickoff prompts |
| `ARCHITECTURE.md` | Structure, data models, state, dependencies, fallbacks |
| `DESIGN_SYSTEM.md` | Palette, type scale, spacing, motion tokens, z-index |
| `AI_SPEC.md` | Ask the Lab — grounding, guardrails, cost control |
| `CONTENT_INTAKE.md` | What Aditya must supply, and what each item blocks |
| `QA_AND_PERFORMANCE.md` | Budgets, validation tests, accessibility, launch checklist |
| `CONTENT_TODO.md` | Auto-generated list of outstanding placeholders |

## Current state

**Phase 1 (foundation + verification harness) and Phase 2 (content system) are
complete and verified.** Phase 3 (navigation + command palette) is next — see
`PLAN.md`.

What exists:

- Next.js 15 App Router, TypeScript strict, Tailwind v4 driven entirely by design tokens
- Self-hosted variable fonts (2 files, 88 KB, no third-party request, no build-time fetch)
- All nine routes rendering real content from `/data`, statically generated
- Zod-validated content layer — invalid content fails the build
- Placeholder system: `[X_REQUIRED]` tokens render visibly in dev, fail the production build
- Verification harness: 72 Playwright assertions covering console errors, horizontal
  overflow, heading order, alt text, skip link, keyboard nav, and a JS-disabled render
- Bundle guard: secret scan, Three.js isolation check, initial-JS budget
- GitHub Actions running the whole gate on every push

Measured on this build: **104 KB gzip initial JS**, 16 static pages, zero console
errors, zero horizontal overflow at any breakpoint.

## Content

The site is content-driven. Adding a project means adding one object to
`data/projects.ts` — nothing else changes.

Every `[X_REQUIRED]` token in `/data` is content only Aditya can supply.
`CONTENT_INTAKE.md` explains what each one needs and how long it should be.
Run `npm run check:placeholders` for the current list.

## Notes

- `PLAYWRIGHT_CHROMIUM_PATH` is an escape hatch for CI images that ship their own
  Chromium. Leave it unset locally.
- The e2e suite and the screenshot script each use their own port (4322, 4321) so a
  dev server on 3000 can never cause them to test a stale build.
- iOS Safari coverage needs `npx playwright install webkit`, then
  `PLAYWRIGHT_WEBKIT=1 npx playwright test --project=ios`.
