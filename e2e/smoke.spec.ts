import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * The smoke suite is the mechanical half of the Definition of Done
 * (CLAUDE.md §4). Every route must pass every check here, at every phase.
 */

const ROUTES = [
  "/",
  "/work",
  "/work/gostops-gtm",
  "/systems",
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

    test("has no automated accessibility violations (axe, WCAG 2.1 AA)", async ({ page }) => {
      await page.goto(route);
      // Settle every GSAP scroll reveal first (same reasoning as
      // scripts/screenshots.mjs): scanning mid-tween catches RevealText
      // content at e.g. 13% opacity and axe correctly, but misleadingly,
      // flags that as a contrast violation. once:true means this persists.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(100);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const summary = results.violations.map(
        (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`,
      );
      expect(summary, `${route} has axe violations`).toEqual([]);
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

test("every route is reachable from the menu overlay using only the keyboard", async ({ page }) => {
  await page.goto("/");

  await page.locator("header summary").focus();
  await page.keyboard.press("Enter");

  const panel = page.locator('nav[aria-label="Full site"]');
  await expect(panel).toBeVisible();
  // Wait for the focus trap to actually attach (same race as the "no focus
  // escapes" test below) before driving it further.
  await expect(panel.locator("a").first()).toBeFocused();

  const links = panel.locator("a");
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(links.nth(i)).toBeVisible();
  }

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(page.locator("header summary")).toBeFocused();
});

test("no focus escapes the open menu overlay", async ({ page }) => {
  await page.goto("/");
  await page.locator("header summary").click();

  const panel = page.locator('nav[aria-label="Full site"]');
  await expect(panel).toBeVisible();
  // The trap attaches on a React effect one tick after the native <details>
  // toggle — wait for its auto-focus so the Tab loop below can't race ahead
  // of it (a real keypress never could; a scripted one occasionally can).
  await expect(panel.locator("a").first()).toBeFocused();

  const linkCount = await panel.locator("a").count();
  for (let i = 0; i < linkCount + 2; i++) {
    await page.keyboard.press("Tab");
  }

  const focusStayedInside = await page.evaluate(() => {
    const el = document.querySelector('nav[aria-label="Full site"]');
    return el?.contains(document.activeElement) ?? false;
  });
  expect(focusStayedInside).toBe(true);
});

test("command palette opens with the keyboard shortcut, searches, and navigates", async ({ page }) => {
  await page.goto("/");
  // Wait for hydration — the global ⌘K listener only exists after React
  // attaches, same as it would for a real visitor.
  await page.getByRole("button", { name: "Open command palette" }).focus();

  await page.keyboard.press("Control+k");
  const dialog = page.locator('dialog[aria-label="Command palette"]');
  await expect(dialog).toBeVisible();

  const input = dialog.getByRole("combobox");
  await expect(input).toBeFocused();

  await input.fill("work");
  await expect(dialog.getByRole("option").first()).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/work$/);
});

test("command palette closes on Escape and returns focus to its trigger", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open command palette" });
  await trigger.focus();

  await page.keyboard.press("Control+k");
  const dialog = page.locator('dialog[aria-label="Command palette"]');
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the work archive filters by category and the full list works with JavaScript disabled", async ({ page }) => {
  await page.goto("/work");
  const items = page.locator('ul li a[href^="/work/"]');
  const totalCount = await items.count();
  expect(totalCount).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Strategy" }).click();
  const filteredCount = await items.count();
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThan(totalCount);

  await page.getByRole("button", { name: "All" }).click();
  await expect(items).toHaveCount(totalCount);
});

test("content and navigation still render with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();

  // The wordmark link works with no JS at all.
  await expect(page.locator("header nav a").first()).toBeVisible();

  // The menu overlay is a native <details>/<summary> disclosure: it opens,
  // and every route it reveals is a real, working link, with zero JS.
  await page.locator("header summary").click();
  const workLink = page.locator('header nav a[href="/work"]');
  await expect(workLink).toBeVisible();
  await workLink.click();
  await expect(page).toHaveURL(/\/work$/);

  // The archive's default (unfiltered) state is server-rendered — the full
  // list of projects is there and reachable with no JS to run the filter.
  await expect(page.locator('ul li a[href^="/work/"]').first()).toBeVisible();

  await context.close();
});

test("under prefers-reduced-motion, scroll-revealed content is immediately visible with no transform", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  // A RevealText-wrapped heading well below the fold — under normal motion
  // this starts at opacity:0 until scrolled into view. Under reduced
  // motion it must already be fully visible, unscrolled.
  const heading = page.locator("#about-heading");
  await expect(heading).toBeVisible();
  const style = await heading.evaluate((el) => {
    const parent = el.closest("div");
    const computed = parent ? getComputedStyle(parent) : null;
    return { opacity: computed?.opacity, transform: computed?.transform };
  });
  expect(style.opacity).toBe("1");
  expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(style.transform);
});

test("scroll-revealed content becomes visible once scrolled into view", async ({ page }) => {
  await page.goto("/");
  const heading = page.locator("#about-heading");
  const revealParent = heading.locator("xpath=ancestor::div[1]");

  // Above the fold, before any scroll: still mid-reveal (opacity 0, per
  // useScrollReveal's initial gsap.set), never mistaken for missing content
  // since it's already in the DOM and reachable — just not yet faded in.
  await expect(revealParent).toBeAttached();

  await heading.scrollIntoViewIfNeeded();
  await expect(revealParent).toHaveCSS("opacity", "1", { timeout: 5000 });
});

// QA_AND_PERFORMANCE.md §4 failure tests. WebGL off and WebGL context-lost
// now have a 3D layer to fail and live in e2e/webgl.spec.ts. "AI key removed"
// now has an assistant to fail too — see e2e/ask-the-lab.spec.ts's offline-state
// test, which mocks a failed /api/ask response rather than depending on
// whether AI_PROVIDER_API_KEY happens to be configured in this environment.
// "Images 404" has nothing to test against either:
// every media array in /data is still empty (no photo or project media has
// been supplied), so the site currently renders zero <img> elements.

test("content still loads and is usable on a throttled slow connection", async ({ page, context }) => {
  const client = await context.newCDPSession(page);
  await client.send("Network.enable");
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 400,
    downloadThroughput: (500 * 1024) / 8, // ~500kbps, roughly "Slow 3G"
    uploadThroughput: (500 * 1024) / 8,
  });

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore Work" })).toBeVisible();
});

test("page remains usable at 200% browser zoom", async ({ page }) => {
  await page.goto("/about");
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await expect(page.locator("h1")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow, "200% zoom overflows horizontally").toBe(false);
});
