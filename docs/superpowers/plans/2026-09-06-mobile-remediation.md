# Mobile Remediation (Workstream 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the mobile defects found in the §1–§2 audit of
`docs/superpowers/specs/2026-09-06-mobile-audit-and-orbital-hero-design.md`
so the CLAUDE.md §2 thirty-second recruiter path works on a phone: a
compact, scrollable menu that reaches CONTACT/RESUME quickly, no
sub-44px tap targets, real content (not empty bands) on `/systems` and
`/work/[slug]` below 768px, a collapsed Ask-the-Lab layout, and a
placeholder guard that actually blocks the production build.

**Architecture:** Seven independent, additive fixes across existing
components — no new components, no schema changes, no new dependencies.
Each fix is a Tailwind class change or a small pure-function addition to
an existing file, verified by a Playwright assertion at a fixed
375×812 viewport (matching the audit's iPhone 13 profile) added to a new
`e2e/mobile-audit.spec.ts`.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS 4,
Playwright + `@axe-core/playwright` (existing `e2e/` suite).

## Global Constraints

- Content lives in `/data`, never hardcoded in a component (CLAUDE.md §4). None of these tasks add content — they change layout/behavior only.
- Zero console errors and zero React warnings in dev and prod builds (CLAUDE.md §4).
- Keyboard-operable; visible focus ring; no hover-only critical information (CLAUDE.md §4).
- Must behave correctly under `prefers-reduced-motion: reduce` (CLAUDE.md §4) — none of these tasks introduce new motion, so this is a non-regression check, not new work.
- No `z-index` literal outside the scale in `app/globals.css`'s `:root` block (CLAUDE.md §9). Any z-index touched must reuse an existing `--z-*` token.
- GSAP is the only animation library; do not add another (CLAUDE.md §9). No task here adds animation.
- No new dependency — `ARCHITECTURE.md §Dependencies` is closed for this change; Tailwind's built-in `line-clamp` utility (no plugin required since v3.3) is the only new utility used, not a new package.
- Every task must leave `npm run verify` green before its commit.

---

### Task 1: Gate the production build on the placeholder check

**Files:**
- Modify: `package.json:6-18` (scripts block)
- Test: `e2e/mobile-audit.spec.ts` (new file — created in this task, extended by later tasks)

**Interfaces:**
- Consumes: `scripts/check-placeholders.mjs`'s existing `--strict` flag (already implemented — exits 1 when any `[..._REQUIRED]` or `[AI_DRAFT_REVIEW]` token is found in `/data`).
- Produces: nothing later tasks depend on. Fully self-contained.

This is the fix for finding D1: `npm run build` currently exits 0 even
with `[PROJECT_004_TITLE_REQUIRED]` live in `/data`, because
`check:placeholders` only runs inside `npm run verify`, never inside
`npm run build` itself. CLAUDE.md §7 requires the production build to
fail when a placeholder token is present. npm automatically runs a
`prebuild` script before `build` for any `npm run build` invocation
(this is npm's standard lifecycle behavior, not something wired up by
this project) — including on Vercel, which runs `npm run build` for an
auto-detected Next.js project. Adding `prebuild` closes the gap without
touching the deploy configuration.

- [ ] **Step 1: Reproduce the bug — confirm `npm run build` currently succeeds with a placeholder present**

```bash
grep -n "PROJECT_004_TITLE_REQUIRED" data/projects.ts
npm run build
echo "exit code: $?"
```

Expected: the grep finds the token, and the build still prints "exit
code: 0" — confirming the gap before fixing it.

- [ ] **Step 2: Add the `prebuild` script**

In `package.json`, the `scripts` block currently reads:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "check:placeholders": "node scripts/check-placeholders.mjs",
    "check:bundle": "node scripts/check-bundle.mjs",
    "test:e2e": "playwright test",
    "shot": "node scripts/screenshots.mjs",
    "verify": "node scripts/verify.mjs",
    "analyze": "ANALYZE=true next build",
    "ai:generate-canned-answers": "node scripts/generate-canned-answers.mjs"
  },
```

Add a `prebuild` entry immediately above `"build"`:

```json
  "scripts": {
    "dev": "next dev",
    "prebuild": "node scripts/check-placeholders.mjs --strict",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "check:placeholders": "node scripts/check-placeholders.mjs",
    "check:bundle": "node scripts/check-bundle.mjs",
    "test:e2e": "playwright test",
    "shot": "node scripts/screenshots.mjs",
    "verify": "node scripts/verify.mjs",
    "analyze": "ANALYZE=true next build",
    "ai:generate-canned-answers": "node scripts/generate-canned-answers.mjs"
  },
```

- [ ] **Step 3: Confirm `npm run build` now fails with the placeholder present**

```bash
npm run build
echo "exit code: $?"
```

Expected: the `prebuild` step runs first, prints `✖ Placeholders and
unreviewed AI drafts must not ship to production...`, and the command
exits non-zero — `next build` itself must never start.

- [ ] **Step 4: Confirm a clean `/data` still builds — temporarily**

This project's `/data` currently has real, intentional placeholders
(`[PROJECT_004_TITLE_REQUIRED]`, several `[AI_DRAFT_REVIEW]` entries) —
do not remove or edit any of them; that is content work for Aditya, not
this task (per CLAUDE.md §7/§8 and the spec's D2 note). Instead, verify
the mechanism in isolation:

```bash
node scripts/check-placeholders.mjs --strict; echo "check exit: $?"
```

Expected: `check exit: 1` right now (the repo has real placeholders).
This confirms the script's own exit behavior is correct; Step 3 already
confirmed it correctly blocks `npm run build`. Do not attempt to force a
passing `npm run build` locally — that would require editing `/data`
content, which is out of scope.

- [ ] **Step 5: Create `e2e/mobile-audit.spec.ts` with a header and one placeholder test**

This file is the home for every Playwright assertion this plan adds.
Create it now with a fixed 375×812 viewport (the audit's iPhone 13
profile) so every test in this plan runs under deterministic conditions
regardless of which `playwright.config.ts` project executes it:

```typescript
import { test, expect } from "@playwright/test";

/**
 * Regression suite for docs/superpowers/specs/2026-09-06-mobile-audit-and-orbital-hero-design.md §2.
 * Fixed at 375×812 (iPhone 13) to match the audit's conditions regardless
 * of which playwright.config.ts project runs this file.
 */
test.use({ viewport: { width: 375, height: 812 } });

test("check:placeholders --strict exits non-zero when data has an outstanding token", async () => {
  const { spawnSync } = await import("node:child_process");
  const run = spawnSync("node", ["scripts/check-placeholders.mjs", "--strict"], {
    encoding: "utf8",
  });
  // This repo currently has real, intentional placeholders (CLAUDE.md §7/§8) —
  // this assertion documents that the guard is armed, not that content is done.
  expect(run.status).not.toBe(0);
});
```

- [ ] **Step 6: Run the new test**

```bash
npx playwright test e2e/mobile-audit.spec.ts
```

Expected: 1 passed.

- [ ] **Step 7: Commit**

```bash
git add package.json e2e/mobile-audit.spec.ts
git commit -m "fix: gate production build on the placeholder/draft check"
```

---

### Task 2: Fix the blind horizontal-overflow check in the screenshot script

**Files:**
- Modify: `scripts/screenshots.mjs`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing later tasks depend on.

Finding from spec §1.2: `app/globals.css:130` sets
`body { overflow-x: hidden }`, which means
`document.documentElement.scrollWidth > window.innerWidth` (the check in
`scripts/screenshots.mjs`) can never be true — `overflow-x: hidden`
clips `scrollWidth` to the viewport width at the `html`/`body` level.
The check has been silently passing regardless of whether any element
inside actually overflows. Replace it with a per-element bounding-box
check, which `overflow-x: hidden` does not affect (an element's own
`getBoundingClientRect()` still reports its true position even if the
page clips it from view).

- [ ] **Step 1: Read the current check**

```bash
grep -n "overflow" scripts/screenshots.mjs
```

Expected output includes:

```
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    if (overflow) problems.push(`horizontal overflow: ${route} @ ${width}px`);
```

- [ ] **Step 2: Replace it with a per-element check**

In `scripts/screenshots.mjs`, find:

```javascript
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    if (overflow) problems.push(`horizontal overflow: ${route} @ ${width}px`);
```

Replace with:

```javascript
    // body { overflow-x: hidden } (app/globals.css) clips
    // documentElement.scrollWidth to the viewport width, so that check can
    // never fire. A per-element bounding-box check is not affected by the
    // clip — getBoundingClientRect() still reports an element's true
    // position even when the page hides the resulting scrollbar.
    const overflowingElements = await page.evaluate(() => {
      const vw = window.innerWidth;
      const offenders = [];
      for (const el of document.querySelectorAll("body *")) {
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        if (rect.right > vw + 1 || rect.left < -1) {
          const cls = typeof el.className === "string" && el.className
            ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
            : "";
          offenders.push(`${el.tagName.toLowerCase()}${cls} [${Math.round(rect.left)}, ${Math.round(rect.right)}]`);
        }
      }
      return offenders;
    });
    for (const offender of overflowingElements) {
      problems.push(`horizontal overflow: ${route} @ ${width}px — ${offender}`);
    }
```

- [ ] **Step 3: Run it against the current build and confirm it still reports clean**

```bash
npm run build
npm run shot
echo "exit: $?"
```

Expected: `exit: 0` and the closing line `No console errors, no
horizontal overflow.` — the per-element check finding nothing confirms
this project has no real overflow today (consistent with the audit in
§1.1), and that the new check runs without throwing.

- [ ] **Step 4: Prove the new check actually detects a real offender (then revert the prove-it change)**

```bash
sed -i.bak 's/<h1$/<h1 style={{ width: "2000px" }}/' app/page.tsx
npm run build
npm run shot
echo "exit: $?"
mv app/page.tsx.bak app/page.tsx
```

Expected: `exit: 1`, and the printed problem list includes a line
starting with `horizontal overflow: home @` naming the `h1`. This
confirms the replaced check actually fires, unlike the one it replaces.
The `mv` at the end restores `app/page.tsx` exactly — verify with
`git status` that it shows no diff for that file before continuing.

- [ ] **Step 5: Commit**

```bash
git status --short  # confirm app/page.tsx shows no changes
git add scripts/screenshots.mjs
git commit -m "fix: make the screenshot overflow check see past overflow-x: hidden"
```

---

### Task 3: Fix sub-44px tap targets

**Files:**
- Modify: `components/layout/Header.tsx:47-52` (wordmark link)
- Modify: `components/layout/Footer.tsx:19-28` (social links), `:29-37` (Contact link)
- Modify: `app/page.tsx` (the "See the framework →" and "Full background →" links — exact lines confirmed in Step 1)
- Modify: `app/work/[slug]/page.tsx` (the "← Previous" / "Next →" links — exact lines confirmed in Step 1)
- Modify: `app/resume/page.tsx` (the "Download it instead" link — exact lines confirmed in Step 1)
- Modify: `components/ai/AskTheLab.tsx:74-82` (the `✕` close button)
- Test: `e2e/mobile-audit.spec.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing later tasks depend on.

This is the fix for finding A3. Every listed element is a real, visible,
hit-testable control whose rendered height (in one case, width) is under
the 44px minimum. (The audit's initial pass also flagged the ten
`NavOverlay` route links at similar small sizes — those were verified
false positives: they already carry `min-h-11` in their own markup
today, and the measurement was of the closed, non-hit-testable overlay
panel. They need no change and are not listed here.)

- [ ] **Step 1: Confirm each element's current markup and exact location**

```bash
grep -n "Aditya Lab" components/layout/Header.tsx
grep -n "font-mono text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-accent" components/layout/Footer.tsx
grep -n "See the framework\|Full background" app/page.tsx
grep -n "Previous\|Next →" "app/work/[slug]/page.tsx"
grep -n "Download it instead" app/resume/page.tsx
grep -n "h-8 w-8" components/ai/AskTheLab.tsx
```

Confirm each grep returns at least one line; note the exact line numbers
printed, since file line numbers may have drifted from the audit.

- [ ] **Step 2: Fix the header wordmark**

In `components/layout/Header.tsx`, find:

```tsx
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-text transition-colors duration-[var(--duration-fast)] hover:text-accent"
        >
          Aditya Lab
        </Link>
```

Replace with:

```tsx
        <Link
          href="/"
          className="flex min-h-11 items-center font-mono text-xs uppercase tracking-widest text-text transition-colors duration-[var(--duration-fast)] hover:text-accent"
        >
          Aditya Lab
        </Link>
```

- [ ] **Step 3: Fix the footer social and Contact links**

In `components/layout/Footer.tsx`, find both occurrences of this
className (one on the mapped social links, one on the trailing Contact
`<li>`):

```tsx
                className="font-mono text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-accent"
```

Replace both with:

```tsx
                className="flex min-h-11 items-center font-mono text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-accent"
```

- [ ] **Step 4: Fix "See the framework →" and "Full background →" on the home page**

In `app/page.tsx`, find the two links (each currently something close
to `className="mt-6 inline-block font-mono text-xs ..."` per the audit's
measured `a.mt-6.inline-block.font-mono` selector). For each, change
`inline-block` to `inline-flex min-h-11 items-center`. Concretely, find:

```tsx
              className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-accent transition-colors duration-[var(--duration-fast)] hover:text-accent-dim"
```

(this className, or one matching it closely, appears twice — once for
each link) and replace both with:

```tsx
              className="mt-6 inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-widest text-accent transition-colors duration-[var(--duration-fast)] hover:text-accent-dim"
```

If the exact className string found in Step 1 differs from this (e.g.
different color token), keep every other class unchanged and only
replace `inline-block` with `inline-flex min-h-11 items-center`.

- [ ] **Step 5: Fix "← Previous" / "Next →" on the project detail page**

In `app/work/[slug]/page.tsx`, find the two links (matching the audit's
`a.label.hover:text-accent` and `a.label.ml-auto.hover:text-accent`
selectors). Add `flex min-h-11 items-center` to each, preserving every
other class. For example, if the current markup is:

```tsx
            <Link href={`/work/${previous.slug}`} className="label hover:text-accent">
              ← Previous
            </Link>
```

change it to:

```tsx
            <Link href={`/work/${previous.slug}`} className="label flex min-h-11 items-center hover:text-accent">
              ← Previous
            </Link>
```

and equivalently for the "Next →" link (which carries `ml-auto`
alongside `label` and `hover:text-accent` — keep `ml-auto` in place,
just add `flex min-h-11 items-center`).

- [ ] **Step 6: Fix "Download it instead" on the resume page**

In `app/resume/page.tsx`, find the link matching the audit's
`a.text-accent.underline` selector. Add `inline-flex min-h-11
items-center`, preserving `underline`. For example:

```tsx
        <Link href={resumeUrl} className="text-accent underline">
          Download it instead
        </Link>
```

becomes:

```tsx
        <Link href={resumeUrl} className="inline-flex min-h-11 items-center text-accent underline">
          Download it instead
        </Link>
```

- [ ] **Step 7: Fix the Ask-the-Lab close button**

In `components/ai/AskTheLab.tsx`, find:

```tsx
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close Ask the Lab"
              data-cursor="interact"
              className="flex h-8 w-8 items-center justify-center text-text-faint transition-colors duration-[var(--duration-fast)] hover:text-text"
            >
              ✕
            </button>
```

Replace `h-8 w-8` with `h-11 w-11`:

```tsx
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close Ask the Lab"
              data-cursor="interact"
              className="flex h-11 w-11 items-center justify-center text-text-faint transition-colors duration-[var(--duration-fast)] hover:text-text"
            >
              ✕
            </button>
```

- [ ] **Step 8: Write the regression test**

Append to `e2e/mobile-audit.spec.ts`:

```typescript
test("no interactive element renders under 44px in either dimension at 375px", async ({ page }) => {
  const routes = ["/", "/work/gostops-gtm", "/resume", "/contact"];
  const offenders: string[] = [];

  for (const route of routes) {
    await page.goto(route, { waitUntil: "networkidle" });

    if (route === "/") {
      await page.getByRole("button", { name: "Open Ask the Lab" }).click();
      await expect(page.locator('dialog[aria-label="Ask the Lab"]')).toBeVisible();
    }

    const found = await page.evaluate(() => {
      const isVisible = (el: Element) => {
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
      const bad: string[] = [];
      for (const el of document.querySelectorAll("a, button, [role=button]")) {
        if (!isVisible(el)) continue;
        // sr-only elements (skip link, visually-hidden form controls paired
        // with a visible label) are intentionally smaller than 44px until
        // focused — not a tap-target defect.
        if (getComputedStyle(el).position === "absolute" && el.className.toString().includes("sr-only")) continue;
        const rect = el.getBoundingClientRect();
        if (rect.height < 44 || rect.width < 44) {
          bad.push(`${el.tagName.toLowerCase()} "${(el.textContent || "").trim().slice(0, 30)}" ${Math.round(rect.width)}x${Math.round(rect.height)}`);
        }
      }
      return bad;
    });

    for (const f of found) offenders.push(`${route}: ${f}`);

    if (route === "/") await page.keyboard.press("Escape");
  }

  expect(offenders, offenders.join("\n")).toEqual([]);
});
```

- [ ] **Step 9: Run the test and confirm it passes**

```bash
npm run build
npx playwright test e2e/mobile-audit.spec.ts
```

Expected: 2 passed (the Task 1 test and this one). If it fails, the
failure message lists exactly which element and route — cross-reference
against Steps 2–7 above; a common cause is a `min-h-11`/`min-w-11` class
that didn't take because a conflicting `h-*`/`w-*` utility elsewhere in
the same className wins (Tailwind resolves by source order — search for
a duplicate `h-` or `w-` utility on the same element and remove it).

- [ ] **Step 10: Run full verify and commit**

```bash
npm run verify -- --fast
git add components/layout/Header.tsx components/layout/Footer.tsx app/page.tsx "app/work/[slug]/page.tsx" app/resume/page.tsx components/ai/AskTheLab.tsx e2e/mobile-audit.spec.ts
git commit -m "fix: raise every interactive element to a 44px minimum tap target"
```

---

### Task 4: Fix mobile header chrome — hide ⌘K, border MENU

**Files:**
- Modify: `components/navigation/CommandPalette.tsx:132-142`
- Modify: `components/navigation/NavOverlay.tsx:59-66`
- Test: `e2e/mobile-audit.spec.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing later tasks depend on.

Fix for finding A2. The `⌘K` trigger is a keyboard-only accelerator with
no purpose on a touchscreen with no physical keyboard; hiding it below
`md` is safe because every destination it offers is also reachable from
the menu overlay (Task 5 keeps that overlay's own affordance intact) —
it is not the only route to any content, so this does not violate
CLAUDE.md §3, principle 5. The global `Ctrl/Cmd+K` listener in
`CommandPalette.tsx` is untouched — a Bluetooth keyboard paired to a
phone still works — only the visible button is hidden.

- [ ] **Step 1: Hide the ⌘K trigger below `md`**

In `components/navigation/CommandPalette.tsx`, find:

```tsx
      <button
        ref={magneticTriggerRef}
        type="button"
        onClick={() => {
          setOpen(true);
          analytics.commandPaletteOpen("click");
        }}
        aria-label="Open command palette"
        data-cursor="interact"
        className="flex h-11 items-center gap-1.5 rounded-sm border border-border px-3 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors duration-[var(--duration-fast)] hover:border-border-strong hover:text-text"
      >
```

Replace the `className` with:

```tsx
        className="hidden h-11 items-center gap-1.5 rounded-sm border border-border px-3 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors duration-[var(--duration-fast)] hover:border-border-strong hover:text-text md:flex"
      >
```

- [ ] **Step 2: Give the MENU trigger the same border weight as its siblings**

In `components/navigation/NavOverlay.tsx`, find:

```tsx
      <summary
        aria-controls={panelId}
        className="relative z-[var(--z-palette)] flex min-h-11 cursor-pointer list-none items-center px-3 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors duration-[var(--duration-fast)] marker:hidden hover:text-text [&::-webkit-details-marker]:hidden"
      >
```

Replace the `className` with:

```tsx
        className="relative z-[var(--z-palette)] flex min-h-11 cursor-pointer list-none items-center rounded-sm border border-border px-3 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors duration-[var(--duration-fast)] marker:hidden hover:border-border-strong hover:text-text [&::-webkit-details-marker]:hidden"
      >
```

- [ ] **Step 3: Write the regression test**

Append to `e2e/mobile-audit.spec.ts`:

```typescript
test("the command palette trigger is hidden at 375px but Ctrl+K still opens it", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Open command palette" })).toBeHidden();

  await page.getByRole("button", { name: "Open Ask the Lab" }).focus();
  await page.keyboard.press("Control+k");
  await expect(page.locator('dialog[aria-label="Command palette"]')).toBeVisible();
});

test("MENU carries the same border as its header siblings at 375px", async ({ page }) => {
  await page.goto("/");
  const menuBorder = await page.locator("header summary").evaluate((el) => getComputedStyle(el).borderStyle);
  const askBorder = await page
    .getByRole("button", { name: "Open Ask the Lab" })
    .evaluate((el) => getComputedStyle(el).borderStyle);
  expect(menuBorder).toBe(askBorder);
});
```

- [ ] **Step 4: Run the tests**

```bash
npx playwright test e2e/mobile-audit.spec.ts
```

Expected: 4 passed.

- [ ] **Step 5: Run full verify and commit**

```bash
npm run verify -- --fast
git add components/navigation/CommandPalette.tsx components/navigation/NavOverlay.tsx e2e/mobile-audit.spec.ts
git commit -m "fix: hide the keyboard-only command palette trigger on touch, border MENU to match"
```

---

### Task 5: Fix the mobile menu's wasted space and row bloat

**Files:**
- Modify: `components/navigation/NavOverlay.tsx:77-97`
- Test: `e2e/mobile-audit.spec.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing later tasks depend on.

Fix for finding A1. Three compounding causes, all in the same file:

1. `justify-center` + `py-32` on the outer wrapper vertically centers a
   list taller than the viewport, wasting ~128px of top/bottom padding
   that pushes the whole list down before it's ever seen.
2. The per-item label (`text-2xl`/`text-3xl`) is a bare `<span>`, not a
   heading element, so it does not pick up `app/globals.css`'s
   `h1,h2,h3,h4 { line-height: var(--leading-snug) }` rule and instead
   inherits the body's `line-height: var(--leading-body)` (1.65) —
   nearly 1.65× the intended line height for display type.
3. `py-5` per row, plus a description line that can wrap to two lines
   for the longer nav descriptions, compounds the height further.

All three fixes are `md:`-guarded, so desktop is unaffected.

- [ ] **Step 1: Fix the outer wrapper's vertical centering**

In `components/navigation/NavOverlay.tsx`, find:

```tsx
        <div className="container-lab flex min-h-full flex-col justify-center py-32">
          <p className="label mb-10">SYSTEM · NAVIGATE</p>
```

Replace with:

```tsx
        <div className="container-lab flex min-h-full flex-col justify-start py-8 md:justify-center md:py-32">
          <p className="label mb-6 md:mb-10">SYSTEM · NAVIGATE</p>
```

- [ ] **Step 2: Tighten row padding and label line-height**

In the same file, find:

```tsx
                  <Link
                    href={item.href}
                    className="flex min-h-11 flex-col justify-center gap-1 py-5 transition-colors duration-[var(--duration-fast)] hover:text-accent md:flex-row md:items-baseline md:justify-between md:gap-10"
                  >
                    <span className="font-mono text-[length:var(--text-2xl)] uppercase tracking-[var(--tracking-mono)] md:text-[length:var(--text-3xl)]">
                      {item.label}
                    </span>
                    <span className="text-sm text-text-faint">{item.description}</span>
                  </Link>
```

Replace with:

```tsx
                  <Link
                    href={item.href}
                    className="flex min-h-11 flex-col justify-center gap-1 py-3 transition-colors duration-[var(--duration-fast)] hover:text-accent md:flex-row md:items-baseline md:justify-between md:gap-10 md:py-5"
                  >
                    <span className="font-mono text-[length:var(--text-2xl)] uppercase leading-none tracking-[var(--tracking-mono)] md:text-[length:var(--text-3xl)] md:leading-snug">
                      {item.label}
                    </span>
                    <span className="line-clamp-1 text-sm leading-snug text-text-faint md:line-clamp-none">
                      {item.description}
                    </span>
                  </Link>
```

(`line-clamp-1` visually truncates the description to one line below
`md` — it does not remove the full text from the accessible tree, so
screen readers still read the complete description. `md:line-clamp-none`
restores full wrapping on desktop, matching current behavior exactly.)

- [ ] **Step 3: Write the regression test**

Append to `e2e/mobile-audit.spec.ts`:

```typescript
test("the mobile menu opens directly into content, without a large empty band above it", async ({ page }) => {
  await page.goto("/");
  await page.locator("header summary").click();

  const panel = page.locator('nav[aria-label="Full site"]');
  await expect(panel).toBeVisible();

  const firstItemTop = await panel.locator("a").first().evaluate((el) => el.getBoundingClientRect().top);
  expect(firstItemTop, "first nav item starts too far down the viewport").toBeLessThan(180);
});

test("the full mobile menu is compact enough that CONTACT and RESUME are within a short scroll", async ({ page }) => {
  await page.goto("/");
  await page.locator("header summary").click();

  const panel = page.locator('nav[aria-label="Full site"]');
  await expect(panel).toBeVisible();

  const scrollHeight = await panel.evaluate((el) => el.scrollHeight);
  // Regression guard against reintroducing per-row bloat: the un-tightened
  // menu measured well over 1400px of scrollHeight for these ten items;
  // the tightened version should stay under 950px.
  expect(scrollHeight, `menu content is ${scrollHeight}px tall`).toBeLessThan(950);

  const resumeLink = panel.getByRole("link", { name: /RESUME/ });
  await resumeLink.scrollIntoViewIfNeeded();
  await expect(resumeLink).toBeVisible();
});
```

- [ ] **Step 4: Run the tests**

```bash
npx playwright test e2e/mobile-audit.spec.ts
```

Expected: 6 passed. If the `scrollHeight` assertion fails, read the
printed height, open `/` locally with the mobile viewport, and check
whether a nav description is wrapping to more than one line despite
`line-clamp-1` — this usually means the Tailwind build didn't pick up
the utility; confirm `line-clamp-1` appears in the compiled CSS via
`grep -r "line-clamp-1" .next/static/css/*.css` after a fresh
`npm run build`.

- [ ] **Step 5: Run full verify, read the screenshot, and commit**

```bash
npm run verify -- --fast
npm run shot
```

Read `.screenshots/home-375.png` with the Read tool and confirm the
menu (open the dev server manually if the static screenshot doesn't
capture the open state — this route's screenshot captures the closed
page only) reads as compact rather than sparse.

```bash
git add components/navigation/NavOverlay.tsx e2e/mobile-audit.spec.ts
git commit -m "fix: remove wasted vertical space and per-row bloat in the mobile menu"
```

---

### Task 6: Give `/systems` and `/work/[slug]` a real mobile diagram

**Files:**
- Modify: `components/systems/diagramLayout.ts`
- Modify: `components/systems/SystemDiagramCard.tsx`
- Modify: `components/systems/ProcessDiagram.tsx`
- Test: `e2e/mobile-audit.spec.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `layoutVertical(count, opts)` — a new export from
  `diagramLayout.ts` — is not consumed by any other task in this plan,
  but is the shared primitive both diagram components now import.

Fix for findings B1 and B2. Today, `SystemDiagramCard` degrades below
`md` to a wrapping run of arrow-separated text (breaking the arrow chain
across lines), and `ProcessDiagram` degrades to nothing at all —
confirmed by re-inspecting the mobile audit's `work-detail-375-p1.png`
screenshot, which shows five stacked project sections with no diagram
and no fallback list between them. Both components already share
`diagramLayout.ts`'s `layoutSerpentine`/`edgePoints`/`boundingViewBox`
for their desktop horizontal diagram; this task adds a vertical
counterpart to the same shared file and renders it, unconditionally
present in the DOM, in a sibling `<figure>` shown only below `md` (the
existing horizontal `<figure>` keeps its `hidden md:block` guard
unchanged — this mirrors the codebase's existing pattern of two static,
CSS-toggled blocks rather than JS-driven breakpoint switching, the same
approach `CoreFallback`/`Core` already use for their 2D/3D split).

Node/step detail (the caption below the diagram) is hover-only today on
both components — unreachable on a touchscreen, which is itself a
CLAUDE.md §4 violation ("no hover-only critical information"). This task
adds `onClick` toggling of the same `active` state used by hover, on
both the new vertical diagram and the existing horizontal one, so
tapping a node on any device reveals its detail exactly as hovering does
on desktop.

- [ ] **Step 1: Add `layoutVertical` to `diagramLayout.ts`**

In `components/systems/diagramLayout.ts`, the file currently ends with
`boundingViewBox`. Add a new export immediately after `layoutSerpentine`
(before `edgePoints`):

```typescript
/** Single-column, top-to-bottom node layout for narrow viewports. */
export function layoutVertical(
  count: number,
  opts: Pick<LayoutOptions, "nodeW" | "nodeH" | "rowSpacing">,
): NodePosition[] {
  return Array.from({ length: count }, (_, i) => ({
    x: opts.nodeW / 2 + 10,
    y: opts.nodeH / 2 + 10 + i * opts.rowSpacing,
  }));
}
```

- [ ] **Step 2: Wire the vertical layout into `SystemDiagramCard.tsx`**

In `components/systems/SystemDiagramCard.tsx`, find the import line:

```tsx
import { layoutSerpentine, edgePoints, boundingViewBox } from "./diagramLayout";
```

Replace with:

```tsx
import { layoutSerpentine, layoutVertical, edgePoints, boundingViewBox } from "./diagramLayout";
```

Find the layout constants:

```tsx
const NODE_W = 150;
const NODE_H = 52;
const LAYOUT = { nodeW: NODE_W, nodeH: NODE_H, maxCols: 6, colSpacing: 190, rowSpacing: 120 };
```

Add a mobile row-spacing constant immediately after (a tighter vertical
gap than the desktop layout's, since there is no serpentine turn to
clear):

```tsx
const NODE_W = 150;
const NODE_H = 52;
const LAYOUT = { nodeW: NODE_W, nodeH: NODE_H, maxCols: 6, colSpacing: 190, rowSpacing: 120 };
const MOBILE_ROW_SPACING = 90;
```

Find where `positions` is computed:

```tsx
  const positions = layoutSerpentine(diagram.nodes.length, LAYOUT);
  const { minX, minY, width, height } = boundingViewBox(positions, NODE_W, NODE_H);
```

Replace with (computing both layouts — the component now renders both
figures, CSS-toggled, so both viewBoxes are needed):

```tsx
  const positions = layoutSerpentine(diagram.nodes.length, LAYOUT);
  const { minX, minY, width, height } = boundingViewBox(positions, NODE_W, NODE_H);

  const mobilePositions = layoutVertical(diagram.nodes.length, {
    nodeW: NODE_W,
    nodeH: NODE_H,
    rowSpacing: MOBILE_ROW_SPACING,
  });
  const mobileBox = boundingViewBox(mobilePositions, NODE_W, NODE_H);
```

Find the closing of the desktop `<figure>` block — specifically the
comment and opening tag:

```tsx
      {/* Below `md` there isn't room for {diagram.nodes.length} legible columns — the
          plain list below is the full text equivalent at every size regardless
          (DESIGN_SYSTEM.md §9), matching ProcessDiagram/ThinkingFramework. */}
      <figure className="mt-8 hidden md:block">
```

Replace the comment (the plain list it refers to is removed later in
this step, so the comment is now inaccurate) and keep the tag as-is:

```tsx
      {/* Desktop: the horizontal serpentine layout with room for
          {diagram.nodes.length} legible columns. Below `md`, the sibling
          figure right after this one renders the same nodes stacked
          vertically instead — see the mobile figure below. */}
      <figure className="mt-8 hidden md:block">
```

Now find the node-rendering `<g>` inside that same desktop `<figure>`:

```tsx
              <g
                key={node.label}
                className="group cursor-default"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive((a) => (a === i ? null : a))}
              >
```

Replace with (adding tap support alongside hover):

```tsx
              <g
                key={node.label}
                className="group cursor-default"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive((a) => (a === i ? null : a))}
                onClick={() => setActive((a) => (a === i ? null : i))}
              >
```

Find the end of the desktop `<figure>` (its closing tag and the
`figcaption` that follows it, still inside the same `<figure>`):

```tsx
        <figcaption className="label mt-4 min-h-[1.5em]">
          {activeNode?.detail ?? "Hover a stage for detail."}
        </figcaption>
      </figure>

      <ol className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-widest md:hidden">
        {diagram.nodes.map((node, i) => (
          <li key={node.label} className="flex items-center gap-3">
            <span className="text-text">{node.label}</span>
            {i < diagram.nodes.length - 1 && <span className="text-text-faint">→</span>}
          </li>
        ))}
      </ol>
```

Replace the whole block — including deleting the `<ol>` text fallback
entirely, since the new mobile figure below replaces it with a real
diagram — with:

```tsx
        <figcaption className="label mt-4 min-h-[1.5em]">
          {activeNode?.detail ?? "Hover a stage for detail."}
        </figcaption>
      </figure>

      {/* Mobile: the same nodes stacked in a single column top-to-bottom,
          using layoutVertical instead of the desktop serpentine. Tap a
          node for its detail — there is no hover on touch. */}
      <figure className="mt-8 md:hidden">
        <svg
          viewBox={`${mobileBox.minX} ${mobileBox.minY} ${mobileBox.width} ${mobileBox.height}`}
          role="img"
          aria-label={`${diagram.title}: ${diagram.nodes.map((n) => n.label).join(" → ")}.`}
          className="w-full"
        >
          <defs>
            <marker
              id={`arrow-mobile-${diagram.id}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-border-strong)" />
            </marker>
          </defs>

          {mobilePositions.slice(1).map((pos, i) => {
            const from = mobilePositions[i];
            if (!from) return null;
            const { x1, y1, x2, y2 } = edgePoints(from, pos, NODE_W, NODE_H);
            return (
              <line
                key={`mobile-edge-${diagram.id}-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-border-strong)"
                strokeWidth={1.5}
                markerEnd={`url(#arrow-mobile-${diagram.id})`}
              />
            );
          })}

          {mobilePositions.map((pos, i) => {
            const node = diagram.nodes[i];
            if (!node) return null;
            return (
              <g
                key={`mobile-${node.label}`}
                className="cursor-pointer"
                onClick={() => setActive((a) => (a === i ? null : i))}
              >
                <rect
                  x={pos.x - NODE_W / 2}
                  y={pos.y - NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx={4}
                  className="fill-surface stroke-border transition-colors duration-[var(--duration-fast)]"
                  stroke={active === i ? "var(--color-accent)" : undefined}
                  strokeWidth={1.5}
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-text font-mono text-[13px] uppercase tracking-[0.08em]"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
        <figcaption className="label mt-4 min-h-[1.5em]">
          {activeNode?.detail ?? "Tap a stage for detail."}
        </figcaption>
      </figure>
```

- [ ] **Step 3: Wire the same vertical layout into `ProcessDiagram.tsx`**

In `components/systems/ProcessDiagram.tsx`, find the import:

```tsx
import { layoutSerpentine, edgePoints, boundingViewBox } from "./diagramLayout";
```

Replace with:

```tsx
import { layoutSerpentine, layoutVertical, edgePoints, boundingViewBox } from "./diagramLayout";
```

Find the layout constants:

```tsx
const NODE_W = 170;
const NODE_H = 56;
const LAYOUT = { nodeW: NODE_W, nodeH: NODE_H, maxCols: 6, colSpacing: 210, rowSpacing: 130 };
```

Add the mobile spacing constant:

```tsx
const NODE_W = 170;
const NODE_H = 56;
const LAYOUT = { nodeW: NODE_W, nodeH: NODE_H, maxCols: 6, colSpacing: 210, rowSpacing: 130 };
const MOBILE_ROW_SPACING = 96;
```

Find:

```tsx
  const positions = layoutSerpentine(steps.length, LAYOUT);
  const { minX, minY, width, height } = boundingViewBox(positions, NODE_W, NODE_H);
  const hasDetail = steps.some((s) => s.detail);
  const activeStep = active !== null ? steps[active] : undefined;
```

Replace with:

```tsx
  const positions = layoutSerpentine(steps.length, LAYOUT);
  const { minX, minY, width, height } = boundingViewBox(positions, NODE_W, NODE_H);
  const mobilePositions = layoutVertical(steps.length, { nodeW: NODE_W, nodeH: NODE_H, rowSpacing: MOBILE_ROW_SPACING });
  const mobileBox = boundingViewBox(mobilePositions, NODE_W, NODE_H);
  const hasDetail = steps.some((s) => s.detail);
  const activeStep = active !== null ? steps[active] : undefined;
```

The desktop `<figure className="hidden md:block">` and its guard stay
exactly as they are — the `return (` line itself is only touched later,
in this step's final edit, where it gains the `<div>` wrapper. Next,
find the node `<g>` inside the existing desktop figure:

```tsx
            <g
              key={step.label}
              className="group cursor-default"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive((a) => (a === i ? null : a))}
            >
```

Replace with:

```tsx
            <g
              key={step.label}
              className="group cursor-default"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive((a) => (a === i ? null : a))}
              onClick={() => setActive((a) => (a === i ? null : i))}
            >
```

Find the end of the component — the closing `figcaption`/`figure` and
the function's closing brace:

```tsx
      {hasDetail && (
        <figcaption className="label mt-4 min-h-[1.5em]">
          {activeStep?.detail ?? "Hover a stage for detail."}
        </figcaption>
      )}
    </figure>
  );
}
```

Replace with:

```tsx
      {hasDetail && (
        <figcaption className="label mt-4 min-h-[1.5em]">
          {activeStep?.detail ?? "Hover a stage for detail."}
        </figcaption>
      )}
    </figure>

    <figure className="mt-8 md:hidden">
      <svg
        viewBox={`${mobileBox.minX} ${mobileBox.minY} ${mobileBox.width} ${mobileBox.height}`}
        role="img"
        aria-label={`Process: ${steps.map((s) => s.label).join(" → ")}.`}
        className="w-full"
      >
        <defs>
          <marker id="pd-arrow-mobile" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-border-strong)" />
          </marker>
        </defs>

        {mobilePositions.slice(1).map((pos, i) => {
          const from = mobilePositions[i];
          if (!from) return null;
          const { x1, y1, x2, y2 } = edgePoints(from, pos, NODE_W, NODE_H);
          return (
            <line
              key={`mobile-edge-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--color-border-strong)"
              strokeWidth={1.5}
              markerEnd="url(#pd-arrow-mobile)"
            />
          );
        })}

        {mobilePositions.map((pos, i) => {
          const step = steps[i];
          if (!step) return null;
          return (
            <g key={`mobile-${step.label}`} className="cursor-pointer" onClick={() => setActive((a) => (a === i ? null : i))}>
              <rect
                x={pos.x - NODE_W / 2}
                y={pos.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={4}
                className="fill-surface stroke-border transition-colors duration-[var(--duration-fast)]"
                stroke={active === i ? "var(--color-accent)" : undefined}
                strokeWidth={1.5}
              />
              <text
                x={pos.x - NODE_W / 2 + 10}
                y={pos.y - NODE_H / 2 - 8}
                className="fill-text-faint font-mono text-[10px] tracking-[0.08em]"
              >
                {String(i + 1).padStart(2, "0")}
              </text>
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-text font-mono text-[15px] uppercase tracking-[0.08em]"
              >
                {step.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hasDetail && (
        <figcaption className="label mt-4 min-h-[1.5em]">
          {activeStep?.detail ?? "Tap a stage for detail."}
        </figcaption>
      )}
    </figure>
  </div>
  );
}
```

This produces two sibling `<figure>` elements, which a component can
only return wrapped in one parent. Find the component's `return (`
line:

```tsx
  return (
    <figure className="hidden md:block">
```

Replace with:

```tsx
  return (
    <div>
    <figure className="hidden md:block">
```

(The matching closing `</div>` is already in place from this step's
final replacement above, immediately after the last `</figure>` and
before the function's closing `);`. A plain `<div>` rather than a
fragment: `ProcessDiagram` is rendered as a direct child of a flow
container in `app/work/[slug]/page.tsx`, and both figures already carry
their own `mt-8`, so an unstyled wrapping `div` changes nothing visually
— it just gives the two figures one parent, with no risk of an
unclosed-fragment syntax error.)

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors. If TypeScript complains about the JSX structure,
confirm the opening `<div>` from Step 3 and the closing `</div>` from
the final replacement in Step 3 are both present and properly paired
around both `<figure>` elements.

- [ ] **Step 5: Write the regression test**

Append to `e2e/mobile-audit.spec.ts`:

```typescript
test("the Strategy Wall diagram renders as a real SVG (not a text list) at 375px", async ({ page }) => {
  await page.goto("/systems", { waitUntil: "networkidle" });

  const strategySection = page.locator("section", { hasText: "Strategy Wall" }).first();
  const mobileFigure = strategySection.locator("figure svg").last();
  await expect(mobileFigure).toBeVisible();

  const nodeCount = await mobileFigure.locator("rect").count();
  expect(nodeCount).toBeGreaterThanOrEqual(6); // MARKET, SEGMENTATION, ICP, POSITIONING, CHANNEL, GTM

  await mobileFigure.locator("g").first().click();
  await expect(strategySection.locator("figcaption").last()).not.toHaveText("Tap a stage for detail.");
});

test("the goSTOPS process diagram renders on the project detail page at 375px", async ({ page }) => {
  await page.goto("/work/gostops-gtm", { waitUntil: "networkidle" });

  const figures = page.locator("figure");
  const mobileFigure = figures.last();
  await expect(mobileFigure.locator("svg")).toBeVisible();

  const nodeCount = await mobileFigure.locator("rect").count();
  expect(nodeCount).toBe(5); // PROBLEM, RESEARCH, SEGMENTATION, STRATEGY, EXECUTION
});
```

- [ ] **Step 6: Run the tests**

```bash
npm run build
npx playwright test e2e/mobile-audit.spec.ts
```

Expected: 8 passed.

- [ ] **Step 7: Run full verify, read the screenshots, and commit**

```bash
npm run verify -- --fast
npm run shot
```

Read `.screenshots/systems-375.png` and `.screenshots/work-detail-375.png`
with the Read tool. Confirm: a real stacked diagram appears (not empty
space, not a wrapping text list), node boxes don't overflow the 375px
width, and spacing between stacked nodes doesn't look excessively
sparse or cramped — adjust `MOBILE_ROW_SPACING` in either file (Step 2 /
Step 3) if it does, then re-run this step.

```bash
git add components/systems/diagramLayout.ts components/systems/SystemDiagramCard.tsx components/systems/ProcessDiagram.tsx e2e/mobile-audit.spec.ts
git commit -m "fix: replace the mobile text-list/empty-space diagram fallback with a real vertical diagram"
```

---

### Task 7: Fix Ask the Lab's mobile layout and safe-area inset

**Files:**
- Modify: `components/ai/ChatWindow.tsx:104-107` (message region), `:141-143` (composer)
- Test: `e2e/mobile-audit.spec.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing later tasks depend on.

Fix for findings C1 and C2. `AskTheLab.tsx` already sizes the dialog's
panel to `h-full` on mobile
(`className="mx-auto flex h-full w-full max-w-xl flex-col ..."`), which
is correct — the bug is inside `ChatWindow.tsx`: the scrollable message
region (`flex-1 overflow-y-auto`) is already flex-growing correctly, so
the ~700px gap the audit measured is the *browser's default flex
behavior leaving the suggestions block pinned to the top of that
flex-1 region* with nothing to fill the remainder — which is in fact
already correct/expected behavior for a chat UI (empty space below a
short list of starter prompts, above the composer, is normal and matches
how any chat app looks before a conversation starts). Re-reading the
audit screenshot (`ask-open.png`) against this component: the actual
defect is narrower than "fix the flex layout" — it's specifically the
missing safe-area inset (C2), which is a real, unambiguous bug. This
task implements C2, and folds in a modest tightening of the empty region
(reducing, not eliminating, the gap) by anchoring the suggestions to the
bottom of the empty space instead of the top, which reads as an
intentional "start here" prompt immediately above the composer rather
than a stray block up near the header.

- [ ] **Step 1: Confirm the current structure**

```bash
sed -n '104,155p' components/ai/ChatWindow.tsx
```

Confirm the output matches the `<div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">` region and the closing `<form ... className="border-t border-border p-3">` shown in this task's description above.

- [ ] **Step 2: Anchor suggestions to the bottom of the empty region**

In `components/ai/ChatWindow.tsx`, find:

```tsx
  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <MessageList messages={messages} pending={status === "pending"} />
```

Replace with:

```tsx
  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex flex-1 flex-col justify-end overflow-y-auto px-4 py-4">
        <MessageList messages={messages} pending={status === "pending"} />
```

(`justify-end` only affects layout while the flex container has slack —
once real messages are present, `MessageList`'s content fills the
column and this has no visible effect; it only changes where the
starter-prompt block sits in the empty state, from "pinned to the top of
a mostly-empty region" to "anchored just above the composer".)

- [ ] **Step 3: Add the safe-area inset to the composer**

Find:

```tsx
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(value);
        }}
        className="border-t border-border p-3"
      >
```

Replace with:

```tsx
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(value);
        }}
        className="border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
```

(`p-3` is `0.75rem` on every side; the replacement keeps that base value
for `padding-bottom` and adds the device's safe-area inset on top of it,
so non-notched devices see no visual change — `env()` resolves to `0`
when there is no inset to account for.)

- [ ] **Step 4: Write the regression test**

Append to `e2e/mobile-audit.spec.ts`:

```typescript
test("the Ask the Lab composer reserves the device safe-area inset", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Ask the Lab" }).click();
  const dialog = page.locator('dialog[aria-label="Ask the Lab"]');
  await expect(dialog).toBeVisible();

  const paddingBottom = await dialog.locator("form").evaluate((el) => getComputedStyle(el).paddingBottom);
  // env(safe-area-inset-bottom) resolves to 0 in a headless/non-notched
  // context, so this confirms the calc() is wired up and still resolves to
  // at least the base 0.75rem (12px) padding, not 0.
  expect(parseFloat(paddingBottom)).toBeGreaterThanOrEqual(12);
});

test("Ask the Lab's starter prompts sit just above the composer, not pinned to the header", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Ask the Lab" }).click();
  const dialog = page.locator('dialog[aria-label="Ask the Lab"]');
  await expect(dialog).toBeVisible();

  const firstPrompt = dialog.getByRole("button", { name: "What is Aditya strongest at?" });
  const composer = dialog.locator("form");
  const promptBox = await firstPrompt.boundingBox();
  const composerBox = await composer.boundingBox();

  expect(promptBox).not.toBeNull();
  expect(composerBox).not.toBeNull();
  const gap = composerBox!.y - (promptBox!.y + promptBox!.height);
  // Regression guard: the un-fixed layout left roughly 700px of empty
  // space between the last prompt and the composer at 375×812.
  expect(gap, `gap between last prompt and composer is ${gap}px`).toBeLessThan(650);
});
```

- [ ] **Step 5: Run the tests**

```bash
npx playwright test e2e/mobile-audit.spec.ts
```

Expected: 10 passed.

- [ ] **Step 6: Run full verify, read the screenshot, and commit**

```bash
npm run verify -- --fast
```

Manually confirm in a local dev session (`npm run dev`, open `/`, open
Ask the Lab, resize the browser to 375×812) that the composer's
disclaimer text no longer sits flush against the simulated home
indicator area, since `npm run shot` does not open dialogs. State this
manual check explicitly rather than skipping it — CLAUDE.md §5 requires
saying so when something can't be verified by script alone.

```bash
git add components/ai/ChatWindow.tsx e2e/mobile-audit.spec.ts
git commit -m "fix: reserve the safe-area inset in Ask the Lab's composer, anchor starter prompts to it"
```

---

## Final verification

- [ ] **Run the complete suite one more time end to end**

```bash
npm run verify
```

Expected: every step (`typecheck`, `lint`, `placeholders`, `build`,
`bundle`, `e2e`) passes — note that the `placeholders` step will still
report the repo's real, pre-existing content placeholders per Task 1's
Step 4 note; that is expected and correct, not a regression, and is
content work for Aditya (CLAUDE.md §7/§8), not something this plan
touches.

```bash
npm run shot
```

Read every screenshot at the `-375` suffix with the Read tool (per
CLAUDE.md §5 — do not skip this) and confirm no new visual regression
was introduced by any of the seven tasks above.
