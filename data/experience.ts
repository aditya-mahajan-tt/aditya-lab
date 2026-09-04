import { z } from "zod";
import { ExperienceEntrySchema } from "./schema";

/**
 * Work experience — distinct from /work, which is case studies. Drafted
 * from Aditya_Mahajan_OnePager.pdf (supplied 2026-09-05) — each bullet
 * prefixed with the draft-review marker (see data/schema.ts's DRAFT_PATTERN
 * comment), so it renders with a visible review flag and fails a
 * production build until reviewed. Written as a literal string, not a
 * shared constant — DRAFT_PATTERN explains why.
 */
const raw = [
  {
    id: "turbotork",
    company: "Turbotork Technologies Pvt. Ltd.",
    role: "AI Product Manager, Founder's Office",
    location: "Gurugram",
    start: "2025-07",
    end: "2026-05",
    bullets: [
      "[AI_DRAFT_REVIEW] Scaled fleet-service SaaS to 40+ clients and 400+ vehicles, generating ₹30L+ revenue in 5 months.",
      "[AI_DRAFT_REVIEW] Raised $250K pre-seed via Antler, shaping investor narrative and pitch as a founding team member.",
      "[AI_DRAFT_REVIEW] Built the MVP digitizing end-to-end service workflows across 1,000+ jobs using Next.js, React and Firebase.",
      "[AI_DRAFT_REVIEW] Enabled faster decisions by building finance, operations and inventory dashboards that identified cost leakages.",
      "[AI_DRAFT_REVIEW] Led a 2-member engineering team integrating Razorpay, GSTN, Twilio and Exotel across workflows.",
      "[AI_DRAFT_REVIEW] Boosted team productivity by roughly 70% by deploying AI agent workflows across planning and execution.",
    ],
    tools: ["Next.js", "React", "Firebase", "Razorpay", "GSTN", "Twilio", "Exotel"],
  },
  {
    id: "accordion",
    company: "Accordion (formerly Merilytics)",
    role: "Senior Analyst / Business Associate",
    location: "Hyderabad",
    start: "2022-07",
    end: "2024-10",
    bullets: [
      "[AI_DRAFT_REVIEW] Supported portfolio growth from $5.6B to $6.9B through analytics-driven insights for C-suite leaders across 10+ teams.",
      "[AI_DRAFT_REVIEW] Reduced churn by 8% via A/B testing across millions of users, influencing PMO transition decisions.",
      "[AI_DRAFT_REVIEW] Saved 30+ hours per month by automating workflows using Python and Databricks.",
      "[AI_DRAFT_REVIEW] Reduced reporting effort by 60+ hours per month by scaling data infrastructure on Snowflake and Smartsheet.",
    ],
    tools: ["Python", "Databricks", "Snowflake", "Smartsheet", "SQL", "Power BI"],
  },
  {
    id: "ultratech",
    company: "UltraTech Cement",
    role: "Data Analyst Intern",
    location: "Remote",
    start: "2020-05",
    end: "2020-07",
    bullets: [
      "[AI_DRAFT_REVIEW] Analyzed manufacturing energy consumption data, identifying efficiency gaps through industry benchmarking.",
    ],
    tools: [],
  },
];

export const experience = z.array(ExperienceEntrySchema).parse(raw);
