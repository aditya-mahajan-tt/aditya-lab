#!/usr/bin/env node
/**
 * Enforces the budgets in QA_AND_PERFORMANCE.md §1, and two hard invariants:
 *   1. Three.js never appears in the homepage's initial bundle.
 *   2. No API-key-shaped string appears in any client bundle.
 *
 * "Initial JS" = the exact set of chunks the homepage loads on first paint,
 * read from .next/app-build-manifest.json (this is what Next reports as
 * "First Load JS"), measured gzipped.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = resolve(import.meta.dirname, "..");
const NEXT = join(ROOT, ".next");
const MANIFEST = join(NEXT, "app-build-manifest.json");

const BUDGET_WARN_KB = 160;
const BUDGET_FAIL_KB = 200;

const SECRET_PATTERN =
  /\b(sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}|xox[baprs]-[A-Za-z0-9-]{10,})\b/;

if (!existsSync(MANIFEST)) {
  console.error("✖ .next/app-build-manifest.json not found — run `next build` first.");
  process.exit(1);
}

let failed = false;

/* --- the homepage's initial chunk set ------------------------------------ */
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const initial = [...new Set(manifest.pages?.["/page"] ?? [])].filter((f) => f.endsWith(".js"));

if (initial.length === 0) {
  console.error("✖ Could not resolve the homepage chunk set from the build manifest.");
  process.exit(1);
}

/* --- 1. secret scan across every client bundle --------------------------- */
const allJs = [];
const walk = (dir) => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith(".js")) allJs.push(full);
  }
};
walk(join(NEXT, "static"));

for (const file of allJs) {
  const hit = readFileSync(file, "utf8").match(SECRET_PATTERN);
  if (hit) {
    console.error(`✖ Possible secret in client bundle: ${file.replace(ROOT, ".")}`);
    failed = true;
  }
}
if (!failed) console.log(`✔ secret scan — ${allJs.length} client bundles clean`);

/* --- 2. three.js isolation ----------------------------------------------- */
let threeInInitial = false;
for (const rel of initial) {
  const full = join(NEXT, rel);
  if (!existsSync(full)) continue;
  if (/WebGLRenderer|THREE\.REVISION/.test(readFileSync(full, "utf8"))) {
    console.error(`✖ Three.js found in an initial chunk: ${rel}`);
    threeInInitial = true;
    failed = true;
  }
}
if (!threeInInitial) console.log("✔ 3D isolation — Three.js is not in the homepage's initial bundle");

/* --- 3. initial JS budget ------------------------------------------------ */
const bytes = initial.reduce((sum, rel) => {
  const full = join(NEXT, rel);
  return existsSync(full) ? sum + gzipSync(readFileSync(full)).length : sum;
}, 0);
const kb = Math.round(bytes / 1024);

if (kb > BUDGET_FAIL_KB) {
  console.error(`✖ Initial JS ${kb} KB gzip exceeds the ${BUDGET_FAIL_KB} KB hard budget.`);
  failed = true;
} else if (kb > BUDGET_WARN_KB) {
  console.warn(`⚠ Initial JS ${kb} KB gzip is over the ${BUDGET_WARN_KB} KB target (hard limit ${BUDGET_FAIL_KB} KB).`);
} else {
  console.log(`✔ initial JS — ${kb} KB gzip across ${initial.length} chunks (target ${BUDGET_WARN_KB} KB)`);
}

process.exit(failed ? 1 : 0);
