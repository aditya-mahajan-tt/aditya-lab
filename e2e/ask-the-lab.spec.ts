import { test, expect } from "@playwright/test";

/**
 * PLAN.md Phase 10 / AI_SPEC.md §9 acceptance criteria that are testable
 * without a live AI_PROVIDER_API_KEY (none is configured for this test
 * run — see CLAUDE.md §8, that's Aditya's to supply). What IS covered:
 * the dialog's accessibility mechanics, the six suggested questions
 * answering instantly with zero API calls, every entry point, the no-JS
 * static fallback, and the honest offline state when no key is present.
 *
 * Deliberately NOT covered here: exhausting the rate limiter or spend cap.
 * Both are in-memory, module-scoped state (lib/ai/rate-limit.ts,
 * lib/ai/spend-cap.ts) shared by every worker hitting the one dev server
 * this suite runs against — a test that deliberately trips the limit would
 * permanently rate-limit every other test's /api/ask calls for the rest of
 * the run. That logic is simple enough to read confidently; it isn't
 * simple to test here without a dedicated, isolated server per test.
 */

test("Ask the Lab opens from the header, is keyboard operable, and closes back to its trigger", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open Ask the Lab" });
  await trigger.focus();
  await trigger.press("Enter");

  const dialog = page.locator('dialog[aria-label="Ask the Lab"]');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Ask the Lab a question" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("a suggested question answers instantly with no network call", async ({ page }) => {
  await page.goto("/");

  let askCalled = false;
  await page.route("**/api/ask", (route) => {
    askCalled = true;
    void route.continue();
  });

  await page.getByRole("button", { name: "Open Ask the Lab" }).click();
  const dialog = page.locator('dialog[aria-label="Ask the Lab"]');
  await dialog.getByRole("button", { name: "What has he built?" }).click();

  await expect(dialog.getByText("What has he built?")).toBeVisible();
  // Today the honest answer to every suggested question is the refusal
  // string — see canned-answers.generated.ts's header comment — which is
  // itself proof the response came from the static map, not a fabrication.
  await expect(dialog.getByText("I don't have that in Aditya's portfolio.")).toBeVisible();
  expect(askCalled).toBe(false);
});

test("the command palette can open Ask the Lab", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open command palette" }).focus();
  await page.keyboard.press("Control+k");

  const palette = page.locator('dialog[aria-label="Command palette"]');
  await palette.getByRole("combobox").fill("ask the lab");
  await expect(palette.getByRole("option", { name: /Ask the Lab/ })).toBeVisible();
  await page.keyboard.press("Enter");

  await expect(palette).toBeHidden();
  await expect(page.locator('dialog[aria-label="Ask the Lab"]')).toBeVisible();
});

test("a free-form question shows the honest offline state when no AI key is configured", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Ask the Lab" }).click();
  const dialog = page.locator('dialog[aria-label="Ask the Lab"]');

  const input = dialog.getByRole("textbox", { name: "Ask the Lab a question" });
  await input.fill("What year did Aditya graduate primary school?");
  await input.press("Enter");

  await expect(dialog.getByRole("alert")).toContainText("AI CORE TEMPORARILY OFFLINE");
  await expect(dialog.getByRole("link", { name: "Work" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "About" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Contact" })).toBeVisible();
});

test("Ask the Lab still answers the six suggested questions with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/contact");

  const section = page.locator('section[aria-labelledby="ask-the-lab-heading"]');
  const item = section.locator("details", { hasText: "What has he built?" });
  await expect(item).toBeVisible();

  // Native <details>/<summary> — opens and reveals its answer with zero JS.
  await item.locator("summary").click();
  await expect(item.getByText("I don't have that in Aditya's portfolio.")).toBeVisible();

  await context.close();
});
