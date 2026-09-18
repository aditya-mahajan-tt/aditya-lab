import { z } from "zod";
import { ExperienceEntrySchema } from "./schema";

/**
 * Work experience — distinct from /work, which is case studies. Drafted
 * from Aditya_Mahajan_OnePager.pdf (supplied 2026-09-05) and reviewed and
 * approved by Aditya on 2026-09-07 (draft-review marker removed; see
 * data/schema.ts's DRAFT_PATTERN comment).
 */
const raw = [
  {
    id: "turbotork",
    planes: ["ai", "product", "business"],
    // Ask the Lab grounds AI / leadership / founding questions here first —
    // this is the only role where Aditya owned product, led engineers, helped
    // close a round and shipped AI workflows himself. Aditya's call, 2026-09-18.
    leadTopics: [
      "AI",
      "AI product",
      "AI agents and automation",
      "leadership",
      "managing or leading a team",
      "entrepreneurship and founding",
      "startups and 0-to-1 building",
      "fundraising",
      "ownership and end-to-end product",
    ],
    company: "Turbotork Technologies Pvt. Ltd.",
    role: "AI Product Manager, Founder's Office",
    location: "Gurugram",
    start: "2025-07",
    end: "2026-05",
    bullets: [
      "Scaled fleet-service SaaS to 40+ clients and 400+ vehicles, generating ₹30L+ revenue in 5 months.",
      "Raised $250K pre-seed via Antler, shaping investor narrative and pitch as a founding team member.",
      "Built the MVP digitizing end-to-end service workflows across 1,000+ jobs using Next.js, React and Firebase.",
      "Enabled faster decisions by building finance, operations and inventory dashboards that identified cost leakages.",
      "Led a 2-member engineering team integrating Razorpay, GSTN, Twilio and Exotel across workflows.",
      "Boosted team productivity by roughly 70% by deploying AI agent workflows across planning and execution.",
    ],
    tools: ["Next.js", "React", "Firebase", "Razorpay", "GSTN", "Twilio", "Exotel"],
    highlights: [
      { value: "40+", label: "clients, ₹30L+ revenue in 5 months" },
      { value: "$250K", label: "pre-seed raised via Antler" },
      { value: "~70%", label: "productivity lift from AI agent workflows" },
    ],
  },
  {
    id: "accordion",
    company: "Accordion (formerly Merilytics)",
    role: "Senior Analyst / Business Associate",
    location: "Hyderabad",
    start: "2022-07",
    end: "2024-10",
    bullets: [
      "Supported portfolio growth from $5.6B to $6.9B through analytics-driven insights for C-suite leaders across 10+ teams.",
      "Reduced churn by 8% via A/B testing across millions of users, influencing PMO transition decisions.",
      "Saved 30+ hours per month by automating workflows using Python and Databricks.",
      "Reduced reporting effort by 60+ hours per month by scaling data infrastructure on Snowflake and Smartsheet.",
    ],
    tools: ["Python", "Databricks", "Snowflake", "Smartsheet", "SQL", "Power BI"],
    highlights: [
      { value: "$6.9B", label: "portfolio, up from $5.6B" },
      { value: "-8%", label: "churn reduction via A/B testing" },
      { value: "30+ hrs", label: "saved per month automating workflows" },
    ],
  },
  {
    id: "ultratech",
    company: "UltraTech Cement",
    role: "Data Analyst Intern",
    location: "Remote",
    start: "2020-05",
    end: "2020-07",
    bullets: [
      "Analyzed manufacturing energy consumption data, identifying efficiency gaps through industry benchmarking.",
    ],
    tools: [],
  },
];

export const experience = z.array(ExperienceEntrySchema).parse(raw);
