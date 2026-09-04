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
 * PROJECT_002 (Turbotork) is drafted from the resume Aditya supplied
 * (2026-09-04) — each prefixed with the draft-review marker, see
 * data/about.ts's comment. title, subtitle, summary, category, year,
 * status and tools are set directly (factual labels, not narrative
 * voice, and some feed page <title>/meta tags where a literal marker
 * would leak) — everything else is marked. PROJECT_001 and PROJECT_003
 * aren't on that resume at all and are untouched.
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
    title: "Turbotork",
    subtitle: "AI Product, 0→1",
    category: ["Product", "AI", "Automation"],
    year: "2025–2026",
    status: "CASE STUDY",
    featured: true,
    order: 2,

    summary:
      "Founding AI Product Manager scaling a fleet-service SaaS to 40+ clients and ₹30L+ revenue in five months, and helping raise a $250K pre-seed round.",

    context:
      "[AI_DRAFT_REVIEW] Turbotork was an early-stage fleet-service SaaS startup building software for vehicle service operations. I joined the founding team in the founder's office as the company's first AI Product Manager, working directly with the founders to turn a rough concept into a sellable product. The market was fragmented — service workflows were run on paper, spreadsheets and phone calls across hundreds of small operators, with no shared system of record.",

    problem:
      "[AI_DRAFT_REVIEW] Fleet and vehicle-service operators had no digitized way to track jobs, costs or inventory — decisions were made on gut feel because the underlying data didn't exist in one place. The further problem was proving the model would scale fast enough to justify outside capital: we needed real client traction, a working product and a credible investor narrative, all within months, with a two-person engineering team.",

    role:
      "[AI_DRAFT_REVIEW] Founding AI Product Manager, working out of the founder's office. I owned product direction end to end, led a two-person engineering team, shaped the investor narrative for fundraising, and built the operational dashboards the business ran on.",

    thinking:
      "[AI_DRAFT_REVIEW] The instinct was to digitize everything at once; the actual constraint was that a two-person engineering team couldn't build a full platform before the business needed proof it worked. I prioritized the workflow that directly touched revenue and client trust first — job tracking end-to-end — over internal tooling that felt important but wasn't yet load-bearing. AI wasn't the starting point; it became the lever once the core workflow existed, because the biggest bottleneck turned out to be planning and execution overhead, not lack of information. Layering AI agent workflows on top of an already-digitized process is what actually moved productivity, rather than trying to bolt AI onto paper-based operations that had no structured data to work from.",

    approach:
      "[AI_DRAFT_REVIEW] Started with the highest-leverage workflow — end-to-end job tracking — and built an MVP on Next.js, React and Firebase fast enough to onboard real clients within weeks, not quarters. Integrated the operational plumbing a fleet-service business actually depends on: Razorpay for payments, GSTN for compliance, and Twilio/Exotel for client communication, so the product could be sold into real operations immediately rather than run as a demo. Once the core workflow was live and generating data, I introduced AI agent workflows into planning and execution, and built finance, operations and inventory dashboards so the founders could see where the business was leaking cost.",

    execution:
      "[AI_DRAFT_REVIEW] Led a two-member engineering team building the MVP on Next.js, React and Firebase, digitizing service workflows across more than 1,000 jobs. Integrated Razorpay, GSTN, Twilio and Exotel so the product handled payments, compliance and communication natively rather than through manual workarounds. Built finance, operations and inventory dashboards that surfaced cost leakages the founders couldn't previously see. Deployed AI agent workflows across planning and execution, which became the single biggest productivity lever in the business. In parallel, I worked the fundraising side — shaping the investor narrative and pitch as part of the founding team — which contributed to closing a $250K pre-seed round via Antler.",

    outcome:
      "[AI_DRAFT_REVIEW] Scaled to 40+ clients and 400+ vehicles on the platform, generating ₹30L+ revenue in five months. AI agent workflows lifted team productivity by roughly 70% across planning and execution. The company raised a $250K pre-seed round via Antler, with the investor narrative shaped as part of the founding team's fundraising effort. (Figures as stated on Aditya's resume — self-reported.)",

    learnings: [
      "[AI_DRAFT_REVIEW] A two-person engineering team can't build everything — sequencing which workflow to digitize first mattered more than raw execution speed.",
      "[AI_DRAFT_REVIEW] AI delivered the most value only after the core workflow was already digitized — it's a multiplier on structured data, not a fix for the absence of it.",
      "[AI_DRAFT_REVIEW] Fundraising and product work compete for the same hours in a founding team; the investor narrative needed a real workflow live behind it, not just a deck.",
      "[AI_DRAFT_REVIEW] Operational dashboards changed decisions faster than expected — founders acted on cost-leakage data within days of seeing it for the first time.",
    ],
    tools: ["Next.js", "React", "Firebase", "Razorpay", "GSTN", "Twilio", "Exotel"],
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
