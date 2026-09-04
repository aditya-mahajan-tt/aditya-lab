"use client";

import { useEffect, useRef, useState } from "react";

/** Scroll distance before the header is ever allowed to hide. */
const REVEAL_THRESHOLD = 80;
/** Ignore sub-pixel/trackpad jitter below this delta. */
const DIRECTION_THRESHOLD = 4;

/** True while the header should be hidden — scrolling down, past the threshold. */
export function useHideOnScroll(disabled = false): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;

        if (y < REVEAL_THRESHOLD) {
          setHidden(false);
        } else if (delta > DIRECTION_THRESHOLD) {
          setHidden(true);
        } else if (delta < -DIRECTION_THRESHOLD) {
          setHidden(false);
        }

        lastY.current = y;
        ticking.current = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return !disabled && hidden;
}
