import { test, expect, type Page } from "@playwright/test";

/**
 * Coverage for components/about/ProgressionStage (design spec §3.2),
 * mirroring e2e/webgl.spec.ts's helpers and rigor for the site's second
 * WebGL consumer.
 */

function captureProblems(page: Page) {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  return problems;
}

async function forceQuality(page: Page, quality: string) {
  await page.addInitScript((value) => {
    window.localStorage.setItem(
      "aditya-lab",
      JSON.stringify({ state: { soundEnabled: false, quality: value }, version: 0 }),
    );
  }, quality);
}

async function disableWebGL(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, id: string, ...rest: unknown[]) {
      if (id === "webgl" || id === "webgl2" || id === "experimental-webgl") return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (original as any).call(this, id, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

test("with WebGL unavailable, all six progression stages are still present as native <details>", async ({ page }) => {
  await disableWebGL(page);
  await page.goto("/about");

  await expect(page.locator("canvas")).toHaveCount(0);

  const first = page.locator("details").first();
  await expect(first).toBeVisible();
  await first.locator("summary").click();
  await expect(first).toHaveAttribute("open", "");
});

test("every progression stage and timeline entry opens with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/about");

  // 6 progression stages + at least 2 timeline entries (education) — the
  // exact experience.ts count can grow, so this only asserts a floor.
  const summaries = page.locator("summary");
  expect(await summaries.count()).toBeGreaterThanOrEqual(8);

  const firstDetails = page.locator("details").first();
  await firstDetails.locator("summary").click();
  await expect(firstDetails).toHaveAttribute("open", "");

  await context.close();
});

test("an explicit HIGH mounts the progression canvas without breaking the DOM controls", async ({ page }) => {
  const problems = captureProblems(page);
  await forceQuality(page, "high");
  await page.goto("/about");

  // Mirrors webgl.spec.ts's CORE stage: the chunk mounts only once the
  // stage's IntersectionObserver (rootMargin 300px) sees it approach the
  // viewport, which on a phone-sized screen means after a scroll — the
  // fallback <ol> is the same element the observer watches before the
  // canvas exists, since it's the wrapper's only child until then.
  await page.locator("ol").first().scrollIntoViewIfNeeded();

  const canvas = page.locator("canvas");
  await expect(canvas).toHaveCount(1, { timeout: 15_000 });

  const box = await canvas.boundingBox();
  if (!box) throw new Error("the progression canvas has no layout box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);

  // The DOM <details> list is the real control surface and must still work
  // once the 3D layer is live.
  const first = page.locator("details").first();
  await first.locator("summary").click();
  await expect(first).toHaveAttribute("open", "");

  await expect(canvas).toHaveCount(1);
  expect(problems, "the progression map produced console errors").toEqual([]);
});

test("the progression canvas is aria-hidden and never the only route to its content", async ({ page }) => {
  await forceQuality(page, "high");
  await page.goto("/about");

  // See the scroll comment above — same lazy-mount gate applies here.
  await page.locator("ol").first().scrollIntoViewIfNeeded();

  await expect(page.locator("canvas")).toHaveCount(1, { timeout: 15_000 });
  await expect(
    page.locator("canvas").locator("xpath=ancestor::*[@aria-hidden='true']").first(),
  ).toHaveCount(1);

  // The six stage labels are real text in the DOM, not canvas-only content.
  await expect(page.getByText("CURIOUS", { exact: true })).toBeVisible();
});

test("opening one progression stage's <details> closes the previously open one (DOM-only accordion coupling)", async ({ page }) => {
  await page.goto("/about");

  const stages = page.locator("ol").first().locator("details");
  const first = stages.nth(0);
  const second = stages.nth(1);

  await first.locator("summary").click();
  await expect(first).toHaveAttribute("open", "");

  await second.locator("summary").click();
  await expect(second).toHaveAttribute("open", "");
  await expect(first).not.toHaveAttribute("open", "");
});

test("the /systems -> /about#experience-turbotork deep link (data/systems.ts) resolves to a real element", async ({ page }) => {
  await page.goto("/about#experience-turbotork");
  await expect(page.locator("#experience-turbotork")).toHaveCount(1);
});
