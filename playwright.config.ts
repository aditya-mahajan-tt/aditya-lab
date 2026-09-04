import { defineConfig, devices } from "@playwright/test";

/**
 * Own port, deliberately not 3000: a dev server left running on 3000 would
 * otherwise be reused and the suite would silently test a stale build.
 */
const PORT = Number(process.env.E2E_PORT ?? 4322);
const baseURL = `http://localhost:${PORT}`;

/**
 * Escape hatch for CI images or sandboxes that already ship a Chromium and
 * cannot download Playwright's pinned build. Leave unset locally — the normal
 * path is `npx playwright install chromium`.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
const launchOptions = executablePath
  ? { launchOptions: { executablePath, args: ["--no-sandbox"] } }
  : {};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], ...launchOptions } },
    // Chromium-based Android profile — runs everywhere without extra browsers.
    { name: "mobile", use: { ...devices["Pixel 7"], ...launchOptions } },
    // iOS Safari needs WebKit: `npx playwright install webkit`, then
    // `npx playwright test --project=ios`. Also covered by the manual browser
    // matrix in QA_AND_PERFORMANCE.md §6.
    ...(process.env.PLAYWRIGHT_WEBKIT === "1"
      ? [{ name: "ios", use: { ...devices["iPhone 13"] } }]
      : []),
  ],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
