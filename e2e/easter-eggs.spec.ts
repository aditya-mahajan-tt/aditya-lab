import { test, expect } from "@playwright/test";

/**
 * PLAN.md Phase 15 — easter eggs, sound, physics. See CLAUDE.md §2: none of
 * this may interfere with usability or the recruiter path, so every test
 * here also confirms the egg stays inert until deliberately triggered.
 */

test("the hidden route works by direct URL but is absent from navigation and the command palette", async ({
  page,
}) => {
  await page.goto("/experiments/hidden");
  await expect(page.locator("h1")).toHaveText("You found the hidden room.");

  await page.goto("/");
  await expect(page.locator('a[href="/experiments/hidden"]')).toHaveCount(0);

  await page.getByRole("button", { name: "Open command palette" }).click();
  const dialog = page.locator('dialog[aria-label="Command palette"]');
  await dialog.getByRole("combobox").fill("hidden");
  const hrefs = await dialog.getByRole("option").evaluateAll((options) =>
    options.map((o) => o.querySelector("a, [href]")?.getAttribute("href") ?? o.textContent),
  );
  expect(hrefs.join(" ")).not.toContain("/experiments/hidden");
});

test("typing sudo in the command palette shows the denied message but no navigable result", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open command palette" }).click();
  const dialog = page.locator('dialog[aria-label="Command palette"]');

  await dialog.getByRole("combobox").fill("sudo");
  await expect(dialog.getByText("Permission denied: you already have root. It’s my portfolio.")).toBeVisible();
});

test("the konami code reveals a toast linking to the hidden route", async ({ page }) => {
  await page.goto("/");
  // Focus a neutral element so the sequence isn't swallowed by an editable field.
  await page.locator("body").click();

  const sequence = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];
  for (const key of sequence) {
    await page.keyboard.press(key);
  }

  const toast = page.getByRole("status").filter({ hasText: "KONAMI CODE ACCEPTED" });
  await expect(toast).toBeVisible();
  await toast.getByRole("link", { name: "OPEN" }).click();
  await expect(page).toHaveURL(/\/experiments\/hidden$/);
});

test("sound is off by default and the footer control toggles it, persisting across reload", async ({ page }) => {
  await page.goto("/");
  const soundToggle = page.locator('input[type="checkbox"]').last();
  await expect(soundToggle).not.toBeChecked();

  await page.getByText("SOUND").locator("..").click();
  await expect(soundToggle).toBeChecked();

  await page.reload();
  await expect(page.locator('input[type="checkbox"]').last()).toBeChecked();
});

test("the experiments archive filters by status, and the unfiltered list works with JavaScript disabled", async ({
  page,
  browser,
}) => {
  await page.goto("/experiments");
  const items = page.locator('ul li a[href^="/experiments/"]');
  const totalCount = await items.count();
  expect(totalCount).toBeGreaterThan(0);

  await page.getByRole("button", { name: "ALL" }).click();
  await expect(items).toHaveCount(totalCount);

  const context = await browser.newContext({ javaScriptEnabled: false });
  const noJsPage = await context.newPage();
  await noJsPage.goto("/experiments");
  await expect(noJsPage.locator('ul li a[href^="/experiments/"]').first()).toBeVisible();
  await context.close();
});

test("the hidden room's draggable artifact can be repositioned within its bounds", async ({ page }) => {
  await page.goto("/experiments/hidden");
  const artifact = page.getByRole("img", { name: /draggable artifact/i });
  await expect(artifact).toBeVisible();

  const before = await artifact.boundingBox();
  await artifact.hover();
  await page.mouse.down();
  await page.mouse.move((before!.x ?? 0) + 60, (before!.y ?? 0) + 30, { steps: 10 });
  await page.mouse.up();

  const after = await artifact.boundingBox();
  expect(after!.x).not.toBeCloseTo(before!.x, 0);
});
