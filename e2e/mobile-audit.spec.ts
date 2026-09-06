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
