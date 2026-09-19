import { test, expect } from "@playwright/test";
import { suggestLink } from "@/lib/ai/link-suggestions";
import { getHeroBodies } from "@/data/queries";

/**
 * The defect this pins: suggestLink used to iterate getAllProjects() in
 * array order and return the first title it found in the answer. An answer
 * mentioning both Kensara AI and Turbotork always linked to whichever sat
 * earlier in data/projects.ts, regardless of what was asked.
 *
 * Node-run assertions in the Playwright suite (no `page` argument), matching
 * e2e/knowledge-retrieval.spec.ts.
 */
test("a leadTopics question links to the entry that claims the topic @links", () => {
  const answer =
    "Aditya led GTM strategy for Kensara AI, and at Turbotork he led a two-person " +
    "engineering team as founding AI Product Manager.";

  const link = suggestLink(answer, "Has he ever led an engineering team?");

  expect(link).not.toBeNull();
  expect(link!.href).toBe("/work/turbotork");
});

test("without a topic match, the earliest mention wins @links", () => {
  const answer = "Kensara AI was a national case competition. Turbotork was a fleet-service SaaS.";

  const link = suggestLink(answer, "what did he do in 2026");

  expect(link).not.toBeNull();
  expect(link!.href).toBe("/work/kensara-ai-gtm");
});

test("an answer naming nothing returns no chip @links", () => {
  expect(suggestLink("He enjoys ambiguous problems.", "what does he enjoy")).toBeNull();
});

test("a project named in the answer still links when the question is vague @links", () => {
  const link = suggestLink("Adda is a D2C wellness brand he founded.", "tell me more");
  expect(link).not.toBeNull();
  expect(link!.href).toBe("/work/adda-d2c");
});

test("the topic word 'AI' pulls the link to Turbotork over an earlier mention @links", () => {
  const answer = "Kensara AI was a case competition. Turbotork is where he builds AI agents.";

  const link = suggestLink(answer, "What AI work has he done?");

  expect(link).not.toBeNull();
  expect(link!.href).toBe("/work/turbotork");
});

test("'ai' inside 'explain' or 'detail' is not a topic match @links", () => {
  // Kensara AI is named first; Turbotork must not win merely because the
  // substring "ai" appears in "explain" and "detail".
  const answer = "Kensara AI was a case competition. Turbotork is a fleet-service SaaS.";

  const link = suggestLink(answer, "Can you explain his process in detail?");

  expect(link).not.toBeNull();
  expect(link!.href).toBe("/work/kensara-ai-gtm");
});

test("a question naming a project outranks the leadTopics word 'AI' @links", () => {
  const answer = "Kensara AI was a case competition. Turbotork is where he builds AI agents.";

  const link = suggestLink(answer, "Tell me about Kensara AI");

  expect(link).not.toBeNull();
  expect(link!.href).toBe("/work/kensara-ai-gtm");
});

test("earliest mention in the answer beats declaration order @links", () => {
  const answer = "Turbotork is a fleet-service SaaS. Kensara AI was a case competition.";

  const link = suggestLink(answer, "what did he do in 2026");

  expect(link).not.toBeNull();
  expect(link!.href).toBe("/work/turbotork");
});

test("a question naming Turbotork links to it even when Kensara is mentioned first @links", () => {
  const answer = "Kensara AI was a case competition. Turbotork is a fleet-service SaaS.";

  const link = suggestLink(answer, "Tell me about Turbotork.");

  expect(link).not.toBeNull();
  expect(link!.href).toBe("/work/turbotork");
});

test("the hero reaches Turbotork through its case study, not /about @links", () => {
  const bodies = getHeroBodies();
  const turbotork = bodies.filter((b) => b.label === "Turbotork");

  expect(turbotork).toHaveLength(1);
  expect(turbotork[0]!.href).toBe("/work/turbotork");
  expect(bodies.some((b) => b.id.startsWith("experience-"))).toBe(false);
});
