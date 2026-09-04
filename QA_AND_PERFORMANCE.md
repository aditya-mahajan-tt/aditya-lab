# QA_AND_PERFORMANCE.md — ADITYA LAB

> The original spec said "smooth experience on capable hardware". That is not testable and therefore not enforceable. Everything here is a number or a checkbox.

---

## 1. Performance budgets

Measured on the deployed Vercel build, not localhost. Throttling: Lighthouse "Slow 4G, 4× CPU" for mobile figures.

| Metric | V1 target | Hard fail |
|---|---|---|
| LCP (mobile, 4G) | < 2.0s | > 2.5s |
| CLS | < 0.05 | > 0.1 |
| INP | < 150ms | > 200ms |
| TTFB | < 400ms | > 800ms |
| **Initial JS** (gzip, homepage, excl. 3D chunk) | < 160 KB | > 200 KB |
| 3D chunk (gzip, lazy) | < 500 KB | > 700 KB |
| Total homepage transfer, first visit, no 3D | < 700 KB | > 1 MB |
| Largest image (AVIF) | < 150 KB | > 250 KB |
| GLB models, combined | < 2 MB | > 3.5 MB |
| Fonts, total | < 120 KB | > 180 KB |
| `/resume` full load | < 1.0s | > 1.5s |

**Lighthouse minimums (mobile):** Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO = 100.

**Frame rate:** 60fps sustained on desktop during scroll and hero interaction · ≥ 30fps on a 4× CPU-throttled profile · LOW quality tier must never drop below 30fps.

**Rule: profile before optimising.** Run `npm run analyze` and a real trace. Do not guess at what is slow.

---

## 2. Automated checks (`npm run verify`)

1. `tsc --noEmit` — zero errors, strict mode
2. `eslint` — zero errors, zero warnings
3. `next build` — succeeds
4. `check-placeholders` — zero `_REQUIRED` tokens when `NODE_ENV=production`
5. **Secret scan** — no API-key-shaped string in any client bundle
6. **3D isolation** — `three` does not appear in the initial chunk manifest
7. Playwright smoke suite (below)
8. Bundle size assertion against §1

CI runs all of it on every push. A red `verify` blocks merge to `main`.

### Playwright smoke suite (`e2e/smoke.spec.ts`)

For **every** route:
- returns 200 and renders its `<h1>`
- zero `console.error`, zero unhandled rejections
- `document.documentElement.scrollWidth <= window.innerWidth` at 375, 768, 1280, 1920
- exactly one `<h1>`, heading levels never skip
- all `<img>` have an `alt` attribute
- all interactive elements are reachable by `Tab` and show a visible focus style
- `⌘K` opens the palette; `Escape` closes it and returns focus to the trigger
- with JavaScript disabled: main content and navigation still render

---

## 3. Manual validation tests

Run these at each checkpoint. Record the answers, don't assume them.

**5-second test** — show only the hero to someone unfamiliar. *Who is this person?*
→ Pass: "works across AI, product and business."

**30-second test** — the visitor can name who Aditya is, what he does, one project, and how to contact him.

**3-minute test** — the visitor can describe his capabilities, his thinking, one project in detail, and something about his personality.

**Recruiter test** — from a cold load, find resume + projects + skills + contact + LinkedIn in **under 30 seconds**, on a phone. Time it with a stopwatch. This is the test the whole plan is optimised for.

**Technical test** — a developer identifies framework, 3D approach, animation system and project structure in under 2 minutes (Build Mode should make this trivial).

**Mobile test** — no horizontal overflow · touch targets ≥ 44px · menu works · text readable without zoom · CTA visible above the fold · all project content reachable · no 3D jank.

---

## 4. Failure tests (run before every release)

| Test | How | Expected |
|---|---|---|
| WebGL off | `chrome://flags` → disable WebGL, or Playwright `--disable-gpu` | CSS/SVG fallback, notice shown, everything else identical |
| WebGL context lost | Devtools `WEBGL_lose_context` | Graceful swap, no crash, no console spam |
| JavaScript off | Devtools setting | Full content + navigation readable |
| Slow 3G | Devtools throttle | Content before decoration; nothing blocks on 3D or AI |
| AI key removed | Unset env var on a preview deploy | Offline state, manual links, site unaffected |
| Images 404 | Block `/images/*` | Alt-text placeholders, no broken icons, no layout shift |
| Reduced motion | OS setting | No transforms, no parallax, no particles, all content present |
| 100% zoom → 200% | Browser zoom | No content loss, no overlap, no horizontal scroll |

---

## 5. Accessibility checklist (WCAG 2.1 AA)

**Structure**
- [ ] Semantic landmarks: `header`, `nav`, `main`, `footer`
- [ ] One `<h1>` per page; no skipped heading levels
- [ ] Skip-to-content link, first in tab order, visible on focus
- [ ] Page `<title>` unique and descriptive per route

**Keyboard**
- [ ] Every interactive element reachable and operable by keyboard
- [ ] Visible focus ring on everything — never removed by the custom cursor
- [ ] Focus trapped inside open dialogs, menus and the command palette; returned to the trigger on close
- [ ] Logical tab order matching visual order
- [ ] No keyboard trap anywhere, including the 3D canvas

**Screen reader**
- [ ] `<Canvas aria-hidden="true">`; 3D holds no unique content
- [ ] Meaningful alt text on all content images; `alt=""` on decorative
- [ ] Icon-only buttons have `aria-label`
- [ ] Command palette uses the ARIA combobox pattern with `aria-activedescendant`
- [ ] AI responses announced via `aria-live="polite"`
- [ ] Status chips convey status in text, not colour alone
- [ ] Route changes announced

**Visual**
- [ ] Body text contrast ≥ 7:1; all text ≥ 4.5:1; UI borders ≥ 3:1
- [ ] Legible and functional at 200% zoom
- [ ] No information conveyed by colour alone
- [ ] Touch targets ≥ 44×44px

**Motion**
- [ ] `prefers-reduced-motion` fully respected
- [ ] Nothing flashes more than 3× per second
- [ ] No auto-playing motion longer than 5s without a pause control

Tooling: `axe-core` in Playwright, plus one real screen-reader pass (VoiceOver on macOS/iOS) before each release. Automated tools catch about 30% — the manual pass is not optional.

---

## 6. Browser & device matrix

**Must pass:** Chrome (desktop + Android), Safari (macOS + iOS), Firefox desktop, Edge desktop.
**Devices:** high-end desktop · average laptop (integrated GPU) · mid-range Android · iPhone (a 2–3-year-old model, not the newest).

Safari-specific: check `backdrop-filter` performance, `100vh` behaviour with the mobile URL bar (use `100dvh`), and WebGL context limits.

---

## 7. Visual QA checklist

Typography scale and hierarchy · alignment and optical spacing · section rhythm · animation timing and stagger · hover, focus, active, disabled states · loading skeletons · empty states · error states · 404 · mobile layout at 375px · dark-surface layering (no muddy grey-on-grey) · line length ≤ 70ch · OG preview in the LinkedIn and X inspectors.

---

## 8. Analytics events

Privacy-respecting only. No PII, no cross-site tracking, no cookie banner required.

```
page_view
hero_cta_click            { cta: "enter_lab" | "explore_work" }
project_open              { slug }
project_scroll_complete   { slug }
experiment_open           { slug }
command_palette_open      { source: "keyboard" | "click" }
command_palette_select    { target }
ask_lab_open              { source }
ask_lab_question          { refused: boolean }      // question text logged separately, anonymised
build_mode_toggle
resume_click
contact_click             { channel: "email" | "linkedin" | "github" }
webgl_fallback            { reason }
quality_tier              { tier }
```

**Funnel to watch:** `page_view` → `project_open` → `project_scroll_complete` → `contact_click`. If people open projects but never finish them, the case studies are too long or too dense — that is a content fix, not a design fix.

---

## 9. Pre-launch checklist (V1)

**Content**
- [ ] Zero `_REQUIRED` placeholders · [ ] Three complete case studies · [ ] Bio final · [ ] Skills final · [ ] Resume PDF live · [ ] All links tested · [ ] Full proofread (a typo in the hero undoes a lot of polish)

**Engineering**
- [ ] `verify` green · [ ] Zero console errors in production · [ ] Every route works · [ ] 404 works · [ ] WebGL fallback works · [ ] Contact form or mailto works and is rate limited · [ ] No keys in the client bundle · [ ] Error monitoring live

**Performance**
- [ ] All §1 budgets met · [ ] Images optimised · [ ] Lazy loading verified · [ ] Bundle reviewed · [ ] Tested on a real mid-range phone

**Accessibility** — full §5 checklist passed, including the manual screen-reader pass

**SEO & sharing**
- [ ] Metadata per route · [ ] OG image verified in real previews · [ ] Favicons · [ ] `sitemap.xml` · [ ] `robots.txt` · [ ] Canonical URLs · [ ] JSON-LD `Person` schema

**Infrastructure**
- [ ] Domain + SSL · [ ] Env vars set · [ ] Analytics firing · [ ] Preview deploys on PRs · [ ] `main` protected

---

## 10. Post-launch

**Week 1:** watch error monitoring daily; fix anything real within 24h; ask five people to run the 30-second test and record where they hesitate.

**Month 1:** review the AI question log — every "I don't have that" is a content gap worth filling. Review the funnel. Write the first honest Build Mode entries while the build is still fresh.

**Ongoing:** a Lab Log entry per meaningful change. The site's credibility depends on it visibly being alive.
