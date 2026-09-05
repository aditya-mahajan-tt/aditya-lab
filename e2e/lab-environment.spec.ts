import { test, expect, type Page } from "@playwright/test";
import { stations } from "../data/stations";

/**
 * PLAN.md Phase 13, first slice: the six-station Lab environment. Only
 * "workstation" has a real 3D object so far (data/stations.ts `built`) —
 * the rest are instanced placeholder markers, hence no per-station 3D
 * interaction assertions yet. What has to hold regardless of that: every
 * station is a real, working route with no 3D required (CLAUDE.md §3.5),
 * and the 3D layer mounts and runs cleanly when it is allowed to.
 */
async function forceQuality(page: Page, quality: string) {
  await page.addInitScript((value) => {
    window.localStorage.setItem(
      "aditya-lab",
      JSON.stringify({ state: { soundEnabled: false, quality: value }, version: 0 }),
    );
  }, quality);
}

test("every station is a real link to a working route", async ({ page }) => {
  await page.goto("/");
  const section = page.locator('section[aria-labelledby="lab-env-heading"]');

  for (const station of stations) {
    const link = section.getByRole("link", { name: new RegExp(station.label, "i") });
    await expect(link).toHaveAttribute("href", station.route);
  }
});

test("the fallback list works with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");

  for (const station of stations) {
    await expect(page.getByRole("link", { name: new RegExp(station.label, "i") })).toHaveAttribute(
      "href",
      station.route,
    );
  }
  await context.close();
});

test("an explicit HIGH mounts a second canvas for the Lab environment", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));

  await forceQuality(page, "high");
  await page.goto("/");

  const heading = page.locator("#lab-env-heading");
  await heading.scrollIntoViewIfNeeded();
  await expect(page.locator("canvas")).toHaveCount(2, { timeout: 15_000 });

  expect(problems, "the Lab environment produced console errors").toEqual([]);
});
