import { AboutSchema } from "./schema";

/**
 * CONTENT_INTAKE.md §B. Word counts are in that file — stick to them.
 *
 * shortBio, longBio, progression bodies and problemsIEnjoy are drafted
 * from the resume Aditya supplied (2026-09-04) — each prefixed with the
 * draft-review marker (see data/schema.ts's DRAFT_PATTERN comment), so
 * they render with a visible review flag and fail a production build
 * until reviewed. Written as a literal string, not a shared constant —
 * DRAFT_PATTERN explains why.
 */
export const about = AboutSchema.parse({
  heroHeadline: "I build things at the intersection of AI × Product × Business.",
  heroSubline: "Welcome to my digital laboratory.",

  shortBio:
    "[AI_DRAFT_REVIEW] Aditya is a 0→1 operator who moves between strategy, product and analytics. He spent two years in Accordion's private equity practice, turning portfolio data into decisions for C-suite teams overseeing a $6B+ book. He then joined an early-stage startup as founding AI Product Manager, scaling a fleet-service SaaS to 40+ clients and helping raise a $250K pre-seed round. He's currently at Masters' Union, deepening the product and AI side of that instinct.",

  longBio:
    "[AI_DRAFT_REVIEW] Aditya trained as a chemical engineer at BITS Pilani, then spent three years finding out that the parts of engineering he liked most weren't really about chemistry — they were about turning ambiguous, messy problems into systems that work. That instinct took him to Accordion, where as part of the Private Equity practice he worked across ten-plus teams supporting a portfolio that grew from $5.6B to $6.9B, running the analytics — A/B testing, churn modelling, workflow automation — that C-suite leaders at portfolio companies used to make real decisions. Two years in, he wanted to be closer to the building itself, not just the analysis of it. That led him to Turbotork, an early-stage fleet-service SaaS, as founding AI Product Manager working out of the founder's office: he owned product end to end, led a two-person engineering team, helped shape the pitch that closed a $250K pre-seed round, and scaled the platform to 40+ clients and ₹30L+ in revenue inside five months, while layering in AI agent workflows that lifted team productivity by roughly 70%. He's currently at Masters' Union, in the Post Graduate Programme in Technology & Business Management, sharpening the product and AI instincts that engineering, analytics and founding work each gave him a different piece of — alongside leading GTM strategy for an AI startup through the Kensara AI case competition, and building a D2C Shopify venture, Adda, end to end. What he's chasing now is the same thing that pulled him out of a lab coat in the first place: problems messy enough that nobody's built the system for them yet.",

  progression: [
    {
      label: "CURIOUS",
      body:
        "[AI_DRAFT_REVIEW] Trained as a chemical engineer at BITS Pilani — then spent three years discovering the questions interested him more than the reactions.",
    },
    {
      label: "BUILDER",
      body:
        "[AI_DRAFT_REVIEW] Built a fleet-service SaaS MVP from scratch at Turbotork, and a Shopify D2C store end-to-end as founder of Adda.",
    },
    {
      label: "MARKETER",
      body:
        "[AI_DRAFT_REVIEW] Ran a 100-member outreach team at BITS Pilani generating ₹40L+ in sponsorship revenue across 20,000+ attendees.",
    },
    {
      label: "PRODUCT THINKER",
      body:
        "[AI_DRAFT_REVIEW] Turned portfolio analytics into C-suite decisions at Accordion, then owned product end-to-end as a founding PM.",
    },
    {
      label: "AI EXPLORER",
      body:
        "[AI_DRAFT_REVIEW] Deployed AI agent workflows at Turbotork that lifted team productivity by roughly 70% — and hasn't stopped since.",
    },
    {
      label: "STILL EXPERIMENTING",
      body:
        "[AI_DRAFT_REVIEW] Currently at Masters' Union, betting the next problem worth solving hasn't found him yet.",
    },
  ],

  problemsIEnjoy:
    "[AI_DRAFT_REVIEW] Problems where the data doesn't exist yet — where the real work is building the system that produces it, not analyzing what's already there. He's drawn to the gap between a founder's intuition and the operational proof it needs: turning a rough workflow into something a small team can actually ship, then finding where AI genuinely removes friction instead of just performing it.",
});
