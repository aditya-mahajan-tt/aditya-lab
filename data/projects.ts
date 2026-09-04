import { z } from "zod";
import { ProjectSchema } from "./schema";

/**
 * CONTENT_INTAKE.md §C.
 *
 * Ship V1 with THREE excellent case studies, not seven thin ones.
 * Every [X_REQUIRED] token below must be replaced before production —
 * `npm run check:placeholders` fails the production build otherwise.
 *
 * Adding a project = adding one object here. Nothing else changes.
 *
 * Turbotork moved out of this file entirely (2026-09-05) — it's work
 * experience, not a case study; see data/experience.ts. PROJECT_002
 * (Kensara AI) and PROJECT_003 (Adda) are new, drafted from
 * Aditya_Mahajan_OnePager.pdf. The resume gives one bullet each — real
 * facts (role, a concrete outcome or scope) are set directly; anything
 * needing a narrative the resume doesn't contain (context, problem,
 * thinking, approach detail) is left as an explicit placeholder rather
 * than invented. PROJECT_001 (goSTOPS) and PROJECT_004 (renumbered from
 * 003 — the cricket game) aren't on that resume at all and are untouched.
 */
const raw = [
  {
    id: "001",
    slug: "gostops-gtm",
    title: "goSTOPS",
    subtitle: "GTM Strategy",
    category: ["Strategy", "Marketing", "Segmentation"],
    year: "2026",
    status: "CASE STUDY",
    featured: true,
    order: 1,

    summary: "[PROJECT_001_SUMMARY_REQUIRED]",

    context: "[PROJECT_001_CONTEXT_REQUIRED]",
    problem: "[PROJECT_001_PROBLEM_REQUIRED]",
    role: "[PROJECT_001_ROLE_REQUIRED]",
    thinking: "[PROJECT_001_THINKING_REQUIRED]",
    approach: "[PROJECT_001_APPROACH_REQUIRED]",
    execution: "[PROJECT_001_EXECUTION_REQUIRED]",
    // outcome intentionally omitted until there is a real, defensible one.
    learnings: ["[PROJECT_001_LEARNING_1_REQUIRED]"],

    tools: [],
    process: [
      { label: "PROBLEM" },
      { label: "RESEARCH" },
      { label: "SEGMENTATION" },
      { label: "STRATEGY" },
      { label: "EXECUTION" },
    ],
    media: [],
    links: [],
  },
  {
    id: "002",
    slug: "kensara-ai-gtm",
    title: "Kensara AI",
    subtitle: "GTM & Partnership Strategy",
    category: ["Strategy", "GTM"],
    year: "2026",
    status: "IN PROGRESS",
    // Not on the homepage: the resume gives one bullet for this one, not
    // enough to earn a featured slot yet — see data/experience.ts's sibling
    // reasoning. Still a full entry in the /work archive.
    featured: false,
    order: 2,

    summary:
      "Leading GTM and partnership strategy for an AI startup at the IIT Guwahati case competition, advancing to the top 10 of 120 teams.",

    context: "[PROJECT_002_CONTEXT_REQUIRED]",
    problem: "[PROJECT_002_PROBLEM_REQUIRED]",
    role: "Team Lead — leading GTM and partnership strategy for an AI startup as part of a case-competition team.",
    thinking: "[PROJECT_002_THINKING_REQUIRED]",
    approach: "[PROJECT_002_APPROACH_REQUIRED]",
    execution: "[PROJECT_002_EXECUTION_REQUIRED]",
    outcome: "Advanced to the top 10 of 120 teams. (As stated on Aditya's resume — self-reported.)",
    learnings: ["[PROJECT_002_LEARNING_1_REQUIRED]"],

    tools: [],
    media: [],
    links: [],
  },
  {
    id: "003",
    slug: "adda-d2c",
    title: "Adda",
    subtitle: "D2C E-commerce Venture",
    category: ["Product", "E-commerce"],
    year: "2026",
    status: "SHIPPED",
    featured: true,
    order: 3,

    summary:
      "Built a Shopify-based D2C e-commerce store end-to-end — product research, vendor sourcing and payment integration — as founder.",

    context: "[PROJECT_003_CONTEXT_REQUIRED]",
    problem: "[PROJECT_003_PROBLEM_REQUIRED]",
    role: "Founder — owned the venture end-to-end, from product research and vendor sourcing to payment integration.",
    thinking: "[PROJECT_003_THINKING_REQUIRED]",
    approach: "[PROJECT_003_APPROACH_REQUIRED]",
    execution:
      "Built a Shopify-based D2C storefront end-to-end, covering product research, vendor sourcing, and payment integration.",
    // outcome intentionally omitted — no revenue/traction figure on the resume.
    learnings: ["[PROJECT_003_LEARNING_1_REQUIRED]"],

    tools: ["Shopify"],
    process: [
      { label: "PRODUCT RESEARCH" },
      { label: "VENDOR SOURCING" },
      { label: "PAYMENT INTEGRATION" },
    ],
    media: [],
    links: [],
  },
  {
    id: "004",
    slug: "cricket-game",
    title: "[PROJECT_004_TITLE_REQUIRED]",
    category: ["Product", "Creative"],
    year: "2025",
    status: "SHIPPED",
    featured: true,
    order: 4,

    summary: "[PROJECT_004_SUMMARY_REQUIRED]",
    context: "[PROJECT_004_CONTEXT_REQUIRED]",
    problem: "[PROJECT_004_PROBLEM_REQUIRED]",
    role: "[PROJECT_004_ROLE_REQUIRED]",
    thinking: "[PROJECT_004_THINKING_REQUIRED]",
    approach: "[PROJECT_004_APPROACH_REQUIRED]",
    execution: "[PROJECT_004_EXECUTION_REQUIRED]",
    learnings: ["[PROJECT_004_LEARNING_1_REQUIRED]"],
    tools: [],
    media: [],
    links: [],
  },
];

export const projects = z.array(ProjectSchema).parse(raw);
