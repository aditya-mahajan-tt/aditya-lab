"use client";

import { gsap } from "gsap";

/**
 * GSAP core only, eagerly (PLAN.md Phase 6). ScrollTrigger, SplitText and
 * ScrambleTextPlugin are all dynamically imported by whichever effect
 * actually needs them, to keep the homepage's initial JS inside the
 * budget in QA_AND_PERFORMANCE.md §1 (<160 KB gzip target). ScrollTrigger
 * specifically is used by nearly every page (via RevealText), so
 * `ensureScrollTrigger` dedupes it through one shared promise rather than
 * every caller importing and registering it separately.
 */
let scrollTriggerReady: Promise<void> | null = null;
export function ensureScrollTrigger(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!scrollTriggerReady) {
    scrollTriggerReady = import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      gsap.registerPlugin(ScrollTrigger);
    });
  }
  return scrollTriggerReady;
}

export { gsap };
