import { AboutSchema } from "./schema";

/**
 * CONTENT_INTAKE.md §B. Word counts are in that file — stick to them.
 *
 * shortBio, longBio, progression bodies and problemsIEnjoy were drafted
 * from the resume Aditya supplied (2026-09-04) and reviewed and approved
 * by Aditya on 2026-09-07 (draft-review marker removed; see
 * data/schema.ts's DRAFT_PATTERN comment). Rewritten in the first person
 * 2026-11-18 (same facts) after portfolio feedback.
 *
 * 2026-11-25: aligned with Aditya_Mahajan_Product_Resume.pdf — Turbotork
 * role (Co-Founder | Head of Product) and revenue framing, "sprint output
 * ~70%", and the Accordion figures (initiative value, US media major).
 */
export const about = AboutSchema.parse({
  // Hero one-liner under the name; every fact here is already in longBio.
  heroRole: "Product manager · ex-co-founder, Head of Product at Turbotork · PGP, Masters' Union",
  // Proof first (figures from longBio); the positioning moves to the subline.
  heroHeadline: "I took a fleet-service SaaS to 40+ clients and ₹5–6L monthly revenue five months after launch.",
  heroSubline: "AI × Product × Business. Welcome to my digital laboratory.",

  shortBio:
    "I'm a 0→1 operator who moves between strategy, product and analytics. I spent two years in Accordion's private equity practice, building the decision dashboards and forecasting models behind 200 initiatives worth $6B+ for a US media major, where initiative value grew from $5.6B to $6.9B in year one. Then I co-founded an early-stage fleet-service SaaS, Turbotork, as Head of Product: I solely built the MVP, scaled to 40+ clients and ₹5–6L monthly revenue five months after launch, and secured a $250K pre-seed round. I'm now at Masters' Union, deepening the product and AI side of that instinct.",

  longBio:
    "I trained as a chemical engineer at BITS Pilani, then spent three years finding out that the parts of engineering I liked most weren't really about chemistry — they were about turning ambiguous, messy problems into systems that work. That instinct took me to Accordion, where as part of the Private Equity practice I gathered requirements from ten workstreams for a US media major and ran the analytics — A/B tests on retention journeys that cut subscriber churn 8%, dashboards tracking 200 initiatives worth $6B+, financial outlook models, workflow automation — that AVP and SVP/CXO-1 reviews used to make real decisions; initiative value grew from $5.6B to $6.9B in year one. Two years in, I wanted to be closer to the building itself, not just the analysis of it. That led me to Turbotork, an early-stage fleet-service SaaS, which I co-founded and ran product for as Head of Product: I ideated and solely built the fleet-ops MVP, owned product end to end, hired and led a two-person engineering team, secured a $250K pre-seed round via Antler Residency, and scaled the platform to 40+ clients and ₹5–6L monthly revenue five months after launch, while designing an AI agent workflow that lifted sprint output by roughly 70% — the full case study is at /work/turbotork. I'm now at Masters' Union, in the Post Graduate Programme in Technology & Business Management, sharpening the product and AI instincts that engineering, analytics and founding work each gave me a different piece of — alongside leading GTM strategy for an AI startup through the Kensara AI case competition, and building a D2C Shopify venture, Adda, end to end. What I'm chasing now is the same thing that pulled me out of a lab coat in the first place: problems messy enough that nobody's built the system for them yet.",

  progression: [
    {
      label: "CURIOUS",
      body:
        "Trained as a chemical engineer at BITS Pilani — then spent three years discovering the questions interested me more than the reactions.",
    },
    {
      label: "BUILDER",
      body:
        "Solely built a fleet-service SaaS MVP at Turbotork, and a Shopify D2C store end-to-end as founder of Adda.",
    },
    {
      label: "MARKETER",
      body:
        "Ran a 100-member outreach team at BITS Pilani generating ₹40L+ in sponsorship revenue across 20,000+ attendees.",
    },
    {
      label: "PRODUCT THINKER",
      body:
        "Turned analytics into decisions for senior leaders at a US media major at Accordion, then owned product end-to-end as Head of Product at Turbotork.",
    },
    {
      label: "AI EXPLORER",
      body:
        "Designed an AI agent workflow at Turbotork that lifted sprint output by roughly 70% — and haven't stopped since.",
    },
    {
      label: "STILL EXPERIMENTING",
      body:
        "Now at Masters' Union, betting the next problem worth solving hasn't found me yet.",
    },
  ],

  problemsIEnjoy:
    "Problems where the data doesn't exist yet — where the real work is building the system that produces it, not analyzing what's already there. I'm drawn to the gap between a founder's intuition and the operational proof it needs: turning a rough workflow into something a small team can actually ship, then finding where AI genuinely removes friction instead of just performing it.",
});
