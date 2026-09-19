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

test("every framework step carries a real moment @thinking", () => {
  for (const step of thinking.steps) {
    expect(step.moment, `step ${step.label} has no moment`).toBeDefined();
    expect(step.moment!.body.length).toBeGreaterThan(20);
  }
});

test("every moment link points at a real project route @thinking", () => {
  const slugs = new Set(getAllProjects().map((p) => p.slug));
  for (const step of thinking.steps) {
    const link = step.moment?.link;
    if (!link) continue;
    expect(
      link.url.startsWith("/work/") && slugs.has(link.url.slice("/work/".length)),
      `step ${step.label} moment links to unknown route ${link.url}`,
    ).toBe(true);
  }
});

test("the framework diagram is reachable on mobile @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/thinking");
  const observe = page.getByRole("button", { name: /OBSERVE/i }).first();
  await expect(observe).toBeVisible();

  // Tap targets are >= 44px tall (CLAUDE.md mobile audit standard).
  const buttons = page.locator("ul button[aria-pressed]");
  await expect(buttons).toHaveCount(thinking.steps.length);
  for (let i = 0; i < thinking.steps.length; i++) {
    const box = await buttons.nth(i).boundingBox();
    expect(box?.height, `mobile step button ${i} height`).toBeGreaterThanOrEqual(44);
  }

  // Tapping a step swaps the caption to that step's body and moment link.
  const test_ = thinking.steps.find((s) => s.label === "TEST")!;
  await page.getByRole("button", { name: /TEST/i }).first().click();
  const caption = page.locator("figcaption");
  await expect(caption).toContainText(test_.body);
  await expect(caption.getByRole("link", { name: /Kensara AI/ })).toHaveAttribute(
    "href",
    "/work/kensara-ai-gtm",
  );
  // The caption link is a 44px tap target too.
  const linkBox = await caption.getByRole("link").boundingBox();
  expect(linkBox?.height, "caption link height").toBeGreaterThanOrEqual(44);
});

test("selecting a node updates the caption on desktop @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/thinking");
  const test_ = thinking.steps.find((s) => s.label === "TEST")!;
  const caption = page.locator("figcaption");
  await expect(caption).toContainText(thinking.steps[0]!.body);

  await page.locator('svg [role="button"]').filter({ hasText: "TEST" }).click();
  await expect(caption).toContainText(test_.body);
  await expect(caption).toContainText(test_.moment!.body);
  await expect(caption.getByRole("link", { name: /Kensara AI/ })).toHaveAttribute(
    "href",
    "/work/kensara-ai-gtm",
  );
});

test("keyboard focus on an inactive node changes its rect stroke and shows an outline @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/thinking");
  const nodes = page.locator('svg [role="button"]');
  const target = nodes.nth(1); // inactive: step 0 is the selected one on load
  await expect(target).toHaveAttribute("aria-pressed", "false");

  const read = () =>
    target.evaluate((el) => {
      const rect = getComputedStyle(el.querySelector("rect")!);
      return {
        isActiveElement: document.activeElement === el,
        outlineStyle: getComputedStyle(el).outlineStyle,
        stroke: rect.stroke,
        strokeWidth: rect.strokeWidth,
      };
    });

  const before = await read();
  expect(before.isActiveElement).toBe(false);

  // Reach the node with a real Tab so :focus-visible matches (keyboard focus).
  await nodes.nth(0).focus();
  await page.keyboard.press("Tab");
  await expect(target).toBeFocused();

  const after = await read();
  expect(after.isActiveElement).toBe(true);
  // The rect itself must change to the focus colour and a heavier stroke --
  // this does not rely on SVG outline rendering.
  expect(after.stroke, JSON.stringify({ before, after })).toBe("rgb(93, 232, 255)");
  expect(after.stroke).not.toBe(before.stroke);
  expect(after.strokeWidth).not.toBe(before.strokeWidth);
  // The global :focus-visible outline is not suppressed either.
  expect(after.outlineStyle, JSON.stringify(after)).not.toBe("none");
});

test("arrow keys move both selection and focus @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/thinking");
  const nodes = page.locator('svg [role="button"]');
  const second = nodes.nth(1);

  await nodes.nth(0).focus();
  await expect(nodes.nth(0)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("figcaption")).toContainText(thinking.steps[1]!.body);
});

test("the traveling pulse runs without reduced motion @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/thinking");
  const pulse = page.locator("[data-framework-pulse]");
  await expect(pulse).toHaveCount(1);
  await expect(pulse).toBeVisible();
  await expect(pulse).toHaveAttribute("aria-hidden", "true");
});

test("the traveling pulse stops under reduced motion @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/thinking");
  // The pulse element stays in the DOM and is hidden by CSS, so assert on
  // visibility -- NOT toHaveCount(0), which would always fail.
  await expect(page.locator("[data-framework-pulse]")).toBeHidden();
  // The loop and all its text stay: reduced motion loses no information.
  await expect(page.getByRole("button", { name: /ITERATE/i }).first()).toBeVisible();
});

test("every step's body and moment survive with JavaScript disabled @thinking", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/thinking");
  const text = (await page.locator("main").textContent()) ?? "";
  for (const step of thinking.steps) {
    expect(text, `body of ${step.label}`).toContain(step.body);
    expect(text, `moment of ${step.label}`).toContain(step.moment!.body);
  }
  await context.close();
});
