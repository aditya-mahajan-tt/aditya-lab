import { test, expect } from "@playwright/test";
import { suggestLink, suggestLinks, stripUnknownInternalPaths } from "@/lib/ai/link-suggestions";
import { getHeroBodies } from "@/data/queries";
import { systemDiagrams } from "@/data/systems";

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
  expect(link!.href).toBe("/projects/kensara-ai-gtm");
});

test("an answer naming nothing returns no chip @links", () => {
  expect(suggestLink("He enjoys ambiguous problems.", "what does he enjoy")).toBeNull();
});

test("a project named in the answer still links when the question is vague @links", () => {
  const link = suggestLink("Adda is a D2C wellness brand he founded.", "tell me more");
  expect(link).not.toBeNull();
  expect(link!.href).toBe("/projects/adda-d2c");
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
  expect(link!.href).toBe("/projects/kensara-ai-gtm");
});

test("a question naming a project outranks the leadTopics word 'AI' @links", () => {
  const answer = "Kensara AI was a case competition. Turbotork is where he builds AI agents.";

  const link = suggestLink(answer, "Tell me about Kensara AI");

  expect(link).not.toBeNull();
  expect(link!.href).toBe("/projects/kensara-ai-gtm");
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

test("system diagrams point at the Turbotork case study @links", () => {
  const automation = systemDiagrams.find((d) => d.id === "automation-engine");
  expect(automation?.relatedProjectSlug).toBe("turbotork");
  expect(automation?.relatedLink).toBeUndefined();

  const agents = systemDiagrams.find((d) => d.id === "agent-pipeline");
  expect(agents).toBeDefined();
  expect(agents!.nodes.length).toBeGreaterThanOrEqual(4);
  expect(agents!.relatedProjectSlug).toBe("turbotork");
});

test("an answer that mentions ORBIT gets the /systems/orbit chip @links", () => {
  const link = suggestLink(
    "ORBIT is his personal operating system built on scheduled agents.",
    "what personal automation has he built",
  );
  expect(link).toEqual({ label: "ORBIT workflow", href: "/systems/orbit" });
});

test("/systems/orbit survives stripUnknownInternalPaths @links", () => {
  expect(stripUnknownInternalPaths("Read more at /systems/orbit for the flow.")).toContain("/systems/orbit");
});

test("slashes inside words are not treated as paths @links", () => {
  const text = "He ran A/B testing as Senior Analyst/Business Associate.";
  expect(stripUnknownInternalPaths(text)).toBe(text);
  expect(stripUnknownInternalPaths("See /work/made-up for more.")).not.toContain("/work/made-up");
});

test("a question naming Turbotork and Accordion gets both chips @links", () => {
  const answer =
    "At Turbotork he was founding AI PM. Before that, at Accordion he did analytics for C-suite leaders.";

  const links = suggestLinks(answer, "tell me about his work at turbotork and accordion");

  expect(links).toEqual([
    { label: "Turbotork case study", href: "/work/turbotork" },
    { label: "Accordion on Work", href: "/work#job-accordion" },
  ]);
});

test("Accordion alone links to its /work anchor @links", () => {
  expect(suggestLink("He worked at Accordion as an analyst.", "where did he work before")).toEqual({
    label: "Accordion on Work",
    href: "/work#job-accordion",
  });
});

test("UltraTech is not on /work, so it gets no chip @links", () => {
  expect(suggestLinks("He interned at UltraTech Cement.", "tell me about UltraTech")).toEqual([]);
});

test("Turbotork never yields two chips for the same name @links", () => {
  const links = suggestLinks("Turbotork is where he works. Turbotork scaled to 40 clients.", "tell me about Turbotork", 5);
  expect(links).toEqual([{ label: "Turbotork case study", href: "/work/turbotork" }]);
});

test("suggestLinks respects max @links", () => {
  const answer = "Turbotork, Accordion and Kensara AI.";
  expect(suggestLinks(answer, "what did he do", 1)).toHaveLength(1);
  expect(suggestLinks(answer, "what did he do", 3).length).toBeLessThanOrEqual(3);
});
