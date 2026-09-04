"use client";

import { useEffect, useRef } from "react";
import { gsap, ensureScrollTrigger } from "@/animations/gsap";
import { duration, ease, stagger, prefersReducedMotion, MAX_STAGGER_ITEMS } from "@/animations/tokens";

type Props = {
  children: string;
  className?: string;
  type?: "words" | "chars";
};

/**
 * Splits text into words or characters and staggers them in on scroll —
 * used sparingly, for a handful of headline-weight moments (PLAN.md Phase
 * 6). Uses GSAP's own SplitText with `accessible: true`, which keeps the
 * original text as the screen-reader-visible node and only visually splits
 * a duplicate — so this never breaks the accessible name of its heading.
 * SplitText itself is dynamically imported (not in animations/gsap.ts)
 * since it's used in only a handful of spots — see that file's comment.
 */
export function SplitTextReveal({ children, className, type = "words" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let split: import("gsap/SplitText").SplitText | undefined;
    let tween: gsap.core.Tween | undefined;
    let cancelled = false;

    Promise.all([ensureScrollTrigger(), import("gsap/SplitText")]).then(([, { SplitText }]) => {
      if (cancelled || !el) return;
      gsap.registerPlugin(SplitText);

      split = new SplitText(el, { type, accessible: true });
      const targets = type === "chars" ? split.chars : split.words;

      if (process.env.NODE_ENV !== "production" && targets.length > MAX_STAGGER_ITEMS) {
        console.warn(
          `SplitTextReveal: ${targets.length} ${type} exceeds the ${MAX_STAGGER_ITEMS}-item stagger guidance in DESIGN_SYSTEM.md §5 — this will read as slow, not choreographed. Use a shorter string or type="words".`,
        );
      }

      gsap.set(targets, { opacity: 0, y: 12 });
      tween = gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: duration.medium,
        ease: ease.out,
        stagger: stagger.tight,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    });

    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
      split?.revert();
    };
  }, [children, type]);

  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
}
