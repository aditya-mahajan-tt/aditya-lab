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
    slug: "turbotork-data-integration",
    title: "[PROJECT_002_TITLE_REQUIRED]",
    category: ["Product", "Data"],
    year: "2026",
    status: "IN PROGRESS",
    featured: true,
    order: 2,

    summary: "[PROJECT_002_SUMMARY_REQUIRED]",
    context: "[PROJECT_002_CONTEXT_REQUIRED]",
    problem: "[PROJECT_002_PROBLEM_REQUIRED]",
    role: "[PROJECT_002_ROLE_REQUIRED]",
    thinking: "[PROJECT_002_THINKING_REQUIRED]",
    approach: "[PROJECT_002_APPROACH_REQUIRED]",
    execution: "[PROJECT_002_EXECUTION_REQUIRED]",
    learnings: ["[PROJECT_002_LEARNING_1_REQUIRED]"],
    tools: [],
    media: [],
    links: [],
  },
  {
    id: "003",
    slug: "cricket-game",
    title: "[PROJECT_003_TITLE_REQUIRED]",
    category: ["Product", "Creative"],
    year: "2025",
    status: "SHIPPED",
    featured: true,
    order: 3,

    summary: "[PROJECT_003_SUMMARY_REQUIRED]",
    context: "[PROJECT_003_CONTEXT_REQUIRED]",
    problem: "[PROJECT_003_PROBLEM_REQUIRED]",
    role: "[PROJECT_003_ROLE_REQUIRED]",
    thinking: "[PROJECT_003_THINKING_REQUIRED]",
    approach: "[PROJECT_003_APPROACH_REQUIRED]",
    execution: "[PROJECT_003_EXECUTION_REQUIRED]",
    learnings: ["[PROJECT_003_LEARNING_1_REQUIRED]"],
    tools: [],
    media: [],
    links: [],
  },
];

export const projects = z.array(ProjectSchema).parse(raw);
