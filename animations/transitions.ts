"use client";

import { gsap } from "@/animations/gsap";
import { duration, ease } from "@/animations/tokens";

/**
 * Fast, non-blocking page-transition entrance (PLAN.md Phase 6: "≤400ms,
 * never delaying the first paint of the destination"). The destination's
 * content is already painted by the time this runs — it's a fade-in on
 * top of that, not a gate in front of it. No exit animation: coordinating
 * an unmount delay across App Router navigations needs either the
 * experimental View Transitions API or Framer Motion's AnimatePresence,
 * both out of scope (ARCHITECTURE.md excludes a second animation library),
 * and Next already swaps content quickly on its own.
 */
export function runPageTransition(el: HTMLElement) {
  return gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: duration.fast, ease: ease.out });
}
