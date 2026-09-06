import { test, expect } from "@playwright/test";

/**
 * Regression suite for docs/superpowers/specs/2026-09-06-mobile-audit-and-orbital-hero-design.md §2.
 * Fixed at 375×812 (iPhone 13) to match the audit's conditions regardless
 * of which playwright.config.ts project runs this file.
 */
test.use({ viewport: { width: 375, height: 812 } });

test("check:placeholders --strict exits non-zero when data has an outstanding token", async () => {
  const { spawnSync } = await import("node:child_process");
  const run = spawnSync("node", ["scripts/check-placeholders.mjs", "--strict"], {
    encoding: "utf8",
  });
  // This repo currently has real, intentional placeholders (CLAUDE.md §7/§8) —
  // this assertion documents that the guard is armed, not that content is done.
  expect(run.status).not.toBe(0);
});

test("no interactive element renders under 44px in either dimension at 375px", async ({ page }) => {
  const routes = ["/", "/work/gostops-gtm", "/resume", "/contact"];
  const offenders: string[] = [];

  for (const route of routes) {
    await page.goto(route, { waitUntil: "networkidle" });

    if (route === "/") {
      await page.getByRole("button", { name: "Open Ask the Lab" }).click();
      await expect(page.locator('dialog[aria-label="Ask the Lab"]')).toBeVisible();
    }

    const found = await page.evaluate(() => {
      const isVisible = (el: Element) => {
        // Content of a closed native <details> (e.g. NavOverlay's route-link
        // panel) is not display:none — Chromium implements it via
        // content-visibility:hidden, so getComputedStyle/getBoundingClientRect
        // report misleading non-zero-ish dimensions for genuinely
        // non-hit-testable content. checkVisibility() correctly reports false
        // for it; fall back to the cruder checks where it's unsupported.
        const checkable = el as unknown as { checkVisibility?: () => boolean };
        if (typeof checkable.checkVisibility === "function" && !checkable.checkVisibility()) return false;
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
      const bad: string[] = [];
      for (const el of document.querySelectorAll("a, button, [role=button]")) {
        if (!isVisible(el)) continue;
        // sr-only elements (skip link, visually-hidden form controls paired
        // with a visible label) are intentionally smaller than 44px until
        // focused — not a tap-target defect.
        if (getComputedStyle(el).position === "absolute" && el.className.toString().includes("sr-only")) continue;
        const rect = el.getBoundingClientRect();
        if (rect.height < 44 || rect.width < 44) {
          bad.push(`${el.tagName.toLowerCase()} "${(el.textContent || "").trim().slice(0, 30)}" ${Math.round(rect.width)}x${Math.round(rect.height)}`);
        }
      }
      return bad;
    });

    for (const f of found) offenders.push(`${route}: ${f}`);

    if (route === "/") await page.keyboard.press("Escape");
  }

  expect(offenders, offenders.join("\n")).toEqual([]);
});

test("the command palette trigger is hidden at 375px but Ctrl+K still opens it", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Open command palette" })).toBeHidden();

  await page.getByRole("button", { name: "Open Ask the Lab" }).focus();
  await page.keyboard.press("Control+k");
  await expect(page.locator('dialog[aria-label="Command palette"]')).toBeVisible();
});

test("MENU carries the same border as its header siblings at 375px", async ({ page }) => {
  await page.goto("/");
  // borderStyle is "solid" on every element in this Tailwind v4 build
  // (preflight sets border: 0 solid globally) regardless of whether the
  // `border` utility is applied — it can't tell "has a border" from
  // "doesn't". borderTopWidth is the property Tailwind's `border` utility
  // actually changes (0px -> 1px), so it's the one that can fail if the
  // border is ever removed.
  const menuBorderWidth = await page.locator("header summary").evaluate((el) => getComputedStyle(el).borderTopWidth);
  const askBorderWidth = await page
    .getByRole("button", { name: "Open Ask the Lab" })
    .evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(menuBorderWidth).not.toBe("0px");
  expect(menuBorderWidth).toBe(askBorderWidth);
});
