import { BuildModeSchema } from "./schema";

/**
 * CONTENT_INTAKE.md §I. `stack`, `architecture` and `decisions` describe the
 * repo itself — objective, verifiable against package.json and
 * ARCHITECTURE.md's own stated rationale, so they're written directly rather
 * than routed through the [AI_DRAFT_REVIEW] marker (see data/schema.ts).
 * `why`, `whatBroke` and `whatLearned` are personal reflection that must be
 * Aditya's own words — CONTENT_INTAKE.md §I1–I3 — left as [X_REQUIRED].
 */
export const buildMode = BuildModeSchema.parse({
  why: "[BUILD_MODE_WHY_REQUIRED]",

  stack: [
    { id: "FRONTEND", tools: ["Next.js (App Router)", "React", "TypeScript", "Tailwind CSS"] },
    { id: "MOTION", tools: ["GSAP", "ScrollTrigger"] },
    { id: "3D", tools: ["Three.js", "React Three Fiber", "Drei", "postprocessing"] },
    { id: "DATA", tools: ["Zod", "Zustand"] },
    { id: "INTELLIGENCE", tools: ["Groq"] },
    { id: "DEPLOY", tools: ["Vercel", "Vercel Analytics"] },
  ],

  architecture: {
    id: "build-mode-architecture",
    title: "How a request becomes a page",
    description:
      "The real render path — content is validated before it ever reaches a component, and the heaviest layers only load when they're actually needed.",
    nodes: [
      { label: "BROWSER", detail: "Requests a route." },
      { label: "APP ROUTER", detail: "Next.js resolves the route to a Server Component." },
      { label: "DATA LAYER", detail: "/data parses through Zod at module load — bad content fails the build, not the browser." },
      { label: "SERVER RENDER", detail: "Server Components render to HTML by default; \"use client\" only at the leaves that need it." },
      { label: "CLIENT ISLANDS", detail: "GSAP motion, the R3F 3D core and Ask the Lab hydrate independently, each a separate dynamic import." },
      { label: "VERCEL EDGE", detail: "Serves the static/SSR output; the AI route handler calls Groq server-side, keys never reach the browser." },
    ],
  },

  decisions: [
    {
      title: "Zustand over React Context",
      body: "React Three Fiber renders in a separate reconciler tree from the DOM. Bridging Context across that boundary is a known pain point and causes needless re-renders, so global UI state (menu, palette, quality, sound) lives in one flat Zustand store instead.",
    },
    {
      title: "3D is a single dynamic import",
      body: "Three.js and React Three Fiber never appear in the initial JS bundle. The 3D layer loads client-only, after the hero is already interactive, and only when WebGL is available and quality isn't LOW.",
    },
    {
      title: "Native <dialog> over a command-palette library",
      body: "The command palette (⌘K) is built on <dialog>/showModal() rather than a library like cmdk. A modal dialog renders in the browser's top layer, closes on Escape and constrains Tab focus for free.",
    },
    {
      title: "Content lives in /data, not in components",
      body: "Every project, experiment and bio field is typed and Zod-validated at module load. Adding a project means editing one file; a schema violation fails the build instead of shipping broken content.",
    },
    {
      title: "No icon library",
      body: "Every icon on this site is hand-drawn inline SVG — 1.5px stroke, a 24px grid, currentColor — rather than a package like lucide-react. One fewer dependency, and every icon matches the same hand.",
    },
  ],

  whatBroke: [
    "[BUILD_MODE_BROKE_1_REQUIRED]",
    "[BUILD_MODE_BROKE_2_REQUIRED]",
    "[BUILD_MODE_BROKE_3_REQUIRED]",
  ],

  whatLearned: "[BUILD_MODE_LEARNED_REQUIRED]",
});
