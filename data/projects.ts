import { z } from "zod";
import { ProjectSchema } from "./schema";

/**
 * CONTENT_INTAKE.md §C.
 *
 * Ship V1 with THREE excellent case studies, not seven thin ones.
 * Every `_REQUIRED`-suffixed placeholder token below must be replaced
 * before production — `npm run check:placeholders` fails the production
 * build otherwise (see CLAUDE.md §7 for the exact token format).
 *
 * Adding a project = adding one object here. Nothing else changes.
 *
 * 2026-09-19: the 2026-09-05 decision to keep Turbotork out of this file is
 * deliberately reversed. It was defensible while the only source material
 * was six resume bullets; once the studio repo (TT Garage Portal) was
 * supplied as source of truth, Turbotork became the deepest-evidenced work
 * on the site and the only entry spanning all three planes. Keeping the
 * deepest evidence on the shallowest surface was also what made it
 * unlinkable by lib/ai/link-suggestions.ts, which only ranks projects and
 * experiments. The /about experience entry remains, trimmed to a pointer.
 *
 * Product surfaces, architecture patterns and integration names are in
 * scope; client names, invoice and revenue records, and any link to the
 * studio repo are not — that repo holds customer exports, real invoices
 * and a signature image.
 * See docs/superpowers/specs/2026-09-19-turbotork-case-study-design.md §5.2.
 *
 * 2026-09-10: context/problem/thinking/approach/execution/learnings for
 * goSTOPS, Kensara AI and Adda, and the whole of Project 004 (LeadIQ,
 * replacing the untouched "cricket-game" stub), were drafted from source
 * material Aditya supplied directly (gostops_strategy_deck.pdf,
 * Kensara AI_Catalysis'T'26.pdf, Adda_Store_Setup_AddaStore,
 * LeadIQ-Submission.pdf, his OnePager) and approved as final by Aditya the
 * same day.
 */
const raw = [
  {
    id: "005",
    slug: "turbotork",
    planes: ["ai", "product", "business"],
    title: "Turbotork",
    subtitle: "Fleet-Service SaaS, 0→1",
    category: ["Product", "AI", "Automation"],
    year: "2025–2026",
    status: "SHIPPED",
    featured: true,
    order: 1,
    // Ask the Lab grounds AI / leadership / founding questions here first.
    // Moved from the data/experience.ts entry (2026-09-19) along with the
    // content it points at. See lib/ai/system-prompt.ts rule 9.
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

    summary:
      "Founding AI Product Manager at an early-stage fleet-service SaaS: owned the product end to end, led two engineers, and built the agent workflow that let a two-person team ship a multi-product platform — inspections, diagnostics, analytics, billing and customer portals — to 40+ clients.",

    context:
      "Turbotork is an early-stage fleet-service business running vehicle servicing for corporate fleets. Aditya joined out of the founder's office as its founding AI Product Manager, with the garage operation running the way most of the category still does: job cards on paper, pricing in spreadsheets, and status updates over phone calls.",
    problem:
      "Nothing was measurable. Without a system of record there was no turnaround time to improve, no cost leakage to find, and no way to tell a fleet customer where their vehicle was. Demand could be scaled by adding people; throughput could not — and the engineering team available to fix that was two people.",
    role: "Founding AI Product Manager, Founder's Office — owned the product end to end, led a two-person engineering team, and helped shape the pitch that closed the pre-seed round.",
    thinking:
      "Two questions decided the sequence. First: what actually binds? Not demand — measurability, which meant the system of record had to exist before anything clever could run on it. Second, applied to the team itself: where does a two-person engineering team's time actually go? Not typing. Planning, rebuilding context, and review. That reframed engineering throughput as a product problem with its own users, and it is what produced the agent workflow — not an interest in agents for their own sake.",
    approach:
      "Two systems, built together. The platform: a strict service layer over Firestore with every mutation routed through server actions, and five distinct roles from technician to fleet driver, so the data model enforced who could do what rather than the UI hiding it. And the workflow that built it: four agents — planner, implementer, reviewer, release — with declared tool postures and explicit handoffs, backed by fourteen domain skill definitions and a short list of architectural rules the agents had to obey. Encoding the rules beat reviewing the output, because review effort scales with volume and a constraint does not.",
    execution:
      "The platform grew from one workflow to five. Digital job cards first, then TT Xpress — structured vehicle inspections driven by versioned templates holding their own thresholds, section weights and scoring rules, so the service standard could change without a deploy. Then OBD diagnostics with a fault-code library and health scoring, surfaced to fleet customers as a public, login-free report page. Then analytics over revenue, turnaround time and technician workload, and billing with GST-compliant invoicing and financial-year invoice counters. Payments, vehicle-registration lookup, WhatsApp and voice were integrated as the operation needed them.",
    outcome:
      "40+ clients and 400+ vehicles, ₹30L+ revenue in five months across 1,000+ jobs, and a $250K pre-seed round closed via Antler on a pitch Aditya helped shape as a founding team member.",
    // learnings and reflection were drafted from the studio repo
    // (TT Garage Portal, supplied 2026-09-19) and approved by Aditya the
    // same day, so they carry no draft-review marker — the same
    // handling the goSTOPS / Kensara / Adda / LeadIQ narratives got on
    // 2026-09-10. Aditya intends to revise the wording into his own voice;
    // that is an edit to shipped copy, not a blocked placeholder.
    learnings: [
      "AI multiplies structure; it cannot create it. The repair-suggestion and summarisation features only worked because the job-card workflow had already turned a paper process into clean, consistent records. Had the AI gone first, it would have had nothing to be good at — the sequencing wasn't project management, it was the bet.",
      "With AI writing most of the code, reviewing output is the wrong lever. Review effort scales with volume, and volume was suddenly unbounded. What actually held quality was a short list of architectural rules the agents had to obey, because a constraint costs the same whether it governs ten changes or a thousand.",
      "A two-person team's real bottleneck was never typing speed — it was planning, context-rebuilding and review. Splitting the work into named roles with explicit handoffs bought more than any individual tool did, because it attacked the coordination cost rather than the keystroke cost.",
    ],
    reflection:
      "I wrote over two hundred internal documents and close to zero meaningful automated tests. At the time that felt like diligence; in hindsight it was the same instinct pointed at the wrong target. Documentation captures what I understood on the day I wrote it and then silently rots. A test captures it and keeps checking. Given how much of the code was AI-generated, tests were exactly the constraint I most needed and least built — I enforced architecture rules on the agents rigorously and left correctness to manual QA. If I ran it again, the agent rules and the test suite would go in together, on day one, because they are the same idea: make the system tell you when it is wrong instead of hoping someone notices.",

    tools: [
      "Next.js", "React", "TypeScript", "Firebase", "Firestore",
      "Google AI / Genkit", "Twilio", "Razorpay", "GSTN", "Exotel",
    ],
    process: [
      { label: "SYSTEM OF RECORD", detail: "Digitise the job-card workflow end to end, so operations produce data instead of paper." },
      { label: "INSPECTION", detail: "Versioned inspection templates carrying their own thresholds and scoring, so the standard changes without a deploy." },
      { label: "DIAGNOSTICS", detail: "Fault-code library and health scoring, surfaced to fleet customers as a login-free report." },
      { label: "INTELLIGENCE", detail: "Analytics and AI workflows layered onto data the earlier steps had already made clean." },
      { label: "LEVERAGE", detail: "Four agent roles with explicit handoffs, so a two-person team's bottleneck was coordination, not keystrokes." },
    ],
    metrics: [
      { label: "clients", value: "40+", note: "400+ vehicles under service" },
      { label: "revenue in 5 months", value: "₹30L+", note: "across 1,000+ jobs" },
      { label: "pre-seed raised", value: "$250K", note: "via Antler" },
    ],
    links: [],
  },
  {
    id: "001",
    slug: "gostops-gtm",
    planes: ["business"],
    title: "goSTOPS",
    subtitle: "GTM Strategy",
    category: ["Strategy", "Marketing", "Segmentation"],
    year: "2026",
    // Was "CASE STUDY" / order 1 — the Work list's lead slot. Diagnostic
    // Report §02/§17: this project's narrative fields are still almost
    // entirely placeholders, so the "CASE STUDY" tag and lead position moved
    // to Adda (order 3 below) until real content lands here. Revert both
    // once goSTOPS is written.
    status: "IN PROGRESS",
    featured: true,
    order: 4,

    summary:
      "Primary market research and behavioural segmentation for goSTOPS' monsoon (JAS) offsite push — a 12-variable framework, a single-survey Google Form, and a 2×2 behavioural segmentation used to pick which companies to target and how to price the offer.",

    context:
      "goSTOPS wanted to grow company-offsite bookings during its traditionally slow monsoon (July–September) season, but rather than guess at which kind of company to target, the project treated audience segmentation as something to derive from data, not assume upfront.",
    problem:
      "Standard demographic segments don't predict who actually books an offsite — a company's real behaviour (how remote the team is, how infrastructure-dependent it is, how price-sensitive it is) turned out to matter more than its size or industry, and none of that was measurable without primary research designed specifically to capture it.",
    role: "Team effort — contributed across the full project, from research and segmentation through strategy and execution.",
    thinking:
      "Work started from the business problem, not the audience: 12 behavioural variables were defined first — each mapped to a specific hypothesis about what drives offsite decisions — before a single survey question was written, so every question in the resulting Google Form existed to measure one variable, not to poll opinion generally.",
    approach:
      "Survey responses were standardised into the 12 variables, then clustered into a 2×2 behavioural segmentation (not simple demographic buckets) — Monsoon-Ready Hostel-Lovers, Curious but Cautious, Deal Hunters and Traditionalists — and each segment was scored against six weighted criteria (JAS willingness, product fit, revenue potential, ease of acquisition, operational feasibility, competitive differentiation) to rank which to prioritise.",
    execution:
      "Monsoon-Ready Hostel-Lovers scored highest (4.5/5.0, driven by remote/hybrid team structure and a direct founder/HR purchasing path) and became the primary target, backed by a priced product pack (Founder's Cabin & Tech Sprints); Deal Hunters and Curious-but-Cautious were kept as secondary segments with their own offers — weekday flash pricing locked before September 30, and a monsoon-flex rebooking guarantee to de-risk the one weak cell in the scorecard, operational feasibility during monsoon upkeep.",
    // outcome intentionally omitted until there is a real, defensible one.
    learnings: [
      "Stated willingness isn't intent — a respondent saying monsoon pricing is appealing doesn't predict booking behaviour on its own; operational signals like infrastructure dependency and team structure turned out to be the stronger predictors, which is why the segmentation was built on behaviour, not survey sentiment alone.",
    ],

    tools: ["Google Forms"],
    process: [
      { label: "PROBLEM" },
      { label: "RESEARCH" },
      { label: "SEGMENTATION" },
      { label: "STRATEGY" },
      { label: "EXECUTION" },
    ],
    links: [],
  },
  {
    id: "002",
    slug: "kensara-ai-gtm",
    planes: ["business", "product"],
    title: "Kensara AI",
    subtitle: "GTM & Partnership Strategy",
    category: ["Strategy", "GTM"],
    year: "2026",
    status: "CASE STUDY",
    // Not on the homepage: the resume gives one bullet for this one, not
    // enough to earn a featured slot yet — see data/experience.ts's sibling
    // reasoning. Still a full entry in the /work archive.
    featured: false,
    order: 3,

    summary:
      "Leading GTM and partnership strategy for an AI startup — Team Audax won the IIT Guwahati case competition outright, finishing first out of 120 teams.",

    context:
      "Kensara AI is an early-stage AI compliance platform entering the market right as India's Digital Personal Data Protection Act (DPDPA) creates a real but finite window — full-force enforcement lands by May 2027, with penalties up to ₹250 Cr or 4% of global turnover — giving roughly nine months to build awareness and convert enterprises before that urgency fades.",
    problem:
      "As part of the Catalysis'T national case competition (IIT Guwahati), five-person Team Audax had one month to design and pressure-test a customer-acquisition strategy for Kensara AI — not just a GTM deck, but real competitive benchmarking, real outreach, and real market signal to prove the strategy would work before recommending it.",
    role: "Team Lead — leading GTM and partnership strategy for an AI startup as part of a case-competition team.",
    thinking:
      "The core bet: don't sell Kensara everywhere — sell the regulatory trigger (DPDPA), not the compliance-software category, and build distribution where trust already exists (CA firms, CISO/DPO communities) rather than broad outbound. DPDPA becomes the entry wedge; GRC and AI Governance are the expansion path once Kensara is inside the account; continuous monitoring and evidence generation are what keep it there.",
    approach:
      "Five workstreams ran in parallel: competitive intelligence (live product demos with two category incumbents, benchmarked against Kensara's own compliance-operating-layer positioning), customer acquisition (direct outreach and warm introductions), Reddit community and answer-engine optimisation (practitioner-led posts in compliance/cybersecurity communities, used as a live voice-of-customer channel rather than pure marketing), market and ecosystem mapping (CA-firm white-label distribution, CISO/DPO communities, sponsored seminars), and a phased GTM roadmap tying acquisition activity to the DPDPA enforcement timeline.",
    execution:
      "The Reddit workstream alone generated a reported 100K+ cumulative post reach and one flagship security thread with 32 upvotes and 49 comments from practitioners describing real compliance pain — evidence used directly to sharpen Kensara's positioning, not just to build visibility. Combined with direct outreach, the month produced qualified leads and several pilot conversations in progress, testing the DPDPA-entry-wedge strategy against real market response rather than a hypothesis alone.",
    outcome: "Team Audax won the Catalysis'T'26 national case competition outright — first place out of 120 teams.",
    learnings: [
      "The strongest buying signal wasn't interest in \"another compliance platform\" — it was operational pain: evidence collection and proving controls exist were what practitioners actually complained about. And on AI specifically, practitioners trusted it for repetitive work but wanted humans to keep interpretation and accountability — a distinction worth designing the product around, not just the pitch.",
    ],

    tools: [],
    links: [],
  },
  {
    id: "003",
    slug: "adda-d2c",
    planes: ["product", "business"],
    title: "Adda",
    subtitle: "D2C E-commerce Venture",
    category: ["Product", "E-commerce"],
    year: "2026",
    // Led the Work list from 2026-09-10 as "the most complete project
    // narrative on the site". Turbotork took that slot on 2026-09-19 — the
    // reason for the promotion expired when a deeper narrative landed.
    status: "CASE STUDY",
    featured: true,
    order: 2,

    summary:
      "Built a Shopify-based D2C e-commerce store end-to-end — product research, vendor sourcing and payment integration — as founder.",

    context:
      "Adda (अड्डा — Hindi for \"a gathering place\") is a D2C wellness and lifestyle-electronics brand Aditya founded, launching with a massage gun as its first SKU into a category dominated by RGB/sport-styled incumbents like boAt and JBL.",
    problem:
      "Category-leading massage guns had a documented quality gap — reviewers consistently flagged build-quality and motor/battery complaints on the market's #1 bestseller — but closing that gap meant standing up a store, a payment stack and a distinct brand fast enough to catch the Raksha Bandhan and Diwali gifting season, without over-building before the SKU was validated.",
    role: "Founder — owned the venture end-to-end, from product research and vendor sourcing to payment integration.",
    thinking:
      "Four decisions had to be made to go from strategy to a live, checkout-ready store — who the store is built for, which platform to build it on, how the brand shows up, and which payment gateway to use — and each was treated as a real trade-off against named criteria, not a default choice.",
    approach:
      "Shopify won on launch speed and India-specific app ecosystem (COD/RTO tracking, Razorpay/PayU support) over WooCommerce and Dukaan, with enough theme flexibility to carry a deliberately heritage-leaning identity — navy and mustard, a Devanagari wordmark — instead of reading as a templated storefront. Razorpay won on UPI depth, native Shopify integration and built-in COD reconciliation, which mattered directly since the unit-economics model already priced in a 10% return-to-origin rate on cash-on-delivery orders.",
    execution:
      "Built a Shopify-based D2C storefront end-to-end, covering product research, vendor sourcing, and payment integration.",
    outcome:
      "Generated over ₹1L+ in revenue within the first 2 months, across the Shopify store and offline sales. (As stated on Aditya's resume — self-reported.)",
    learnings: [
      "Cash-on-delivery, not card or UPI alone, drives this category's buying behaviour in Tier-1/Tier-2 India — so the payment gateway decision had to be judged on COD reconciliation tooling as much as on checkout speed, not treated as a generic \"pick the cheapest processor\" call.",
    ],

    tools: ["Shopify", "Razorpay"],
    process: [
      { label: "PRODUCT RESEARCH" },
      { label: "VENDOR SOURCING" },
      { label: "PAYMENT INTEGRATION" },
    ],
    links: [],
  },
  {
    id: "004",
    slug: "leadiq",
    planes: ["product"],
    title: "LeadIQ",
    subtitle: "Lead Discovery & Prospecting Dashboard",
    category: ["Product", "Automation"],
    year: "2026",
    status: "SHIPPED",
    featured: true,
    order: 5,

    summary:
      "A personal, single-user lead-discovery dashboard — pulls real local businesses from OpenStreetMap, audits each one's live website against a set of checkable signals, and turns the gaps it finds into a score and a specific, evidence-backed outreach angle.",
    context:
      "Built as a course assessment submission and used as a real, hosted tool — LeadIQ exists for anyone selling website, automation or AI-integration services into local businesses, who otherwise spends hours per prospect searching maps, reading each site, and guessing at a pitch.",
    problem:
      "A plain list of business names and phone numbers isn't a pipeline — it doesn't tell a salesperson why a given business is worth calling or what to say. LeadIQ had to automate the research step itself: finding real local businesses, and reading their websites the way a human researcher would, to produce a reason to reach out, not just a contact.",
    role: "Solo builder — designed and built the product end-to-end: discovery, the rule-based audit/scoring engine, the lead pipeline UI, and the auth and security fixes that shipped with it.",
    thinking:
      "A lead's score isn't \"how polished is this website\" — it's \"how much real, sellable opportunity exists here.\" A slick site with no gaps scores low because there's nothing left to pitch; a business with real, fixable problems scores high, because that's exactly what a cold outreach message needs.",
    approach:
      "From a campaign (an industry + a location), Discover queries OpenStreetMap's Overpass API for real local businesses and flags duplicates against existing leads. Adding a lead fetches its actual website and runs a rule-based audit — HTTPS, contact form, CTA language, FAQ density, Shopify/WooCommerce platform, live chat, mobile viewport — in order of severity, producing a score, an opportunity category (Website, Automation, AI Integration, Shopify UX) and a one- or two-sentence outreach angle grounded in what the audit actually found, not a template.",
    execution:
      "Leads move through a real status lifecycle — Discovered → Enriched → Analysed → Qualified/Manual Review → Contacted → Replied → Call Booked → Client — worked from a filterable grid or a Kanban board with native drag-and-drop. Built on Next.js 15, React 19, TypeScript and Supabase (Auth + Postgres), deployed on Vercel; two real security issues were found and fixed during build — an open-redirect vulnerability in the Google sign-in flow, and a missing SSRF protection on the site-fetcher that let the audit engine request arbitrary URLs server-side.",
    learnings: [
      "The riskiest part of the product wasn't the lead-scoring logic — it was the plumbing: a server that fetches arbitrary user-supplied URLs is an SSRF risk by default, and a login redirect is an open-redirect risk by default, unless you specifically close both. Neither showed up until they were looked for directly.",
    ],

    tools: ["Next.js", "React", "TypeScript", "Supabase", "OpenStreetMap Overpass API", "Vercel"],
    process: [
      { label: "DISCOVER", detail: "Define a campaign — industry + location — and pull real local businesses from OpenStreetMap via the Overpass API." },
      { label: "AUDIT", detail: "Fetch each lead's live website and check it against concrete signals: HTTPS, contact capture, CTA language, FAQ density, platform, live chat, mobile viewport." },
      { label: "SCORE", detail: "Turn the gaps found into a score, an opportunity category, and a specific outreach angle grounded in what was actually found on the page." },
      { label: "PIPELINE", detail: "Work leads through a real status lifecycle — Discovered through Client — in a filterable grid or a Kanban board." },
    ],
    links: [{ label: "Live App", url: "https://leadiq-o2qtusay3-aditya-mahajan-tt.vercel.app" }],
  },
];

export const projects = z.array(ProjectSchema).parse(raw);
