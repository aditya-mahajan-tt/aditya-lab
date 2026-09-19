import { test, expect } from "@playwright/test";
import {
  CORPUS_TOKEN_BUDGET,
  estimateTokens,
  getKnowledgeSections,
  selectKnowledge,
} from "@/lib/ai/knowledge";
import { SUGGESTED_QUESTIONS } from "@/lib/ai/suggested-questions";

/**
 * A build-time guard on the one number that can silently kill Ask the Lab.
 *
 * Each request's grounding is charged against Groq's per-minute token
 * allowance. Push a single request past what it can spend and the assistant
 * does not get slower or vaguer — it fails outright, and reports
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

/**
 * The per-question test above is bounded by selectKnowledge's own fill loop,
 * so content growth alone can never turn it red. This one can: if the pinned
 * sections plus the single largest retrievable section no longer fit, that
 * section could never be delivered whole and answers about it would be
 * grounded in a truncated or missing case study.
 */
test("pinned sections plus the largest single section fit one request @budget", () => {
  const sections = getKnowledgeSections();
  const pinnedTokens = sections
    .filter((s) => s.pinned)
    .reduce((total, s) => total + estimateTokens(s.text) + 1, 0);
  const largest = sections
    .filter((s) => !s.pinned)
    .map((s) => ({ id: s.id, tokens: estimateTokens(s.text) + 1 }))
    .sort((a, b) => b.tokens - a.tokens)[0];
  const needed = pinnedTokens + largest.tokens;

  expect(
    needed,
    `Pinned sections (${pinnedTokens} tokens) plus the largest section ` +
      `"${largest.id}" (${largest.tokens} tokens) is ${needed} against a budget of ` +
      `${CORPUS_TOKEN_BUDGET}. That section can no longer be delivered whole. ` +
      `Shrink the section or tighten pinned content; do not raise the budget.`,
  ).toBeLessThanOrEqual(CORPUS_TOKEN_BUDGET);
});
