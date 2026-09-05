import { test, expect, type Page } from "@playwright/test";

/**
 * The WebGL rows of the QA_AND_PERFORMANCE.md §4 failure matrix, plus the
 * PLAN.md Phase 8 exit criterion: with WebGL off, the site is
 * indistinguishable in usefulness from V1.
 *
 * Headless Chromium reports WebGL but rasterises through SwiftShader, so
 * `lib/quality` auto-declines it — which is correct behaviour and also why
 * the tests that need a live canvas force the quality preference to HIGH
 * first (a soft veto an explicit user choice is allowed to override).
 */

const CORE = "svg.core-dom";

/**
 * Scoped to the hero's own stage, not the page as a whole — PLAN.md Phase
 * 13 gave the homepage a second, independently-gated canvas (the Lab
 * environment, further down the page), so "one canvas on the page" is no
 * longer the right invariant. These tests are specifically about the
 * hero's 3D layer, and the hero canvas shares a parent with `CORE`.
 */
function heroCanvas(page: Page) {
  return page.locator(CORE).locator("xpath=..").locator("canvas");
}

function captureProblems(page: Page) {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  return problems;
}

/** Seeds the persisted zustand store before any app code runs. */
async function forceQuality(page: Page, quality: string) {
  await page.addInitScript((value) => {
    window.localStorage.setItem(
      "aditya-lab",
      JSON.stringify({ state: { soundEnabled: false, quality: value }, version: 0 }),
    );
  }, quality);
}

/** Makes the page look like a device with no WebGL at all. */
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

test("with WebGL unavailable the hero is complete and the DOM core renders", async ({ page }) => {
  const problems = captureProblems(page);
  await disableWebGL(page);
  await page.goto("/");

  // The recruiter path, unchanged (CLAUDE.md §2).
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /explore work/i })).toBeVisible();
  await expect(page.locator(CORE)).toBeVisible();
  await expect(page.locator(CORE)).toHaveAttribute("data-suppressed", "false");

  await expect(page.locator("canvas")).toHaveCount(0);
  expect(problems, "WebGL-off homepage produced console errors").toEqual([]);
});

test("reduced motion never loads the 3D layer", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await forceQuality(page, "high");
  await page.goto("/");

  await expect(page.locator(CORE)).toBeVisible();
  await page.locator(CORE).scrollIntoViewIfNeeded();
  // Given a full second, a canvas would have mounted if it were going to.
  await page.waitForTimeout(1000);
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("LOW is a real user choice: no canvas, no 3D chunk", async ({ page }) => {
  const threeRequests: string[] = [];
  page.on("request", (req) => {
    if (/three|react-three/i.test(req.url())) threeRequests.push(req.url());
  });

  await forceQuality(page, "low");
  await page.goto("/");
  await expect(page.locator(CORE)).toBeVisible();
  await page.locator(CORE).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  await expect(page.locator("canvas")).toHaveCount(0);
  expect(threeRequests, "LOW quality should not fetch the 3D chunk").toEqual([]);
});

test("an explicit HIGH mounts the 3D core and fades the DOM core out", async ({ page }) => {
  const problems = captureProblems(page);
  await forceQuality(page, "high");
  await page.goto("/");

  // The chunk is only fetched once the stage approaches the viewport, which
  // on a phone-sized screen means after a scroll.
  await page.locator(CORE).scrollIntoViewIfNeeded();
  await expect(heroCanvas(page)).toHaveCount(1, { timeout: 15_000 });

  // The DOM core stays in the document as the accessible representation —
  // it is faded, not removed, and the canvas above it is aria-hidden.
  await expect(page.locator(CORE)).toHaveAttribute("data-suppressed", "true", { timeout: 15_000 });
  await expect(page.locator(CORE)).toHaveCount(1);
  await expect(heroCanvas(page).locator("xpath=ancestor::*[@aria-hidden='true']").first()).toHaveCount(1);

  expect(problems, "the 3D layer produced console errors").toEqual([]);
});

test("a lost context swaps back to the DOM core and says so", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await forceQuality(page, "high");
  await page.goto("/");
  await expect(heroCanvas(page)).toHaveCount(1, { timeout: 15_000 });
  await expect(page.locator(CORE)).toHaveAttribute("data-suppressed", "true", { timeout: 15_000 });

  await page.evaluate((core) => {
    const canvas = document.querySelector(core)?.parentElement?.querySelector("canvas");
    const gl = canvas?.getContext("webgl2") ?? canvas?.getContext("webgl");
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  }, CORE);

  await expect(page.getByText(/3D EXPERIENCE UNAVAILABLE/i)).toBeVisible({ timeout: 10_000 });
  await expect(heroCanvas(page)).toHaveCount(0);
  await expect(page.locator(CORE)).toHaveAttribute("data-suppressed", "false");
  await expect(page.locator("h1")).toHaveCount(1);

  expect(pageErrors, "losing the context threw").toEqual([]);
});

test("the 3D core survives pointer interaction and scrolling", async ({ page }) => {
  const problems = captureProblems(page);
  await forceQuality(page, "high");
  await page.goto("/");

  await page.locator(CORE).scrollIntoViewIfNeeded();
  const canvas = heroCanvas(page);
  await expect(canvas).toHaveCount(1, { timeout: 15_000 });
  await expect(page.locator(CORE)).toHaveAttribute("data-suppressed", "true", { timeout: 15_000 });

  // Hover, then click to toggle expansion, then again to collapse. The
  // object owns no content, so there is nothing to assert about state —
  // what matters is that raycasting and the frame loop survive it.
  const box = await canvas.boundingBox();
  if (!box) throw new Error("the canvas has no layout box");
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  await page.mouse.move(cx, cy);
  await page.waitForTimeout(300);
  await page.mouse.click(cx, cy);
  await page.waitForTimeout(600);
  await page.mouse.click(cx, cy);

  // Scroll-linked dolly: the camera reacts, native scroll stays native.
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.scrollY), "the 3D layer must not hijack scroll").toBeGreaterThan(
    before,
  );

  await expect(canvas).toHaveCount(1);
  expect(problems, "interacting with the 3D core produced console errors").toEqual([]);
});

test("the quality control is keyboard-operable and persists", async ({ page }) => {
  // Driven from /about: the control is global chrome, and this keeps the
  // test off the one route where changing it would mount a renderer.
  await page.goto("/about");

  const auto = page.getByRole("radio", { name: "AUTO" });
  await expect(auto).toBeChecked();

  // Native radio-group behaviour: arrow keys move the selection.
  await auto.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "HIGH" })).toBeChecked();

  await page.keyboard.press("ArrowRight");
  const medium = page.getByRole("radio", { name: "MED" });
  await expect(medium).toBeChecked();

  await page.reload();
  await expect(page.getByRole("radio", { name: "MED" })).toBeChecked();
});
