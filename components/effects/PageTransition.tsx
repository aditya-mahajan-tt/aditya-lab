"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { runPageTransition } from "@/animations/transitions";
import { prefersReducedMotion } from "@/animations/tokens";

/** Wraps <main>'s children. Fades in on client-side route changes; skipped on first load. */
export function PageTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const tween = runPageTransition(el);
    return () => {
      tween.kill();
    };
  }, [pathname]);

  return <div ref={ref}>{children}</div>;
}
