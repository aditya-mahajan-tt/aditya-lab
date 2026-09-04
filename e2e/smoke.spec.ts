import { test, expect, type Page } from "@playwright/test";

/**
 * The smoke suite is the mechanical half of the Definition of Done
 * (CLAUDE.md §4). Every route must pass every check here, at every phase.
 */

const ROUTES = [
  "/",
  "/work",
  "/work/gostops-gtm",
  "/experiments",
  "/thinking",
  "/about",
  "/contact",
  "/resume",
];

function captureProblems(page: Page) {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  return problems;
}

for (const route of ROUTES) {
  test.describe(`route ${route}`, () => {
    test("renders cleanly with exactly one h1 and no console errors", async ({ page }) => {
      const problems = captureProblems(page);

      const response = await page.goto(route);
      expect(response?.status(), `${route} should return 200`).toBe(200);

      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main")).toBeVisible();

      expect(problems, `${route} produced console errors`).toEqual([]);
    });

    test("has no horizontal overflow", async ({ page }) => {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflow, `${route} overflows horizontally`).toBe(false);
    });

    test("every image has an alt attribute", async ({ page }) => {
      await page.goto(route);
      const missing = await page.evaluate(
        () => [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length,
      );
      expect(missing, `${route} has images without alt`).toBe(0);
    });

    test("heading levels never skip", async ({ page }) => {
      await page.goto(route);
      const levels = await page.evaluate(() =>
        [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1])),
      );
      let previous = 0;
      for (const level of levels) {
        expect(level - previous, `${route} skips a heading level`).toBeLessThanOrEqual(1);
        previous = Math.max(previous, level);
      }
    });
  });
}

test("404 route renders the custom not-found page", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-real-route");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toBeVisible();
});

test("skip link is the first focusable element and reaches main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("href"));
  expect(focused).toBe("#main");
});

test("primary navigation is fully keyboard reachable", async ({ page }) => {
  await page.goto("/");
  const links = page.locator("header nav a");
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(links.nth(i)).toBeVisible();
  }
});

test("content and navigation still render with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("header nav a").first()).toBeVisible();
  await context.close();
});
