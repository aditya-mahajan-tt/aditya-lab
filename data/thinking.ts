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
    },
    {
      label: "QUESTION",
      body: "Ask why the current way exists before assuming it's wrong — most inefficiencies have a reason, and that reason is the real constraint.",
    },
    {
      label: "UNDERSTAND",
      body: "Dig into the data and the edge cases until the problem is concrete enough to state in one sentence.",
    },
    {
      label: "FRAME",
      body: "Turn the problem into a testable bet — what would prove this right or wrong, and how cheaply can I find out.",
    },
    {
      label: "BUILD",
      body: "Ship the smallest version that tests the real risk, not the version that looks most impressive.",
    },
    {
      label: "TEST",
      body: "Put it in front of real usage or real data before trusting my own read of whether it works.",
    },
    {
      label: "LEARN",
      body: "Separate what the result says about the idea from what it says about the execution — they're not the same failure.",
    },
    {
      label: "ITERATE",
      body: "Fix one variable at a time and re-test, rather than rebuilding from scratch.",
    },
  ],
  workedExample:
    "At Turbotork, the product didn't trail operations — it developed hand-in-hand with it, slightly ahead, as the fleet-service business scaled to 40+ clients and 400+ vehicles. I observed where the 2-person eng team's time actually went, framed it as a bet on AI agent workflows across planning and execution, and built that in alongside the core product rather than bolting it on later — it boosted team productivity by roughly 70%.",
  principles: [],
});
