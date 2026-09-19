import { test, expect } from "@playwright/test";
import { CORPUS_TOKEN_BUDGET, selectKnowledge } from "@/lib/ai/knowledge";
import { SUGGESTED_QUESTIONS } from "@/lib/ai/suggested-questions";

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
 * Per-section retrieval is implemented (lib/ai/knowledge.ts selectKnowledge).
 * If this fails, a single question is now selecting more than one request can
 * spend — tighten selection, do not raise the budget.
 */
test.describe.configure({ mode: "serial" });

/**
 * Questions chosen to stress retrieval rather than flatter it: the six
 * chips a visitor can click without typing, plus questions that legitimately
 * pull several large sections at once, plus one that matches nothing.
 */
const ADVERSARIAL_QUESTIONS = [
  "Tell me about every project he has worked on in detail.",
  "Compare his work at Turbotork and Accordion and Kensara and Adda.",
  "What AI, product, business, strategy, engineering and growth work has he done?",
  "Describe his experience leading teams, raising funding and building products.",
  "asdfghjkl",
];

for (const question of [...SUGGESTED_QUESTIONS, ...ADVERSARIAL_QUESTIONS]) {
  test(`grounding for "${question}" fits one request's token budget @budget`, () => {
    const { tokenCount } = selectKnowledge(question);

    expect(
      tokenCount,
      `Grounding for "${question}" is ${tokenCount} tokens against a budget of ` +
        `${CORPUS_TOKEN_BUDGET}. This request would exceed Groq's per-minute ` +
        `allowance and fail, surfacing to the visitor as "AI CORE TEMPORARILY ` +
        `OFFLINE". Fix the selection in lib/ai/knowledge.ts rather than raising ` +
        `the budget -- the budget is Groq's, not ours.`,
    ).toBeLessThanOrEqual(CORPUS_TOKEN_BUDGET);
  });
}
