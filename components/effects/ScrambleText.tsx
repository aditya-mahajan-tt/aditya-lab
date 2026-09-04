"use client";

import { useEffect, useRef } from "react";
import { gsap, ensureScrollTrigger } from "@/animations/gsap";
import { prefersReducedMotion } from "@/animations/tokens";

/**
 * Scrambles into its final text once, on scroll — chrome only (mono
 * labels, system readouts), never body copy. See DESIGN_SYSTEM.md §5 and
 * PLAN.md Phase 6: "ScrambleText sparingly, chrome only." ScrambleTextPlugin
 * is dynamically imported (not in animations/gsap.ts) since this is used
 * in very few spots — see that file's comment.
 */
export function ScrambleText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let tween: gsap.core.Tween | undefined;
    let cancelled = false;

    Promise.all([ensureScrollTrigger(), import("gsap/ScrambleTextPlugin")]).then(([, { ScrambleTextPlugin }]) => {
      if (cancelled || !el) return;
      gsap.registerPlugin(ScrambleTextPlugin);

      tween = gsap.to(el, {
        duration: 0.8,
        scrambleText: { text, chars: "upperCase", speed: 0.4 },
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });

    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
    };
  }, [text]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
