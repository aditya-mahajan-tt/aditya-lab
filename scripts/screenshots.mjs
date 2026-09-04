#!/usr/bin/env node
/**
 * Captures every route at four breakpoints into .screenshots/.
 *
 * Claude Code cannot see the screen. After running this, READ the PNGs with
 * the Read tool before claiming anything about how the site looks.
 * See CLAUDE.md §5.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, ".screenshots");
/**
 * Own port, so a dev server on 3000 can never be screenshotted by accident —
 * that silently captures a stale build and is very hard to spot.
 */
const PORT = process.env.SHOT_PORT ?? "4321";
const BASE = process.env.SHOT_BASE_URL ?? `http://localhost:${PORT}`;

const ROUTES = [
  ["home", "/"],
  ["work", "/work"],
  ["work-detail", "/work/gostops-gtm"],
  ["experiments", "/experiments"],
  ["thinking", "/thinking"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["resume", "/resume"],
  ["404", "/this-route-does-not-exist"],
];

const VIEWPORTS = [
  ["375", 375, 812],
  ["768", 768, 1024],
  ["1280", 1280, 800],
  ["1920", 1920, 1080],
];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const server = spawn("npm", ["run", "--silent", "start", "--", "--port", String(PORT)], {
  cwd: ROOT,
  stdio: "ignore",
  env: { ...process.env, PORT: String(PORT) },
});
process.on("exit", () => server.kill());

await waitForServer(BASE);

// Same escape hatch as playwright.config.ts — see the note there.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
const browser = await chromium.launch(
  executablePath ? { executablePath, args: ["--no-sandbox"] } : {},
);
const problems = [];

for (const [vpName, width, height] of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  page.on("console", (msg) => {
    // The 404 route legitimately returns a 404 for its own document request.
    const selfInflicted404 =
      page.url().includes("this-route-does-not-exist") && msg.text().includes("404");
    if (msg.type() === "error" && !selfInflicted404) {
      problems.push(`console.error @ ${page.url()} — ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => problems.push(`pageerror @ ${page.url()} — ${err.message}`));

  for (const [name, route] of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    if (overflow) problems.push(`horizontal overflow: ${route} @ ${width}px`);

    await page.screenshot({ path: join(OUT, `${name}-${vpName}.png`), fullPage: true });
  }

  await context.close();
}

await browser.close();
server.kill();

console.log(`\nScreenshots written to .screenshots/ (${ROUTES.length * VIEWPORTS.length} files)`);
if (problems.length) {
  console.error(`\n[31m${problems.length} problem(s) found while capturing:[0m`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("No console errors, no horizontal overflow.\n");
console.log("→ Now READ the PNGs. Do not describe a UI you have not looked at.\n");

async function waitForServer(url, timeout = 60_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not start within ${timeout}ms`);
}
