import { test, expect } from "@playwright/test";
import { getKnowledgeSections } from "@/lib/ai/knowledge";

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
