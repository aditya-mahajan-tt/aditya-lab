"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Progress (0-1) through a tall wrapper's own scrollable range, written to a
 * ref rather than state — read inside an R3F `useFrame` the way
 * three/systems/CameraController reads window.scrollY, so a scroll event
 * never triggers a React render.
 *
 * This is what drives a "scrollytelling" sticky section (three/systems/
 * OrbitalCameraController): the wrapper is taller than one viewport, an
 * inner child is `position: sticky`, and progress is how far the wrapper has
 * scrolled through its own excess height. Plain CSS position, native scroll,
 * no wheel capture — not the scroll hijacking CLAUDE.md §9 bans.
 */
export function useSectionScrollProgress(sectionRef: RefObject<HTMLElement | null>): RefObject<number> {
  const progress = useRef(0);

  useEffect(() => {
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const raw = total > 0 ? -rect.top / total : 0;
      progress.current = Math.min(1, Math.max(0, raw));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sectionRef]);

  return progress;
}
