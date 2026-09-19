import { test, expect } from "@playwright/test";
import {
  CORPUS_TOKEN_BUDGET,
  estimateTokens,
  getKnowledgeSections,
  selectSectionIds,
} from "@/lib/ai/knowledge";

/**
 * Retrieval is only as good as its granularity: if every project lives in
 * one "Projects" section, scoring can never prefer one project over
 * another. These assertions pin the section model itself.
 *
 * Node-run assertions in the Playwright suite, matching the pattern
 * established by e2e/knowledge-budget.spec.ts — no `page` argument, run
 * here because this suite already has the project's TS path aliases.
 */
test("each project and experience entry is its own retrievable section @retrieval", () => {
  const sections = getKnowledgeSections();
  const ids = sections.map((s) => s.id);

  expect(ids).toContain("project-kensara-ai-gtm");
  expect(ids).toContain("project-adda-d2c");
  expect(ids).toContain("experience-accordion");
  expect(ids).toContain("experience-turbotork");

  // No blob sections — the old joined form must be gone.
  expect(ids).not.toContain("projects");
  expect(ids).not.toContain("experience");
});

test("identity and contact sections are pinned @retrieval", () => {
  const pinned = getKnowledgeSections().filter((s) => s.pinned).map((s) => s.id);

  expect(pinned).toContain("site");
  expect(pinned).toContain("about");
  expect(pinned).toContain("contact");
});

test("every section carries topics for scoring @retrieval", () => {
  for (const section of getKnowledgeSections()) {
    expect(section.topics.length, `section ${section.id} has no topics`).toBeGreaterThan(0);
  }
});

test("a question about a named project selects that project's section @retrieval", () => {
  const ids = selectSectionIds("Tell me about the Kensara AI project.");
  expect(ids).toContain("project-kensara-ai-gtm");
});

test("a leadTopics question selects the entry that claims the topic @retrieval", () => {
  // data/experience.ts gives Turbotork leadTopics including "fundraising".
  const ids = selectSectionIds("Has he ever raised funding?");
  expect(ids).toContain("experience-turbotork");
});

test("pinned sections are always selected, even for an unmatched question @retrieval", () => {
  const ids = selectSectionIds("what is your favourite colour");
  expect(ids).toContain("site");
  expect(ids).toContain("about");
  expect(ids).toContain("contact");
});

test("pinned sections alone fit inside the budget @retrieval", () => {
  const pinnedTokens = getKnowledgeSections()
    .filter((s) => s.pinned)
    .reduce((total, s) => total + estimateTokens(s.text), 0);

  expect(
    pinnedTokens,
    `Pinned sections are ${pinnedTokens} tokens against a budget of ${CORPUS_TOKEN_BUDGET}. ` +
      `Pinned content is sent on every request and cannot be dropped, so this must always fit.`,
  ).toBeLessThanOrEqual(CORPUS_TOKEN_BUDGET);
});

test("selection is deterministic for the same question @retrieval", () => {
  const a = selectSectionIds("What has he built?");
  const b = selectSectionIds("What has he built?");
  expect(a).toEqual(b);
});
