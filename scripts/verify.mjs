#!/usr/bin/env node
/**
 * The gate. Nothing is "done" until this is green — see CLAUDE.md §5.
 *
 *   npm run verify            full run
 *   npm run verify -- --fast  skip the e2e suite (use only mid-iteration)
 */
import { spawnSync } from "node:child_process";

const fast = process.argv.includes("--fast");

const steps = [
  { name: "typecheck", cmd: "npm", args: ["run", "--silent", "typecheck"] },
  { name: "lint", cmd: "npm", args: ["run", "--silent", "lint"] },
  { name: "placeholders", cmd: "node", args: ["scripts/check-placeholders.mjs"] },
  { name: "build", cmd: "npm", args: ["run", "--silent", "build"] },
  { name: "bundle", cmd: "node", args: ["scripts/check-bundle.mjs"] },
  ...(fast ? [] : [{ name: "e2e", cmd: "npx", args: ["playwright", "test"] }]),
];

const results = [];

for (const step of steps) {
  console.log(`\n[1m── ${step.name} ─────────────────────────────[0m`);
  const start = Date.now();
  const run = spawnSync(step.cmd, step.args, { stdio: "inherit", shell: process.platform === "win32" });
  const ok = run.status === 0;
  results.push({ name: step.name, ok, ms: Date.now() - start });

  if (!ok) {
    console.error(`\n[31m✖ ${step.name} failed. Stopping.[0m`);
    summary(results);
    process.exit(1);
  }
}

summary(results);
console.log("\n[32m✔ verify passed.[0m Now run `npm run shot` and LOOK at the screenshots.\n");

function summary(rs) {
  console.log("\n[1mSUMMARY[0m");
  for (const r of rs) {
    console.log(`  ${r.ok ? "[32m✔" : "[31m✖"} ${r.name.padEnd(14)}[0m ${(r.ms / 1000).toFixed(1)}s`);
  }
}
