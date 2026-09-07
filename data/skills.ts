import { z } from "zod";
import { SkillGroupSchema } from "./schema";

/**
 * CONTENT_INTAKE.md §F.
 * Organised by capability, not by software list.
 * Mark depth honestly — a technical reviewer will test the strongest claim.
 *
 * Descriptions drafted from the resume Aditya supplied (2026-09-04) and
 * approved by Aditya on 2026-09-07 (draft-review markers removed; see
 * data/schema.ts's DRAFT_PATTERN comment).
 */
const raw = [
  {
    id: "THINK",
    planes: ["business"],
    description:
      "Strategy work grounded in real operating data — segmentation, portfolio analytics and problem framing built for C-suite decisions, not slide decks.",
    items: [
      { name: "Strategy", depth: "comfortable" },
      { name: "Research", depth: "comfortable" },
      { name: "Segmentation", depth: "comfortable" },
      { name: "Problem framing", depth: "comfortable" },
      { name: "SQL", depth: "comfortable" },
      { name: "Power BI", depth: "comfortable" },
    ],
  },
  {
    id: "BUILD",
    planes: ["product"],
    description:
      "Shipping working products with a small team — from a fleet-service SaaS MVP to a D2C storefront, built rather than just specified.",
    items: [
      { name: "Websites", depth: "comfortable" },
      { name: "Apps", depth: "working knowledge" },
      { name: "UI/UX", depth: "comfortable" },
      { name: "Product", depth: "comfortable" },
    ],
  },
  {
    id: "AUTOMATE",
    planes: ["product"],
    description:
      "Turning manual operations into repeatable workflows — payments, compliance and communications wired together so a two-person team can run at scale.",
    items: [
      { name: "Make", depth: "comfortable" },
      { name: "APIs", depth: "comfortable" },
      { name: "Webhooks", depth: "comfortable" },
      { name: "Workflows", depth: "comfortable" },
      { name: "Python", depth: "comfortable" },
      { name: "Databricks", depth: "comfortable" },
      { name: "Snowflake", depth: "comfortable" },
      { name: "Smartsheet", depth: "working knowledge" },
    ],
  },
  {
    id: "INTELLIGENCE",
    planes: ["ai"],
    description:
      "Layering AI agent workflows onto already-digitized processes, where it's a genuine productivity multiplier rather than a bolt-on.",
    items: [
      { name: "LLMs", depth: "comfortable" },
      { name: "AI agents", depth: "working knowledge" },
      { name: "AI interfaces", depth: "comfortable" },
      { name: "RAG", depth: "working knowledge" },
    ],
  },
  {
    id: "GROW",
    planes: ["business"],
    description:
      "GTM and fundraising narrative work — from a $250K pre-seed raise to a 100-member outreach team generating ₹40L+ in revenue.",
    items: [
      { name: "Marketing", depth: "comfortable" },
      { name: "GTM", depth: "comfortable" },
      { name: "Growth", depth: "working knowledge" },
      { name: "Content", depth: "comfortable" },
    ],
  },
];

export const skillGroups = z.array(SkillGroupSchema).parse(raw);
