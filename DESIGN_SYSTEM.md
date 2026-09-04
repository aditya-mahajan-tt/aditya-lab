# DESIGN_SYSTEM.md — ADITYA LAB

> The original spec specified particle systems in detail and typography not at all. Typography and colour decide whether the site reads as "incredible" in the first second; particles do not. This file is the concrete answer.
>
> These are **starting values**, chosen to be coherent and safe. Aditya may change them — but only here, and only deliberately. Claude Code must never introduce a colour, duration, or size that is not a token.

---

## 1. Visual direction

**Apple laboratory × research facility × editorial magazine.**

Dark, precise, high-contrast, generous whitespace, monospace used as *instrumentation* rather than decoration. Light comes from the content, not from neon. One accent colour, used sparingly enough that it always means something.

**Avoid:** neon-on-black cyberpunk, glassmorphism everywhere, purple-blue AI gradients, sci-fi corridors, drop shadows on dark backgrounds, more than one general-purpose accent hue (status and focus colours are signals, not accents — see §2).

---

## 2. Colour

Near-black rather than pure black (pure black on OLED plus high-contrast white causes smearing and eye strain). Green is not decoration — it is a **signal**: it appears when something activates, connects, succeeds, is selected, is online, or is interactive. Everything else stays a dark neutral. Target distribution: roughly 85% dark neutrals, 10% off-white/muted text, ~5% signal colours combined — if a section is tinted green, that is a bug, not a style.

```css
:root {
  /* Surfaces — VOID / GRAPHITE / STEEL */
  --color-bg:            #070809;   /* VOID */
  --color-surface:       #111416;   /* GRAPHITE */
  --color-surface-raised:#1B1F21;
  --color-border:        #252A2C;   /* STEEL */
  --color-border-strong: #3B4145;   /*  1.94:1 on --color-bg */

  /* Text */
  --color-text:          #E9ECEB;   /* OFF WHITE — 16.86:1 on --color-bg */
  --color-text-muted:    #98A09E;   /*  7.50:1 — body secondary (lightened
                                        from the reference's #858D8B, which
                                        only hits 5.90:1, to hold this
                                        project's 7:1 body-text floor) */
  --color-text-faint:    #7C837E;   /*  5.16:1 — chrome only, never body copy */

  /* Accent — the one signal colour, used for one thing at a time */
  --color-accent:        #B6FF4A;   /* SIGNAL GREEN — 16.60:1 on --color-bg */
  --color-accent-dim:    #77BD0F;   /*  8.66:1 on --color-bg */
  --color-accent-glow:   rgba(182, 255, 74, 0.14);

  /* Status — "live" shares the accent's meaning (it IS "online") */
  --color-live:          #B6FF4A;   /* = --color-accent */
  --color-building:      #FFB547;   /* SIGNAL AMBER — 11.41:1 on --color-bg */
  --color-failed:        #FF5C5C;   /* SIGNAL RED — 6.62:1 on --color-bg */
  --color-archived:      #7C837E;   /* = --color-text-faint */

  /* Focus — a deliberately different hue from the accent, so a focus ring
     never reads as "this is the brand colour" */
  --color-focus:         #5DE8FF;   /* SIGNAL CYAN — 13.79:1 on --color-bg */
}
```

**Contrast rules:** body text ≥ 7:1. All text ≥ 4.5:1. UI borders and icons ≥ 3:1 where the element's job is to be read, not merely to hint at structure — the hairline section dividers in this design are intentionally subtler than that (≈1.3–1.9:1, unchanged from V1), relying on whitespace and layout rather than a stark line. `--color-text-faint` is for labels and chrome only — never a sentence a visitor needs to read. Status colour is never the *only* signal: always pair with the text label.

A light theme is **out of scope for V1.** Do not build one speculatively.

---

## 3. Typography

Two families. Display/body sans + monospace for instrumentation.

```css
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;   /* or Neue Haas Grotesk / Suisse if licensed */
--font-mono: "JetBrains Mono", ui-monospace, "SF Mono", monospace;
```

Weights: sans 400 / 500 / 700. Mono 400 / 500. **Four faces total, self-hosted.** Every additional weight costs real bytes for marginal gain.

Fluid type scale (`clamp`, 1.25 ratio, min viewport 375px, max 1440px):

```css
--text-xs:   clamp(0.6875rem, 0.66rem + 0.12vw, 0.75rem);    /* 11 → 12  mono labels */
--text-sm:   clamp(0.8125rem, 0.78rem + 0.15vw, 0.875rem);   /* 13 → 14  captions */
--text-base: clamp(0.9375rem, 0.90rem + 0.19vw, 1.0625rem);  /* 15 → 17  body */
--text-lg:   clamp(1.125rem, 1.05rem + 0.31vw, 1.3125rem);   /* 18 → 21  lead */
--text-xl:   clamp(1.375rem, 1.24rem + 0.56vw, 1.75rem);     /* 22 → 28  h3 */
--text-2xl:  clamp(1.75rem, 1.51rem + 1.00vw, 2.5rem);       /* 28 → 40  h2 */
--text-3xl:  clamp(2.25rem, 1.75rem + 2.10vw, 3.75rem);      /* 36 → 60  h1 */
--text-4xl:  clamp(2.75rem, 1.70rem + 4.40vw, 5.5rem);       /* 44 → 88  hero */

--leading-tight: 1.05;   /* display */
--leading-snug:  1.25;   /* headings */
--leading-body:  1.65;   /* body copy — generous, this is a reading site */

--tracking-display: -0.03em;
--tracking-body:     0em;
--tracking-mono:     0.08em;   /* mono labels are always uppercase + tracked */
```

Rules:
- Body measure: **62–70 characters** (`max-width: 68ch`). Case studies are read, not scanned — do not let them run full-bleed.
- Mono is for labels, statuses, IDs, numbers, and system chrome. **Never for a paragraph.**
- Uppercase only in mono, only for short labels, always with `--tracking-mono`.
- One `--text-4xl` element per page, maximum.

---

## 4. Spacing & layout

8px base, on a modular progression:

```css
--space-1: 0.25rem;  --space-2: 0.5rem;   --space-3: 0.75rem;
--space-4: 1rem;     --space-6: 1.5rem;   --space-8: 2rem;
--space-12: 3rem;    --space-16: 4rem;    --space-24: 6rem;
--space-32: 8rem;    --space-48: 12rem;

--container:      1280px;
--container-prose:  680px;
--gutter: clamp(1.25rem, 4vw, 4rem);

--radius-sm: 2px;  --radius-md: 4px;  --radius-lg: 8px;  --radius-full: 999px;
```

Section rhythm: `--space-24` mobile, `--space-32` desktop between major sections. Whitespace is the primary tool for feeling premium — when in doubt, add more.

Grid: 12 columns desktop, 6 tablet, 4 mobile, gutter `--space-6`.

**Radii stay small.** Sharp corners read as instrumentation; large radii read as consumer SaaS.

---

## 5. Motion tokens

**The only durations and easings permitted in the codebase.**

```css
--duration-instant: 100ms;   /* state flips, cursor */
--duration-fast:    200ms;   /* hover, focus, micro */
--duration-medium:  400ms;   /* UI transitions, overlays, page transitions */
--duration-slow:    700ms;   /* section reveals */
--duration-cinema: 1200ms;   /* hero staging, camera moves — rare */

--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);      /* default for entrances */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);     /* moves between states */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* magnetics only */
```

Mirrored in `animations/tokens.ts` for GSAP. Rules:

- Entrances use `--ease-out`. Exits are faster than entrances (~0.7×).
- Stagger between siblings: 40–80ms. Never more than 8 staggered items — beyond that it reads as slow, not choreographed.
- Nothing a user is waiting on may exceed `--duration-medium`.
- `--duration-cinema` is reserved for the hero and camera transitions. If you are reaching for it elsewhere, reconsider.
- **Reduced motion:** all of the above collapse to a `--duration-fast` opacity fade. Transforms, parallax, particles and magnetics are disabled entirely. Content is unchanged.

---

## 6. Z-index scale

```css
--z-background:  0;
--z-canvas:     10;   /* 3D layer — always behind content */
--z-content:    20;
--z-sticky:     30;
--z-header:     40;
--z-overlay:    50;   /* menu, dialog backdrop */
--z-palette:    60;
--z-cursor:     70;
--z-toast:      80;
--z-boot:       90;   /* boot overlay, removed from the DOM after use */
```

Any literal `z-index` outside this scale is a bug.

---

## 7. Breakpoints

```css
--bp-mobile:  375px;   /* design floor */
--bp-tablet:  768px;
--bp-desktop:1024px;
--bp-wide:   1440px;
```

Mobile-first. Design at 375 and 1440; the rest interpolates. Never target a specific device.

---

## 8. Component conventions

**Buttons** — three variants only:
- `primary`: accent border + accent text, fills on hover, `--duration-fast`.
- `secondary`: `--color-border` outline, border brightens on hover.
- `ghost`: text only with an animated underline.

Min touch target 44×44px. Focus ring: `2px solid var(--color-focus)` with `2px` offset — **never removed, never replaced by the custom cursor.**

**Cards / artifacts** — `--color-surface`, `1px` border, no shadow. Hover lifts the border to `--color-border-strong` and shows the accent-coloured `EXPLORE →`. The whole card is one link; nested interactive elements are not permitted inside it.

**Status chips** — mono, uppercase, `--text-xs`, `--tracking-mono`, 1px border in the status colour, transparent fill, text label always present.

**Custom cursor** — desktop `pointer: fine` only. Default 8px ring; morphs to a labelled pill (`VIEW`, `OPEN`, `INTERACT`, `DRAG`) on relevant targets. Disabled on touch, on reduced motion, and whenever a dialog or the palette is open. The native cursor is hidden only while the custom one is provably rendering.

---

## 9. Iconography & imagery

- Icons: inline SVG, 1.5px stroke, 24px grid, `currentColor`. No icon library.
- Project imagery: dark-friendly, consistent treatment (subtle desaturation lifting to full colour on hover is enough — no distortion shaders in V1).
- Every image needs real alt text in `/data`. Decorative images get `alt=""` plus `aria-hidden`.
- Diagrams are SVG, drawn with tokens, legible in isolation, and captioned.

---

## 10. Quick self-check before shipping any screen

1. Is every colour, size, duration and z-index a token?
2. Is body copy ≤ 70 characters wide?
3. Is there one clear focal point, or is everything competing?
4. Is the accent doing exactly one job here?
5. Does the focus ring survive on every interactive element?
6. Does it hold up at 375px without a horizontal scrollbar?
7. Would removing the animation lose any information? (It must not.)
