"use client";

import { useEffect, useRef } from "react";
import { gsap, ensureScrollTrigger } from "@/animations/gsap";
import { duration, ease, prefersReducedMotion } from "@/animations/tokens";

type Options = {
  y?: number;
  delay?: number;
};

/**
 * Fades + rises an element in once, as it scrolls into view (PLAN.md
 * Phase 6). Under reduced motion it just appears — no transform, no delay.
 * ScrollTrigger's own resize/orientation-change handling is on by default,
 * so this stays correct across breakpoint changes without extra code.
 */
export function useScrollReveal<T extends HTMLElement>({ y = 24, delay = 0 }: Options = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(el, { opacity: 0, y });

    let tween: gsap.core.Tween | undefined;
    let cancelled = false;

    ensureScrollTrigger().then(() => {
      if (cancelled || !el) return;
      tween = gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: duration.slow,
        ease: ease.out,
        delay,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    });

    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
    };
  }, [y, delay]);

  return ref;
}
