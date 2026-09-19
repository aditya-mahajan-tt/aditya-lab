import { test, expect } from "@playwright/test";
import { thinking } from "@/data/thinking";
import { getAllProjects } from "@/data/queries";
import { buildBrainMesh } from "@/components/thinking/brainMesh";

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

test("keyboard focus on an inactive hub changes its ring stroke and shows an outline @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/thinking");
  const nodes = page.locator('svg [role="button"]');
  const target = nodes.nth(1); // inactive: step 0 is the selected one on load
  await expect(target).toHaveAttribute("aria-pressed", "false");

  const read = () =>
    target.evaluate((el) => {
      const ring = getComputedStyle(el.querySelector("[data-hub-ring]")!);
      return {
        isActiveElement: document.activeElement === el,
        outlineStyle: getComputedStyle(el).outlineStyle,
        stroke: ring.stroke,
        strokeWidth: ring.strokeWidth,
      };
    });

  const before = await read();
  expect(before.isActiveElement).toBe(false);

  // Reach the hub with a real Tab so :focus-visible matches (keyboard focus).
  await nodes.nth(0).focus();
  await page.keyboard.press("Tab");
  await expect(target).toBeFocused();

  const after = await read();
  expect(after.isActiveElement).toBe(true);
  // The ring itself must change to the focus colour and a heavier stroke --
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
  // Idle: neurons blink and nothing is lit.
  expect(await page.locator("[data-brain-blink]").count()).toBeGreaterThan(0);
  await expect(page.locator('[data-lit="true"]')).toHaveCount(0);
});

test("the traveling pulse stops under reduced motion @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/thinking");
  // The pulse element stays in the DOM and is hidden by CSS, so assert on
  // visibility -- NOT toHaveCount(0), which would always fail.
  await expect(page.locator("[data-framework-pulse]")).toBeHidden();
  // Blinking neurons are SMIL too, so they are hidden by the same CSS block.
  const blinkers = page.locator("[data-brain-blink]");
  expect(await blinkers.count()).toBeGreaterThan(0);
  for (const b of await blinkers.all()) await expect(b).toBeHidden();
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

/** The mesh's neuron count for step k's section -- what a lit section must equal. */
const sectionSize = (k: number) => buildBrainMesh(thinking.steps.length).nodes.filter((n) => n.section === k).length;

/** Asserts exactly section k is lit: its neurons, none from any other section. */
async function expectOnlySectionLit(page: import("@playwright/test").Page, k: number) {
  const lit = page.locator('[data-lit="true"]');
  await expect(lit).toHaveCount(sectionSize(k));
  const sections = await lit.evaluateAll((els) => els.map((el) => el.getAttribute("data-section")));
  expect(new Set(sections)).toEqual(new Set([String(k)]));
  // Idle-only decoration is gone while a section is lit.
  await expect(page.locator("[data-framework-pulse]")).toBeHidden();
  await expect(page.locator("[data-brain-blink]")).toHaveCount(0);
  // Edges: only that section's internal edges are lit.
  const edgeSections = await page
    .locator('[data-edge-lit="true"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-section")));
  expect(edgeSections.length).toBeGreaterThan(0);
  expect(new Set(edgeSections)).toEqual(new Set([String(k)]));
}

const hubHit = (page: import("@playwright/test").Page, name: RegExp) =>
  page.getByRole("button", { name }).locator("[data-hub-hit]");

test("hovering a hub lights exactly its section and pauses the idle animation @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/thinking");
  const frame = thinking.steps.findIndex((s) => s.label === "FRAME");
  const iterate = thinking.steps.findIndex((s) => s.label === "ITERATE");
  expect(frame).toBeGreaterThan(-1);

  await expect(page.locator("[data-framework-pulse]")).toBeVisible();
  await expect(page.locator('[data-lit="true"]')).toHaveCount(0);

  await hubHit(page, /FRAME/i).hover();
  await expectOnlySectionLit(page, frame);

  // A different hub lights a different, equally exclusive section.
  await hubHit(page, /ITERATE/i).hover();
  await expectOnlySectionLit(page, iterate);

  // Leaving every hub returns to idle.
  await page.mouse.move(2, 2);
  await expect(page.locator('[data-lit="true"]')).toHaveCount(0);
  await expect(page.locator("[data-framework-pulse]")).toBeVisible();
  expect(await page.locator("[data-brain-blink]").count()).toBeGreaterThan(0);
});

test("the hub hit target is at least 44px across at desktop width @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/thinking");
  for (const hit of await page.locator("[data-hub-hit]").all()) {
    const box = await hit.boundingBox();
    expect(box?.width, "hub hit target width").toBeGreaterThanOrEqual(44);
    expect(box?.height, "hub hit target height").toBeGreaterThanOrEqual(44);
  }
});

test("keyboard focus lights a hub's section and blurring returns to idle @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/thinking");
  const nodes = page.locator('svg [role="button"]');

  await nodes.nth(0).focus();
  await page.keyboard.press("Tab");
  await expect(nodes.nth(1)).toBeFocused();
  await expectOnlySectionLit(page, 1);

  await nodes.nth(1).blur();
  await expect(page.locator('[data-lit="true"]')).toHaveCount(0);
  await expect(page.locator("[data-framework-pulse]")).toBeVisible();
});

test("a mouse click does not pin the section lit after the pointer leaves @thinking", async ({ page, hasTouch }) => {
  test.skip(hasTouch, "touch devices hold the tapped section lit -- see the next test");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/thinking");
  await hubHit(page, /TEST/i).click();
  await page.mouse.move(2, 2);
  await expect(page.locator('[data-lit="true"]')).toHaveCount(0);
});

test("on touch, idle shows until a tap, then the tapped section stays lit @thinking", async ({ page, hasTouch }) => {
  test.skip(!hasTouch, "touch-only behaviour");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/thinking");
  const test_ = thinking.steps.findIndex((s) => s.label === "TEST");
  // Selection starts on step 1, but nothing has been tapped yet: still idle.
  await expect(page.locator("[data-framework-pulse]")).toBeVisible();
  await expect(page.locator('[data-lit="true"]')).toHaveCount(0);

  await hubHit(page, /TEST/i).tap();
  await expectOnlySectionLit(page, test_);
  // It holds: no hover to lose on a touch screen.
  await page.mouse.move(2, 2);
  await expectOnlySectionLit(page, test_);
});

test("hovering another hub lights its section without changing the caption @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/thinking");
  const test_ = thinking.steps.find((s) => s.label === "TEST")!;
  const frame = thinking.steps.findIndex((s) => s.label === "FRAME");
  const caption = page.locator("figcaption");

  await hubHit(page, /TEST/i).click();
  await expect(caption).toContainText(test_.body);
  await expect(page.getByRole("button", { name: /TEST/i }).first()).toHaveAttribute("aria-pressed", "true");

  await hubHit(page, /FRAME/i).hover();
  await expectOnlySectionLit(page, frame);
  await expect(caption).toContainText(test_.body);
  await expect(caption).not.toContainText(thinking.steps[frame]!.body);
  await expect(page.getByRole("button", { name: /FRAME/i }).first()).toHaveAttribute("aria-pressed", "false");
});

test("under reduced motion hovering still lights the section, steadily @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/thinking");
  const frame = thinking.steps.findIndex((s) => s.label === "FRAME");

  await hubHit(page, /FRAME/i).hover();
  await expectOnlySectionLit(page, frame);
  // Steady: no firing animation is rendered on the lit neurons.
  await expect(page.locator('[data-lit="true"] animate')).toHaveCount(0);
  // The lit state is real colour, not just motion.
  const fill = await page.locator('[data-lit="true"]').first().evaluate((el) => getComputedStyle(el).fill);
  expect(fill).toBe("rgb(182, 255, 74)");
  // Text and caption stay available.
  await hubHit(page, /FRAME/i).click();
  await expect(page.locator("figcaption")).toContainText(thinking.steps[frame]!.body);
});

test("without reduced motion the lit section fires softly @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/thinking");
  await hubHit(page, /FRAME/i).hover();
  await expect(page.locator('[data-lit="true"] animate').first()).toBeAttached();
});

test("other sections stay dim while one is lit @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/thinking");
  const frame = thinking.steps.findIndex((s) => s.label === "FRAME");
  await hubHit(page, /FRAME/i).hover();
  const other = page.locator(`[data-brain-node]:not([data-section="${frame}"])`).first();
  expect(await other.evaluate((el) => getComputedStyle(el).fill)).toBe("rgb(59, 65, 69)");
});
