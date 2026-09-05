import { z } from "zod";

/**
 * Zod is the source of truth for all content. Types are inferred, never
 * hand-written alongside. Every data file parses itself at module load, so
 * bad content fails the BUILD, not the browser. See ARCHITECTURE.md §3.
 */

/** A string that may still be an explicit placeholder token. */
export const Fillable = z.string().min(1);

export const PLACEHOLDER_PATTERN = /\[[A-Z0-9_]+_REQUIRED\]/;

export const isPlaceholder = (value: string) => PLACEHOLDER_PATTERN.test(value);

/**
 * A distinct state from "missing": content Claude Code drafted from
 * supplied source material (e.g. a resume) rather than Aditya's own words.
 * Treated with the same seriousness as a missing placeholder — it must
 * never ship un-reviewed, since it reads as finished but might not be
 * accurate or in his voice. See scripts/check-placeholders.mjs and
 * components/ui/Placeholder.tsx.
 *
 * Data files must write the marker as a literal inline string — e.g.
 * `"[AI_DRAFT_REVIEW] Some drafted sentence."` — the same way [X_REQUIRED]
 * tokens are always written literally, never built via a shared JS
 * constant. check-placeholders.mjs does a plain-text scan of the source
 * files, not the values a module evaluates to, so a constant reference
 * (`DRAFT_MARKER + "..."`) would be invisible to it.
 */
export const DRAFT_PATTERN = /^\[AI_DRAFT_REVIEW\]\s*/;

export const isDraft = (value: string) => DRAFT_PATTERN.test(value);

/** Strips the draft marker for consumers that need the plain text (metadata, search, etc). */
export const stripDraftMarker = (value: string) => value.replace(DRAFT_PATTERN, "");

/* ---------------------------------------------------------------- media */

export const MediaSchema = z.object({
  type: z.enum(["image", "video", "embed"]),
  src: z.string(),
  alt: z.string().min(1, "Alt text is required. Accessibility is not optional."),
  caption: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const LinkSchema = z.object({
  label: z.string().min(1),
  url: z.string(),
});

/* -------------------------------------------------------------- project */

export const ProjectStatus = z.enum([
  "CASE STUDY",
  "LIVE",
  "SHIPPED",
  "ARCHIVED",
  "IN PROGRESS",
]);

export const ProjectSchema = z.object({
  id: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase-kebab-case"),
  title: Fillable,
  subtitle: z.string().optional(),
  category: z.array(z.string()).min(1),
  year: z.string(),
  status: ProjectStatus,
  featured: z.boolean().default(false),
  order: z.number(),

  summary: Fillable,

  context: Fillable,
  problem: Fillable,
  role: Fillable,
  thinking: Fillable,
  approach: Fillable,
  strategy: z.string().optional(),
  execution: Fillable,
  outcome: z.string().optional(),
  learnings: z.array(z.string()),
  reflection: z.string().optional(),

  tools: z.array(z.string()),

  process: z
    .array(z.object({ label: z.string(), detail: z.string().optional() }))
    .optional(),

  metrics: z
    .array(z.object({ label: z.string(), value: z.string(), note: z.string().optional() }))
    .optional(),

  media: z.array(MediaSchema).default([]),
  links: z.array(LinkSchema).default([]),
  confidential: z.boolean().default(false),
});

/* ----------------------------------------------------------- experiment */

export const ExperimentStatus = z.enum([
  "IDEA",
  "PROTOTYPE",
  "BUILDING",
  "WORKING",
  "LIVE",
  "ARCHIVED",
  "FAILED",
]);

export const ExperimentSchema = z.object({
  id: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: Fillable,
  category: z.array(z.string()).min(1),
  year: z.string(),
  order: z.number(),
  summary: Fillable,
  type: z.enum(["AI", "AUTOMATION", "PRODUCT", "GROWTH", "TECHNICAL", "CREATIVE"]),
  status: ExperimentStatus,
  hypothesis: Fillable,
  build: Fillable,
  result: Fillable,
  learning: Fillable,
  interactive: z.boolean().default(false),
  tools: z.array(z.string()).default([]),
  media: z.array(MediaSchema).default([]),
  links: z.array(LinkSchema).default([]),
});

/* --------------------------------------------------------------- skills */

export const SkillDepth = z.enum(["working knowledge", "comfortable", "strong"]);

export const SkillGroupSchema = z.object({
  id: z.enum(["THINK", "BUILD", "AUTOMATE", "INTELLIGENCE", "GROW"]),
  description: Fillable,
  items: z.array(z.object({ name: z.string(), depth: SkillDepth })).min(1),
});

/* ------------------------------------------------------------- thinking */

export const ThinkingStepSchema = z.object({
  label: z.string(),
  body: Fillable,
});

export const ThinkingSchema = z.object({
  heading: Fillable,
  intro: Fillable,
  steps: z.array(ThinkingStepSchema).min(3),
  workedExample: Fillable,
  principles: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
});

/* ------------------------------------------------------------- timeline */

export const TimelineEntrySchema = z.object({
  date: z.string(), // ISO yyyy-mm-dd — formatted for display at render time
  type: z.enum(["BUILD", "EXPERIMENT", "STRATEGY", "LEARNING", "LAUNCH"]),
  body: Fillable,
  link: LinkSchema.optional(),
});

/* ---------------------------------------------------------------- about */

export const AboutSchema = z.object({
  heroHeadline: Fillable,
  heroSubline: Fillable,
  shortBio: Fillable,
  longBio: Fillable,
  progression: z.array(z.object({ label: z.string(), body: Fillable })).min(3),
  problemsIEnjoy: Fillable,
  photo: MediaSchema.optional(),
});

/* ------------------------------------------------------------ experience */

export const ExperienceEntrySchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  location: z.string().optional(),
  start: z.string(), // "YYYY-MM"
  end: z.string().optional(), // omit for "Present"
  bullets: z.array(Fillable).min(1),
  tools: z.array(z.string()).default([]),
});

/* ----------------------------------------------------------------- site */

export const SiteSchema = z.object({
  name: z.string(),
  title: Fillable,
  description: Fillable,
  url: z.string(),
  author: z.string(),
  location: z.string().optional(),
  email: Fillable,
  resumePath: Fillable,
  social: z.array(LinkSchema),
});

/* -------------------------------------------------------------- systems */

export const SystemNodeSchema = z.object({
  label: z.string(),
  detail: z.string().optional(),
});

export const SystemDiagramSchema = z.object({
  id: z.string(),
  title: Fillable,
  description: Fillable,
  nodes: z.array(SystemNodeSchema).min(2),
  /** The real project this diagram is grounded in, if its case study is ready to link to. */
  relatedProjectSlug: z.string().optional(),
  /** A generic link, for when the grounding isn't a /work case study (e.g. an /about experience entry). */
  relatedLink: LinkSchema.optional(),
});

/* -------------------------------------------------------------- build mode */

export const StackCategorySchema = z.object({
  id: z.enum(["FRONTEND", "MOTION", "3D", "DATA", "INTELLIGENCE", "DEPLOY"]),
  tools: z.array(z.string()).min(1),
});

export const BuildModeSchema = z.object({
  why: Fillable,
  stack: z.array(StackCategorySchema).min(1),
  architecture: SystemDiagramSchema,
  decisions: z.array(z.object({ title: z.string(), body: Fillable })).min(1),
  whatBroke: z.array(Fillable).min(3),
  whatLearned: Fillable,
});

/* ---------------------------------------------------------------- types */

export type Media = z.infer<typeof MediaSchema>;
export type SystemDiagram = z.infer<typeof SystemDiagramSchema>;
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Experiment = z.infer<typeof ExperimentSchema>;
export type SkillGroup = z.infer<typeof SkillGroupSchema>;
export type Thinking = z.infer<typeof ThinkingSchema>;
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;
export type About = z.infer<typeof AboutSchema>;
export type Site = z.infer<typeof SiteSchema>;
export type BuildMode = z.infer<typeof BuildModeSchema>;
