import { test, expect } from "@playwright/test";

/**
 * Coverage for components/about/IdentityMap and MilestoneTimeline (design
 * spec revision, 2026-09-05) — a 2D mind map and a real milestone rail,
 * neither depending on WebGL. Every stage/entry is real, always-visible DOM
 * content; hover/click interactions are decorative or progressive
 * enhancements only, never the only route to information.
 */

const STAGE_LABELS = ["CURIOUS", "BUILDER", "MARKETER", "PRODUCT THINKER", "AI EXPLORER", "STILL EXPERIMENTING"];

test("all six identity stages are visible with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/about");

  for (const label of STAGE_LABELS) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }

  await context.close();
});

test("hovering an identity stage lights its connector (desktop only, purely decorative)", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "the radial map only renders at md+ widths");
  await page.goto("/about");

  const node = page.getByTestId("identity-stage-0");
  const connector = page.getByTestId("identity-connector-0");

  await expect(connector).toHaveAttribute("stroke", "var(--color-border-strong)");
  await node.hover();
  await expect(connector).toHaveAttribute("stroke", "var(--color-accent)");
  await page.mouse.move(0, 0);
  await expect(connector).toHaveAttribute("stroke", "var(--color-border-strong)");
});

test("focusing an identity stage with the keyboard lights its connector too", async ({ page, isMobile }) => {
  test.skip(isMobile, "the radial map only renders at md+ widths");
  await page.goto("/about");

  const node = page.getByTestId("identity-stage-2");
  const connector = page.getByTestId("identity-connector-2");

  await node.focus();
  await expect(connector).toHaveAttribute("stroke", "var(--color-accent)");
});

test("the identity map produces no console errors while interacted with", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));

  await page.goto("/about");
  const node = page.getByTestId("identity-stage-1");
  await node.hover();
  await node.focus();
  await page.mouse.move(0, 0);

  expect(problems, "the identity map produced console errors").toEqual([]);
});

test("every timeline entry's figures are reachable with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/about");

  const first = page.getByTestId("timeline-entry-0");
  await expect(first.locator("summary")).toBeVisible();
  await first.locator("summary").click();
  await expect(first).toHaveAttribute("open", "");

  await context.close();
});

test("opening one milestone's panel closes the previously open one (single-accordion coupling)", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "the desktop rail enforces one-open-at-a-time; the mobile stack does not");
  await page.goto("/about");

  const first = page.getByTestId("timeline-entry-0");
  const second = page.getByTestId("timeline-entry-1");

  await first.locator("summary").click();
  await expect(first).toHaveAttribute("open", "");

  await second.locator("summary").click();
  await expect(second).toHaveAttribute("open", "");
  await expect(first).not.toHaveAttribute("open", "");
});

test("clicking a milestone's dot marker also opens its panel", async ({ page, isMobile }) => {
  test.skip(isMobile, "the dot marker only exists in the desktop rail");
  await page.goto("/about");

  const entry = page.getByTestId("timeline-entry-3");
  await expect(entry).not.toHaveAttribute("open", "");

  await page.getByTestId("timeline-dot-3").click();
  await expect(entry).toHaveAttribute("open", "");
});

test("an opened milestone panel shows its real highlight figures", async ({ page }) => {
  await page.goto("/about");

  const turbotork = page.getByTestId("timeline-entry-3");
  await turbotork.locator("summary").click();
  await expect(turbotork.getByText("$250K", { exact: true })).toBeVisible();
});

test("the /systems -> /about#experience-turbotork deep link resolves to a real element", async ({ page }) => {
  await page.goto("/about#experience-turbotork");
  await expect(page.locator("#experience-turbotork")).toHaveCount(1);
});
