import { z } from "zod";
import { ExperienceEntrySchema } from "./schema";

/**
 * Work experience, listed on /work (onWork: false keeps an entry on the
 * About timeline only). Drafted
 * from Aditya_Mahajan_OnePager.pdf (supplied 2026-09-05) and reviewed and
 * approved by Aditya on 2026-09-07 (draft-review marker removed; see
 * data/schema.ts's DRAFT_PATTERN comment).
 *
 * 2026-11-25: aligned with Aditya_Mahajan_Product_Resume.pdf — Turbotork
 * title (Co-Founder | Head of Product), start (Apr'25) and revenue framing;
 * Accordion title, location and the $5.6B→$6.9B figure (initiative value
 * for a US media major, not portfolio growth); UltraTech role, dates
 * (Apr–Jun 2022) and location.
 */
const raw = [
  {
    id: "turbotork",
    company: "Turbotork Technologies Pvt. Ltd.",
    role: "Co-Founder | Head of Product",
    location: "Gurugram",
    start: "2025-04",
    end: "2026-05",
    // Trimmed 2026-09-19: the full narrative moved to /work/turbotork. A few
    // bullets and the highlights are what the /about timeline needs; the
    // corpus should not carry the same story twice.
    bullets: [
      "Ideated and solely built the fleet-ops MVP (GCP, Firebase) and owned the product end to end. Hired and led a 2-member SDE team, from sourcing and technical interviews to evaluation and onboarding.",
      "Scaled to 40+ B2B clients and 400+ vehicles, hitting ₹5–6L monthly revenue five months after launch, and secured a $250K pre-seed via Antler Residency. Full case study at /work/turbotork.",
    ],
    tools: ["Next.js", "React", "Firebase", "GCP", "Razorpay", "GSTN", "Twilio", "Exotel"],
    highlights: [
      { value: "40+", label: "B2B clients, ₹5–6L monthly revenue five months after launch" },
      { value: "$250K", label: "pre-seed raised via Antler Residency" },
      { value: "~70%", label: "sprint output lift from an AI agent workflow" },
    ],
  },
  {
    id: "accordion",
    planes: ["business"], // puts Accordion on the hero's outer ring
    company: "Accordion (formerly Merilytics)",
    role: "Business Associate / Senior Business Analyst",
    location: "Mumbai",
    start: "2022-07",
    end: "2024-10",
    bullets: [
      "Cut subscriber churn 8% by running A/B tests on retention journeys across millions of users.",
      "Built initiative-health and financial dashboards tracking 200 initiatives ($6B+) for a US media major.",
      "Gathered requirements from 10 workstreams to ship 4 dashboard suites: financial, ops, tracking and health.",
      "Presented insights in 2x-weekly AVP and monthly SVP/CXO-1 reviews on initiative progress and risks.",
      "Grew initiative value from $5.6B to $6.9B in year 1 via financial outlook models and initiative health tracking.",
      "Built monitoring for $1.5B of system and IP transfers between the client and its telecom parent.",
      "Cut reporting effort by 60+ hours per month by scaling Snowflake data infrastructure with automated anomaly alerts.",
      "Saved 30+ hours per month automating workflows on Python and Databricks, and action items via Asana–Zapier.",
      "Promoted to Business Associate in 15 months, leading a 3-analyst team with direct client ownership.",
    ],
    tools: ["Python", "Databricks", "Snowflake", "Smartsheet", "SQL", "Power BI", "Asana", "Zapier"],
    // Added 2026-11-25: without these, role/strength/analytics questions
    // often skipped this entry and answers only mentioned Turbotork.
    leadTopics: [
      "analytics",
      "data-driven decision making",
      "media and entertainment analytics",
      "A/B testing and experimentation",
      "workflow automation",
      "reporting and data infrastructure",
    ],
    highlights: [
      { value: "$6.9B", label: "initiative value, up from $5.6B in year 1" },
      { value: "-8%", label: "subscriber churn via A/B testing" },
      { value: "30+ hrs", label: "saved per month automating workflows" },
    ],
  },
  {
    id: "ultratech",
    company: "UltraTech Cement",
    role: "Summer Intern – Data Analyst",
    location: "Mumbai",
    start: "2022-04",
    end: "2022-06",
    bullets: [
      "Identified cost-saving levers by benchmarking plant energy consumption against industry leaders.",
      "Maintained SQL-driven data pipelines and scripts, resolving 30+ internal tickets within 2 months.",
    ],
    tools: ["SQL"],
    onWork: false,
  },
];

export const experience = z.array(ExperienceEntrySchema).parse(raw);
