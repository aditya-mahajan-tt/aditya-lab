import { test, expect } from "@playwright/test";
import { findUngrounded, isGrounded } from "@/lib/ai/guardrails";
import { getKnowledge } from "@/lib/ai/knowledge";

/**
 * The grounding check (guardrails.ts) is what turns a correct answer into the
 * bare refusal string, so both directions need pinning: it must NOT reject
 * generic role vocabulary, and it must STILL reject a fabricated employer or
 * number. Node-only, same pattern as e2e/knowledge-retrieval.spec.ts.
 *
 * route.ts checks against the full corpus (getKnowledge), so these tests do too.
 */
const corpus = getKnowledge().text;

test("title-cased role vocabulary grounds against the full corpus @grounding", () => {
  const answer =
    "His Turbotork work points to roles such as Senior Product Manager or Technical " +
    "Product Manager, and his Accordion years suit Analytics and Strategy roles.";
  expect(findUngrounded(answer, corpus)).toEqual([]);
  expect(isGrounded(answer, corpus)).toBe(true);
});

// Known limit, not tested: camel-case names ("DeepMind") never match the
// proper-noun regex, and "Google" is in the corpus as a tool. Cheap and
// imperfect by design (AI_SPEC.md §4).
// Known limit, not tested: camel-case names ("DeepMind") never match the
// proper-noun regex, and "Google" is in the corpus as a tool. Cheap and
// imperfect by design (AI_SPEC.md section 4).
test("a fabricated employer is still ungrounded @grounding", () => {
  for (const employer of ["Microsoft", "Netflix Studios"]) {
    const answer = `Aditya worked at ${employer} as a product lead.`;
    expect(isGrounded(answer, corpus), employer).toBe(false);
    expect(findUngrounded(answer, corpus).join(" ")).toContain(employer.split(" ")[0]);
  }
});

test("a fabricated number is still ungrounded @grounding", () => {
  const answer = "He scaled the platform to 9731 clients.";
  expect(findUngrounded(answer, corpus)).toEqual(["9731"]);
});

test("a fabricated money figure with a unit suffix is ungrounded, the real one is not @grounding", () => {
  expect(findUngrounded("He raised $999K and earned ₹90L+.", corpus)).toEqual(["999", "90"]);
  expect(findUngrounded("He helped close a $250K pre-seed and ₹30L+ revenue.", corpus)).toEqual([]);
});

test("proper nouns match case-insensitively, numbers must be in the corpus @grounding", () => {
  expect(isGrounded("Worked at TURBOTORK.", corpus)).toBe(true);
  expect(isGrounded("Worked at turbotork.", corpus)).toBe(true);
  expect(isGrounded("Scaled to 40 clients.", corpus)).toBe(true);
  expect(isGrounded("Scaled to 9731 clients.", corpus)).toBe(false);
});
