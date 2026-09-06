#!/usr/bin/env node
/**
 * Captures every route at four breakpoints into .screenshots/.
 *
 * Claude Code cannot see the screen. After running this, READ the PNGs with
 * the Read tool before claiming anything about how the site looks.
 * See CLAUDE.md §5.
 *
 * KNOWN ARTIFACT: fullPage screenshots are stitched while Chromium scrolls, so
 * a position:fixed element (the sticky header; the Phase 5 boot overlay on
 * "/") can leave a ghost band that looks like a duplicated or bleeding-through
 * element. It is not in the DOM. Before "fixing" anything you see only in a
 * fullPage shot, re-check with a viewport-sized screenshot or by querying the DOM.
 *
 * SCROLL REVEALS (Phase 6): a fullPage capture never dispatches real scroll
 * events, so GSAP ScrollTrigger reveals below the fold would never fire and
 * whole sections would screenshot as blank. Each route is scrolled to the
 * bottom and back before capture specifically to trigger them first.
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
  ["work-kensara", "/work/kensara-ai-gtm"],
  ["work-adda", "/work/adda-d2c"],
  ["systems", "/systems"],
  ["experiments", "/experiments"],
  ["experiments-hidden", "/experiments/hidden"],
  ["thinking", "/thinking"],
  ["about", "/about"],
  ["build", "/build"],
  ["log", "/log"],
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

    // body { overflow-x: hidden } (app/globals.css) clips
    // documentElement.scrollWidth to the viewport width, so that check can
    // never fire. A per-element bounding-box check is not affected by the
    // clip — getBoundingClientRect() still reports an element's true
    // position even when the page hides the resulting scrollbar.
    const overflowingElements = await page.evaluate(() => {
      const vw = window.innerWidth;
      const offenders = [];
      for (const el of document.querySelectorAll("body *")) {
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;
        // el.getAttribute alone only catches an element that carries the
        // attribute itself — aria-hidden="true" on a wrapper (e.g.
        // CustomCursor's dot) hides its children from the accessibility
        // tree too, but doesn't set the attribute on them. closest() walks
        // the ancestor chain, matching how aria-hidden actually propagates.
        //
        // This also silences every other aria-hidden subtree on the site —
        // notably the 3D canvas containers (three/LabCanvas.tsx,
        // three/LabEnvironmentCanvas.tsx) and decorative icon SVGs — which
        // is intended, not a side effect: those are each documented at
        // their own definition as holding no unique content, with a plain
        // DOM fallback carrying the real information, and app/globals.css's
        // `overflow-x: hidden` already made anything inside them invisible
        // to a real visitor regardless of this check. If a route ever adds
        // an aria-hidden subtree that DOES carry visible layout risk, this
        // exclusion would blind this check to it — worth remembering before
        // reaching for aria-hidden on something wider than "decorative".
        if (el.closest('[aria-hidden="true"]')) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        if (rect.right > vw + 1 || rect.left < -1) {
          const cls = typeof el.className === "string" && el.className
            ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
            : "";
          offenders.push(`${el.tagName.toLowerCase()}${cls} [${Math.round(rect.left)}, ${Math.round(rect.right)}]`);
        }
      }
      return offenders;
    });
    for (const offender of overflowingElements) {
      problems.push(`horizontal overflow: ${route} @ ${width}px — ${offender}`);
    }

    // Trigger every ScrollTrigger reveal (once:true, so this is permanent
    // for the rest of this page's life) before capturing, then return to
    // the top so the fullPage shot still composes naturally.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);

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
