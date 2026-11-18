import { AboutSchema } from "./schema";

/**
 * CONTENT_INTAKE.md §B. Word counts are in that file — stick to them.
 *
 * shortBio, longBio, progression bodies and problemsIEnjoy were drafted
 * from the resume Aditya supplied (2026-09-04) and reviewed and approved
 * by Aditya on 2026-09-07 (draft-review marker removed; see
 * data/schema.ts's DRAFT_PATTERN comment). Rewritten in the first person
 * 2026-11-18 (same facts) after portfolio feedback.
 */
export const about = AboutSchema.parse({
  // Hero one-liner under the name; every fact here is already in longBio.
  heroRole: "Product manager · ex-founding AI PM at Turbotork · PGP, Masters' Union",
  // Proof first (figures from longBio); the positioning moves to the subline.
  heroHeadline: "I took a fleet-service SaaS to 40+ clients and ₹30L+ revenue in five months.",
  heroSubline: "AI × Product × Business. Welcome to my digital laboratory.",

  shortBio:
    "I'm a 0→1 operator who moves between strategy, product and analytics. I spent two years in Accordion's private equity practice, turning portfolio data into decisions for C-suite teams overseeing a $6B+ book. Then I joined an early-stage startup as founding AI Product Manager, scaling a fleet-service SaaS to 40+ clients and helping raise a $250K pre-seed round. I'm now at Masters' Union, deepening the product and AI side of that instinct.",

  longBio:
    "I trained as a chemical engineer at BITS Pilani, then spent three years finding out that the parts of engineering I liked most weren't really about chemistry — they were about turning ambiguous, messy problems into systems that work. That instinct took me to Accordion, where as part of the Private Equity practice I worked across ten-plus teams supporting a portfolio that grew from $5.6B to $6.9B, running the analytics — A/B testing, churn modelling, workflow automation — that C-suite leaders at portfolio companies used to make real decisions. Two years in, I wanted to be closer to the building itself, not just the analysis of it. That led me to Turbotork, an early-stage fleet-service SaaS, as founding AI Product Manager working out of the founder's office: I owned product end to end, led a two-person engineering team, helped shape the pitch that closed a $250K pre-seed round, and scaled the platform to 40+ clients and ₹30L+ in revenue inside five months, while layering in AI agent workflows that lifted team productivity by roughly 70% — the full case study is at /work/turbotork. I'm now at Masters' Union, in the Post Graduate Programme in Technology & Business Management, sharpening the product and AI instincts that engineering, analytics and founding work each gave me a different piece of — alongside leading GTM strategy for an AI startup through the Kensara AI case competition, and building a D2C Shopify venture, Adda, end to end. What I'm chasing now is the same thing that pulled me out of a lab coat in the first place: problems messy enough that nobody's built the system for them yet.",

  progression: [
    {
      label: "CURIOUS",
      body:
        "Trained as a chemical engineer at BITS Pilani — then spent three years discovering the questions interested me more than the reactions.",
    },
    {
      label: "BUILDER",
      body:
        "Built a fleet-service SaaS MVP from scratch at Turbotork, and a Shopify D2C store end-to-end as founder of Adda.",
    },
    {
      label: "MARKETER",
      body:
        "Ran a 100-member outreach team at BITS Pilani generating ₹40L+ in sponsorship revenue across 20,000+ attendees.",
    },
    {
      label: "PRODUCT THINKER",
      body:
        "Turned portfolio analytics into C-suite decisions at Accordion, then owned product end-to-end as a founding PM.",
    },
    {
      label: "AI EXPLORER",
      body:
        "Deployed AI agent workflows at Turbotork that lifted team productivity by roughly 70% — and haven't stopped since.",
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
