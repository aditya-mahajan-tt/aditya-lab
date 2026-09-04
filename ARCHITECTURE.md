# ARCHITECTURE.md — ADITYA LAB

---

## 1. Dependencies

**Approved baseline — do not add anything else without asking.**

| Package | Why |
|---|---|
| `next`, `react`, `react-dom`, `typescript` | Framework |
| `tailwindcss` | Styling, driven by design tokens |
| `zod` | Runtime validation of `/data` — bad content fails the build |
| `gsap` | All animation and scroll choreography |
| `zustand` | Small global store shared between DOM and R3F trees |
| `three`, `@react-three/fiber`, `@react-three/drei` | 3D (Release 2+, lazy chunk only) |
| `@react-three/postprocessing` | One bloom pass, Release 2+ |
| `@playwright/test` | Verification harness |
| `@vercel/analytics` | Phase 7 — privacy-respecting analytics, zero-config on Vercel, no cookie banner |
| `@axe-core/playwright` (dev) | Phase 7 — automated accessibility scanning per QA_AND_PERFORMANCE.md §5 |

**Not yet added, blocked on an external account (CONTENT_INTAKE.md §J):**

- **Sentry (`@sentry/nextjs`)** — error monitoring. Wiring it now would be inert without a DSN; add once Aditya supplies a Sentry account (J4).

**Deliberately excluded:**

- **Framer Motion / Motion** — GSAP already covers this. Two animation libraries is bundle waste and two mental models.
- **Lenis / Locomotive Scroll** — smooth-scroll libraries fight native scroll, break `prefers-reduced-motion`, and hurt accessibility. Native scroll only.
- **`cmdk`** — the command palette is ~200 lines; building it teaches the ARIA combobox pattern properly and avoids a dependency.
- **A vector database / RAG stack** — the entire portfolio corpus fits in a single prompt. See `AI_SPEC.md`.
- **Contentlayer / MDX (for now)** — TypeScript data files are typed, validated and simpler. Revisit only if long-form writing volume justifies it.
- **A UI component library** — this site's whole point is a custom visual language.

Before adding anything: *can the existing stack solve this cleanly?* If yes, it is not a dependency.

---

## 2. File structure

```
aditya-lab/
├── app/
│   ├── layout.tsx              # root layout, fonts, providers, skip link
│   ├── page.tsx                # homepage
│   ├── globals.css             # design tokens + base styles
│   ├── not-found.tsx
│   ├── error.tsx               # route-level error boundary
│   ├── work/page.tsx
│   ├── work/[slug]/page.tsx
│   ├── experiments/page.tsx
│   ├── experiments/[slug]/page.tsx
│   ├── thinking/page.tsx
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── resume/page.tsx
│   ├── opengraph-image.tsx
│   ├── sitemap.ts
│   ├── robots.ts
│   └── api/
│       ├── ask/route.ts        # AI — server only
│       └── contact/route.ts    # form handler, rate limited
│
├── components/
│   ├── layout/                 # Header, MobileMenu, Footer, SkipLink, PageShell
│   ├── navigation/             # CommandPalette, NavOverlay, Breadcrumb
│   ├── hero/                   # Hero, HeroText, BootSequence, CoreFallback
│   ├── projects/               # ProjectArchive, ProjectArtifact, ProjectDetail, ProjectNav
│   ├── experiments/            # ExperimentArchive, ExperimentCard, StatusChip
│   ├── thinking/               # ThinkingFramework, FrameworkStep
│   ├── about/                  # AboutSection, SkillSystem, Progression
│   ├── contact/                # ContactSection, ContactForm
│   ├── systems/                # AutomationEngine, NeuralCore, ProcessDiagram, StrategyWall
│   ├── ai/                     # AskTheLab, ChatWindow, MessageList, SuggestedQuestions
│   ├── build/                  # BuildMode, ArchitectureDiagram, StackList
│   ├── log/                    # LabLog, LogEntry
│   ├── effects/                # CustomCursor, MagneticButton, RevealText, SplitText, MaskReveal
│   └── ui/                     # Button, Chip, Field, Dialog, Skeleton, ErrorState, EmptyState
│
├── three/                      # Release 2+. Nothing here is imported synchronously.
│   ├── LabCanvas.tsx           # the only dynamic-import entry point
│   ├── scene/                  # Scene, Lighting, Environment
│   ├── objects/                # Core, Workstation, NeuralCore, AutomationEngine, ...
│   ├── systems/                # ParticleSystem, CameraController, PerformanceManager, Interaction
│   ├── materials/              # CoreMaterial, GlassMaterial, MetalMaterial, tokens
│   └── effects/                # Bloom (only)
│
├── animations/
│   ├── tokens.ts               # durations + easings — the ONLY source
│   ├── hero.ts
│   ├── scroll.ts
│   ├── transitions.ts
│   └── micro.ts
│
├── data/
│   ├── schema.ts               # Zod schemas — validated at module load
│   ├── projects.ts
│   ├── experiments.ts
│   ├── skills.ts
│   ├── timeline.ts
│   ├── about.ts
│   ├── navigation.ts
│   ├── site.ts                 # metadata, social links, contact
│   ├── knowledge.ts            # AI grounding corpus (derived, see AI_SPEC.md)
│   └── queries.ts              # getProject, getAllProjects, getFeatured, filters
│
├── lib/
│   ├── ai/                     # prompt builder, guardrails, rate limiter, cache
│   ├── analytics/              # typed event helpers
│   ├── quality.ts              # WebGL/GPU/battery detection + tier resolution
│   ├── store.ts                # zustand global state
│   └── utils/                  # cn, formatting, media queries, hooks
│
├── scripts/
│   ├── verify.ts
│   ├── screenshots.ts
│   └── check-placeholders.ts
│
├── e2e/                        # Playwright smoke + regression suites
├── public/                     # images, models, textures, icons, fonts, resume.pdf
│
├── CLAUDE.md  PLAN.md  ARCHITECTURE.md  DESIGN_SYSTEM.md
├── AI_SPEC.md  CONTENT_INTAKE.md  QA_AND_PERFORMANCE.md  CONTENT_TODO.md
└── README.md
```

**Rule:** a component file contains structure and behaviour. Copy lives in `/data`. If you are typing a sentence of prose inside a `.tsx` file, you are in the wrong file.

**Why `lib/quality.ts` is not in `three/`:** it is the module that decides *whether* to download the Three.js chunk, so it must ship in the initial bundle and therefore must not import Three.js. `three/systems/PerformanceManager` is its counterpart on the far side of the dynamic import, handling runtime adaptation once the renderer exists.

**Why `scene/` has no `Camera.tsx`:** the camera is declared on `<Canvas>` and driven by `three/systems/CameraController`. A third file holding neither the definition nor the behaviour would just be indirection.

---

## 3. Data models

`/data/schema.ts` — Zod is the source of truth; types are inferred from it, never hand-written alongside it.

```ts
import { z } from "zod";

export const ProjectSchema = z.object({
  id: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  category: z.array(z.string()).min(1),
  year: z.string(),
  status: z.enum(["CASE STUDY", "LIVE", "SHIPPED", "ARCHIVED", "IN PROGRESS"]),
  featured: z.boolean().default(false),
  order: z.number(),

  summary: z.string().min(1),          // one line, used on cards and in OG

  // Case study body — the nine sections
  context: z.string(),
  problem: z.string(),
  role: z.string(),
  thinking: z.string(),
  approach: z.string(),
  strategy: z.string().optional(),
  execution: z.string(),
  outcome: z.string().optional(),      // omit rather than invent
  learnings: z.array(z.string()),
  reflection: z.string().optional(),

  tools: z.array(z.string()),

  // Optional process diagram, rendered by the shared ProcessDiagram component
  process: z.array(z.object({
    label: z.string(),
    detail: z.string().optional(),
  })).optional(),

  metrics: z.array(z.object({
    label: z.string(),
    value: z.string(),
    note: z.string().optional(),       // caveat honestly: "self-reported", "internal estimate"
  })).optional(),

  media: z.array(z.object({
    type: z.enum(["image", "video", "embed"]),
    src: z.string(),
    alt: z.string(),                   // REQUIRED — accessibility is not optional
    caption: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })).default([]),

  links: z.array(z.object({
    label: z.string(),
    url: z.string().url(),
  })).default([]),

  confidential: z.boolean().default(false), // hides metrics/client name where needed
});

export const ExperimentSchema = ProjectSchema.pick({
  id: true, slug: true, title: true, category: true, year: true,
  summary: true, tools: true, media: true, links: true,
}).extend({
  type: z.enum(["AI", "AUTOMATION", "PRODUCT", "GROWTH", "TECHNICAL", "CREATIVE"]),
  status: z.enum(["IDEA","PROTOTYPE","BUILDING","WORKING","LIVE","ARCHIVED","FAILED"]),
  hypothesis: z.string(),
  build: z.string(),
  result: z.string(),
  learning: z.string(),
  interactive: z.boolean().default(false),
});

export type Project = z.infer<typeof ProjectSchema>;
export type Experiment = z.infer<typeof ExperimentSchema>;
```

Each data file ends with a parse call so invalid content fails at build time:

```ts
export const projects = z.array(ProjectSchema).parse(rawProjects);
```

Additional schemas follow the same pattern: `SkillGroupSchema` (THINK / BUILD / AUTOMATE / INTELLIGENCE / GROW), `TimelineEntrySchema`, `AboutSchema`, `SiteSchema`.

---

## 4. Global state

`lib/store.ts` — zustand, one store, flat. Chosen over Context because R3F renders in a separate reconciler tree; Context bridging between them is a known pain point and causes needless re-renders.

```ts
type LabState = {
  activeSection: string | null;
  commandPaletteOpen: boolean;
  menuOpen: boolean;
  aiOpen: boolean;
  buildMode: boolean;
  soundEnabled: boolean;              // default false
  quality: "auto" | "high" | "medium" | "low";
  webglAvailable: boolean | null;     // null = not yet detected
  reducedMotion: boolean;
  bootComplete: boolean;
};
```

Rules: nothing derivable goes in the store. No server data in the store. Persist only `soundEnabled` and `quality`.

---

## 5. Rendering & bundle strategy

- Default to **Server Components**. `"use client"` only where interactivity genuinely requires it — and then at the leaf, not the page.
- All project and experiment pages are statically generated via `generateStaticParams`.
- **The 3D layer is a single dynamic import** (`ssr: false`), loaded only after the hero is interactive and only when `webglAvailable && quality !== "low"`. Three.js must never appear in the initial bundle — assert this in the verify script by grepping the build manifest.
- The AI chat window is dynamically imported on first open.
- Images: `next/image`, AVIF then WebP, explicit dimensions to prevent CLS, `priority` on the hero image only.
- Fonts: `next/font` self-hosted, `display: swap`, subset to Latin, preload the display face only.

---

## 6. Fallback chain

| Failure | Behaviour |
|---|---|
| No WebGL / context lost | Swap to the CSS/SVG core built in Phase 5. Toast: `3D EXPERIENCE UNAVAILABLE — SWITCHING TO LIGHT MODE`. Log to analytics. |
| Weak GPU | Quality resolves to LOW: static core, no particles, no post-processing. |
| `prefers-reduced-motion` | No camera motion, no parallax, no particles; opacity-only transitions ≤150ms. |
| AI unavailable / rate limited / over budget | `AI CORE TEMPORARILY OFFLINE.` plus links to the manual content that would have answered the question. Cached canned answers still served. |
| Image fails | Styled placeholder block with the alt text visible, never a broken icon. |
| JavaScript disabled | Full site content and navigation still render and work. Boot overlay never appears. |
| Route not found | Custom 404 in the Lab's voice, with search and the main routes. |
| Unhandled render error | `error.tsx` boundary with a recovery action; reported to error monitoring. |

---

## 7. Security

- **No API key ever reaches the browser.** Client → Next.js route handler → external API. Enforce with a lint rule banning `NEXT_PUBLIC_` on any key-shaped env var.
- All route handlers: Zod-validate input, cap body size, sanitise output, rate limit by IP (and a global daily cap).
- CSP headers, `X-Frame-Options`, `Referrer-Policy` set in `next.config`.
- Contact form: honeypot field + rate limit. No CAPTCHA unless spam actually appears.
- Analytics collect no PII and no free-text user input except AI questions, which are stored anonymised (see `AI_SPEC.md`).

---

## 8. Git & environments

- `main` = production, always deployable. Branch per phase: `phase/06-motion`. Tag checkpoints: `checkpoint-3`.
- Every PR gets a Vercel preview; `npm run verify` gates merge.
- Env vars: `.env.example` committed with every key documented; real values only in Vercel.
- Never commit: `.env.local`, `.screenshots/`, model source files (`.blend`), unoptimised media.
