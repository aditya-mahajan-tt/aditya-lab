import { z } from "zod";
import { ExperimentSchema } from "./schema";

/**
 * CONTENT_INTAKE.md §D.
 * Include at least one FAILED experiment — it is the most credible thing
 * on the site and it is what makes the Lab concept true rather than decorative.
 */
const raw = [
  {
    id: "001",
    slug: "ai-lead-generation-engine",
    title: "[EXPERIMENT_001_TITLE_REQUIRED]",
    category: ["AI", "Automation"],
    year: "2026",
    order: 1,
    type: "AI",
    status: "PROTOTYPE",
    summary: "[EXPERIMENT_001_SUMMARY_REQUIRED]",
    hypothesis: "[EXPERIMENT_001_HYPOTHESIS_REQUIRED]",
    build: "[EXPERIMENT_001_BUILD_REQUIRED]",
    result: "[EXPERIMENT_001_RESULT_REQUIRED]",
    learning: "[EXPERIMENT_001_LEARNING_REQUIRED]",
    interactive: false,
    tools: [],
    media: [],
    links: [],
  },
];

export const experiments = z.array(ExperimentSchema).parse(raw);
