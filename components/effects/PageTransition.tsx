"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { runPageTransition } from "@/animations/transitions";
import { prefersReducedMotion } from "@/animations/tokens";

/**
 * Wraps <main>'s children. Fades in on client-side route changes (skipped
 * on first load), and announces the new page to screen readers via a
 * visually-hidden aria-live region — QA_AND_PERFORMANCE.md §5's "route
 * changes announced". A full page load re-announces itself automatically;
 * client-side navigation in an SPA doesn't, so this replaces that.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const el = ref.current;
    let tween: ReturnType<typeof runPageTransition> | undefined;
    if (el && !prefersReducedMotion()) {
      tween = runPageTransition(el);
    }

    // A tick so Next has committed the new route's <title> before we read it.
    const announceTimer = window.setTimeout(() => setAnnouncement(document.title), 100);

    return () => {
      tween?.kill();
      window.clearTimeout(announceTimer);
    };
  }, [pathname]);

  return (
    <div ref={ref}>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
      {children}
    </div>
  );
}
