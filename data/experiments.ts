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
    planes: ["ai", "product"],
    title: "AI Lead Generation Engine",
    category: ["AI", "Automation"],
    year: "2026",
    order: 1,
    type: "AI",
    status: "PROTOTYPE",
    summary:
      "An AI agent that sources, qualifies and drafts outreach to leads automatically, cutting manual prospecting time.",
    hypothesis:
      "An LLM agent could do first-pass lead sourcing and qualification as well as a human, in a fraction of the time.",
    build:
      "A custom Python script calling an LLM API directly — no no-code workflow tool, just code wired straight to the model — to source, qualify and draft outreach to leads.",
    result:
      "Noticeably cut the time spent on manual lead prospecting and outreach drafting compared to doing it by hand — enough to prove the concept, without a formal before/after measurement.",
    learning:
      "AI agents are excellent at the first-pass grind — sourcing, qualifying — but still need a human in the loop for judgment calls. The win is time saved, not full replacement.",
    interactive: false,
    tools: [],
    media: [],
    links: [],
  },
];

export const experiments = z.array(ExperimentSchema).parse(raw);
