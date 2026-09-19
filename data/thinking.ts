import { ThinkingSchema } from "./schema";

/** CONTENT_INTAKE.md §E. This section is signature material — write it yourself. */
export const thinking = ThinkingSchema.parse({
  heading: "HOW I THINK",
  intro:
    "I default to strategy grounded in real data over slide-deck logic — an eight-step loop I run on almost everything, from portfolio analytics to a two-person startup's GTM.",
  steps: [
    {
      label: "OBSERVE",
      body: "Start by watching how people actually work today, not how the process document says they should.",
      moment: {
        body: "Watched where a two-person engineering team's time actually went before proposing anything. It wasn't typing — it was planning, rebuilding context and review.",
        link: { label: "Turbotork", url: "/work/turbotork" },
      },
    },
    {
      label: "QUESTION",
      body: "Ask why the current way exists before assuming it's wrong — most inefficiencies have a reason, and that reason is the real constraint.",
      moment: {
        body: "Asked why a garage still ran on paper before assuming it shouldn't. The answer — nothing downstream depended on the record being digital yet — was the actual constraint to attack.",
        link: { label: "Turbotork", url: "/work/turbotork" },
      },
    },
    {
      label: "UNDERSTAND",
      body: "Dig into the data and the edge cases until the problem is concrete enough to state in one sentence.",
      moment: {
        body: "Defined twelve behavioural variables, each tied to a hypothesis about what drives an offsite booking, before writing a single survey question.",
        link: { label: "goSTOPS", url: "/work/gostops-gtm" },
      },
    },
    {
      label: "FRAME",
      body: "Turn the problem into a testable bet — what would prove this right or wrong, and how cheaply can I find out.",
      moment: {
        body: "Reframed a compliance product's go-to-market as a bet on a regulatory deadline rather than a software category — a claim that could be tested against real practitioners inside a month.",
        link: { label: "Kensara AI", url: "/work/kensara-ai-gtm" },
      },
    },
    {
      label: "BUILD",
      body: "Ship the smallest version that tests the real risk, not the version that looks most impressive.",
      moment: {
        body: "Shipped digital job cards first, not the AI features. The inspection, diagnostic and analytics layers only worked later because this one made the data clean.",
        link: { label: "Turbotork", url: "/work/turbotork" },
      },
    },
    {
      label: "TEST",
      body: "Put it in front of real usage or real data before trusting my own read of whether it works.",
      moment: {
        body: "Put the GTM strategy in front of practitioner communities as a live voice-of-customer channel, rather than trusting the deck's own logic about what buyers cared about.",
        link: { label: "Kensara AI", url: "/work/kensara-ai-gtm" },
      },
    },
    {
      label: "LEARN",
      body: "Separate what the result says about the idea from what it says about the execution — they're not the same failure.",
      moment: {
        body: "The lead scorer worked; the plumbing didn't. An open redirect and an SSRF hole said nothing about the scoring idea and everything about where I hadn't looked.",
        link: { label: "LeadIQ", url: "/work/leadiq" },
      },
    },
    {
      label: "ITERATE",
      body: "Fix one variable at a time and re-test, rather than rebuilding from scratch.",
      moment: {
        body: "Chose a payment gateway on cash-on-delivery reconciliation rather than checkout speed, after the unit-economics model showed a 10% return-to-origin rate was the variable that actually moved.",
        link: { label: "Adda", url: "/work/adda-d2c" },
      },
    },
  ],
  workedExample:
    "At Turbotork the product developed hand-in-hand with operations, slightly ahead of them, as the fleet-service business scaled to 40+ clients and 400+ vehicles. The part I'd point at isn't the platform — it's what I did after noticing where a two-person engineering team's time actually went. Not typing: planning, rebuilding context, and review. So I split the work into four explicit roles with handoffs between them — plan, implement, review, release — and encoded the architectural rules they had to obey rather than reviewing every change against them. The leverage came from attacking coordination cost, not keystroke cost.",
  principles: [
    {
      title: "Measure the thing that decides, not the thing that's easy to measure",
      body: "Demographics are easy to collect and don't predict who books an offsite; site polish is easy to score and doesn't predict who'll buy. The variable worth measuring is usually the one that takes work to define, which is why I define it before collecting anything.",
      evidence: [
        { label: "goSTOPS — 12 behavioural variables, defined first", url: "/work/gostops-gtm" },
        { label: "LeadIQ — scoring opportunity, not polish", url: "/work/leadiq" },
        { label: "Kensara AI — selling the trigger, not the category", url: "/work/kensara-ai-gtm" },
      ],
    },
    {
      title: "Structure before leverage — you cannot multiply what isn't there",
      body: "AI, automation and analytics are all multipliers, and a multiplier applied to an unstructured process returns the process. So the system of record comes first, every time, even when it's the least interesting part of the work.",
      evidence: [
        { label: "Turbotork — digitise the record, then run AI on it", url: "/work/turbotork" },
        { label: "Adda — store, payments and brand before selling", url: "/work/adda-d2c" },
        { label: "This site — a parsed data layer before the 3D layer", url: "/build" },
      ],
    },
    {
      title: "Pay for a check once, not forever",
      body: "Vigilance is a recurring cost and it degrades; an encoded check costs the same whether it runs ten times or ten thousand. Most of what looks like discipline in my work is really just refusing to rely on remembering.",
      evidence: [
        { label: "Turbotork — integrity audits and architecture rules", url: "/work/turbotork" },
        { label: "This site — a build that fails on unverified content", url: "/build" },
      ],
    },
    {
      title: "The risk is rarely where the interesting work is",
      body: "The scoring engine is the fun part; the plumbing is what breaks. I've learned to go looking for the boring failure specifically, because nothing about it announces itself — and the one time I didn't, it cost me.",
      evidence: [
        { label: "LeadIQ — the risk was SSRF and open redirect, not the logic", url: "/work/leadiq" },
        { label: "Turbotork — rules governed architecture, nothing governed correctness", url: "/work/turbotork" },
      ],
    },
  ],
});
