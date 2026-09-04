"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { gsap, ensureScrollTrigger } from "@/animations/gsap";
import { duration, ease, prefersReducedMotion } from "@/animations/tokens";

/** Content slides up from behind a clipping mask as it scrolls into view. See PLAN.md Phase 6. */
export function MaskReveal({ children, className }: { children: ReactNode; className?: string }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    if (prefersReducedMotion()) {
      gsap.set(inner, { y: "0%" });
      return;
    }

    gsap.set(inner, { y: "100%" });

    let tween: gsap.core.Tween | undefined;
    let cancelled = false;

    ensureScrollTrigger().then(() => {
      if (cancelled || !outer || !inner) return;
      tween = gsap.to(inner, {
        y: "0%",
        duration: duration.slow,
        ease: ease.out,
        scrollTrigger: { trigger: outer, start: "top 85%", once: true },
      });
    });

    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
    };
  }, []);

  return (
    <div ref={outerRef} className={className} style={{ overflow: "hidden" }}>
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
