import { test, expect } from "@playwright/test";
import { thinking } from "@/data/thinking";
import { getAllProjects } from "@/data/queries";

const STATIC_ROUTES = new Set(["/build"]);

test("every principle cites at least two pieces of real work @thinking", () => {
  expect(thinking.principles.length).toBeGreaterThanOrEqual(4);
  for (const principle of thinking.principles) {
    expect(principle.evidence.length, `principle "${principle.title}" cites too little`)
      .toBeGreaterThanOrEqual(2);
  }
});

test("every evidence url points at a real route @thinking", () => {
  const slugs = new Set(getAllProjects().map((p) => p.slug));
  for (const principle of thinking.principles) {
    for (const e of principle.evidence) {
      const isProject = e.url.startsWith("/work/") && slugs.has(e.url.slice("/work/".length));
      expect(
        STATIC_ROUTES.has(e.url) || isProject,
        `evidence "${e.label}" links to unknown route ${e.url}`,
      ).toBe(true);
    }
  }
});

test("the principles render on /thinking @thinking", async ({ page }) => {
  await page.goto("/thinking");
  for (const principle of thinking.principles) {
    await expect(page.getByText(principle.title, { exact: false }).first()).toBeVisible();
  }
});
