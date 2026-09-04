import { z } from "zod";
import { SkillGroupSchema } from "./schema";

/**
 * CONTENT_INTAKE.md §F.
 * Organised by capability, not by software list.
 * Mark depth honestly — a technical reviewer will test the strongest claim.
 */
const raw = [
  {
    id: "THINK",
    description: "[SKILLS_THINK_DESCRIPTION_REQUIRED]",
    items: [
      { name: "Strategy", depth: "comfortable" },
      { name: "Research", depth: "comfortable" },
      { name: "Segmentation", depth: "comfortable" },
      { name: "Problem framing", depth: "comfortable" },
    ],
  },
  {
    id: "BUILD",
    description: "[SKILLS_BUILD_DESCRIPTION_REQUIRED]",
    items: [
      { name: "Websites", depth: "comfortable" },
      { name: "Apps", depth: "working knowledge" },
      { name: "UI/UX", depth: "comfortable" },
      { name: "Product", depth: "comfortable" },
    ],
  },
  {
    id: "AUTOMATE",
    description: "[SKILLS_AUTOMATE_DESCRIPTION_REQUIRED]",
    items: [
      { name: "Make", depth: "comfortable" },
      { name: "APIs", depth: "comfortable" },
      { name: "Webhooks", depth: "comfortable" },
      { name: "Workflows", depth: "comfortable" },
    ],
  },
  {
    id: "INTELLIGENCE",
    description: "[SKILLS_INTELLIGENCE_DESCRIPTION_REQUIRED]",
    items: [
      { name: "LLMs", depth: "comfortable" },
      { name: "AI agents", depth: "working knowledge" },
      { name: "AI interfaces", depth: "comfortable" },
      { name: "RAG", depth: "working knowledge" },
    ],
  },
  {
    id: "GROW",
    description: "[SKILLS_GROW_DESCRIPTION_REQUIRED]",
    items: [
      { name: "Marketing", depth: "comfortable" },
      { name: "GTM", depth: "comfortable" },
      { name: "Growth", depth: "working knowledge" },
      { name: "Content", depth: "comfortable" },
    ],
  },
];

export const skillGroups = z.array(SkillGroupSchema).parse(raw);
