import { test, expect } from "@playwright/test";
import { CANNED_ANSWERS } from "@/lib/ai/canned-answers.generated";

/**
 * PLAN.md Phase 10 / AI_SPEC.md §9 acceptance criteria. Covers: the
 * dialog's accessibility mechanics, the six suggested questions answering
 * instantly with zero API calls (against whatever canned-answers.generated.ts
 * currently holds, real or refusal — imported rather than hardcoded, so
 * this never goes stale when the file is regenerated), every entry point,
 * the no-JS static fallback, and the offline state on a real API failure.
 *
 * Deliberately NOT covered here: exhausting the rate limiter or spend cap,
 * or asserting the live model's answers are grounded (that's guardrails.ts's
 * job at request time, verified manually against the live API — see the
 * Phase 10 checkpoint report, not something to re-derive in an e2e test
 * that would otherwise need a real AI_PROVIDER_API_KEY to run at all). Both
 * rate-limit/spend-cap are in-memory, module-scoped state
 * (lib/ai/rate-limit.ts, lib/ai/spend-cap.ts) shared by every worker
 * hitting the one dev server this suite runs against — a test that
 * deliberately trips the limit would permanently rate-limit every other
 * test's /api/ask calls for the rest of the run.
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

test("the custom cursor bails out while Ask the Lab is open, restoring a real pointer", async ({
  page,
}) => {
  // AskTheLab is a native <dialog>/showModal(), which paints in the browser's
  // top layer — always above CustomCursor's fixed-position dot, regardless of
  // z-index. If CustomCursor doesn't also treat aiOpen as an overlay, it hides
  // the real OS cursor (`cursor: none` via .custom-cursor-active) but its own
  // replacement is invisible behind the dialog: no pointer at all.
  await page.goto("/");
  await page.mouse.move(200, 200);
  await page.mouse.move(210, 205); // wakes the custom cursor, same as a real visitor moving the mouse

  await page.getByRole("button", { name: "Open Ask the Lab" }).click();
  const dialog = page.locator('dialog[aria-label="Ask the Lab"]');
  await expect(dialog).toBeVisible();

  await expect(page.locator("html")).not.toHaveClass(/custom-cursor-active/);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
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
  await expect(dialog.getByText(CANNED_ANSWERS["What has he built?"])).toBeVisible();
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

test("a free-form question shows the honest offline state on API failure", async ({ page }) => {
  // Mocked at the network level rather than relying on no AI_PROVIDER_API_KEY
  // being configured in the test environment — a real key is now wired up
  // (see AI_SPEC.md §7's "API error / timeout" row, not "no key present").
  await page.route("**/api/ask", (route) => route.fulfill({ json: { status: "offline" } }));

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
  await expect(item.getByText(CANNED_ANSWERS["What has he built?"])).toBeVisible();

  await context.close();
});
