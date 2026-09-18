import { test, expect } from "@playwright/test";
import { CORPUS_TOKEN_BUDGET, getKnowledge } from "@/lib/ai/knowledge";

/**
 * A build-time guard on the one number that can silently kill Ask the Lab.
 *
 * The grounding corpus is sent in full on every question, so it is charged
 * against Groq's per-minute token allowance on every question. Push the
 * corpus past what one request can spend and the assistant does not get
 * slower or vaguer — it fails outright, on every question, and reports
 * itself to the visitor as "AI CORE TEMPORARILY OFFLINE". Nothing in that
 * message points at the content edit that caused it, which is exactly why
 * this belongs in `npm run verify` and not in a log line.
 *
 * This runs in Node rather than the browser, and needs no page — it is a
 * unit assertion living in the e2e suite because that suite is what
 * `npm run verify` already runs with the project's TS path aliases.
 *
 * If this fails: implement AI_SPEC.md §2's per-section retrieval (score
 * sections by keyword overlap with the question, send the best three).
 * Do not raise the budget to make it pass — the budget is Groq's, not ours.
 */
test.describe.configure({ mode: "serial" });

test("the grounding corpus fits inside one request's token budget @budget", () => {
  const { tokenCount } = getKnowledge();

  expect(
    tokenCount,
    `The grounding corpus is ${tokenCount} tokens against a budget of ${CORPUS_TOKEN_BUDGET}. ` +
      `Every Ask the Lab request would exceed Groq's per-minute allowance and fail. ` +
      `Switch to per-section retrieval (AI_SPEC.md §2) rather than raising the budget.`,
  ).toBeLessThanOrEqual(CORPUS_TOKEN_BUDGET);
});
