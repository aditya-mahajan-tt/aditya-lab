"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Progress (0-1) driven by the wheel, captured only while the pointer is
 * over `containerRef` — the Lab environment's own dedicated scroll, decoupled
 * from the page's scroll entirely (PLAN.md Phase 13 follow-up: the orbit
 * used to ride the page's own scroll via a tall sticky wrapper, which
 * Aditya asked to split apart).
 *
 * `{ passive: false }` plus `preventDefault()` is what keeps this from also
 * scrolling the page underneath — a deliberate, narrow capture over one
 * small widget, not the whole-page scroll hijacking CLAUDE.md §9 bans: the
 * page scrolls completely normally the instant the pointer leaves the
 * stage, and nothing here ever calls `preventDefault()` outside that hover.
 *
 * Written to a ref, not state, for the same reason as three/systems/
 * CameraController's scroll listener — read inside `useFrame`, a state
 * update would mean a React render on every wheel tick.
 */
const SENSITIVITY = 0.0014;

/**
 * `enabled` matters beyond "don't bother listening": the container this
 * attaches to (the canvas stage) only exists in the DOM once the 3D layer is
 * ready to mount, so the attach effect has to re-run when `enabled` flips
 * from false to true — a `[containerRef]`-only dependency would have run
 * once at first mount, found `containerRef.current` null, and never
 * attached at all once the element actually appeared.
 */
export function useWheelOrbitProgress(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  onManualInput: () => void,
): RefObject<number> {
  const progress = useRef(0);
  const callback = useRef(onManualInput);

  useEffect(() => {
    callback.current = onManualInput;
  }, [onManualInput]);

  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const next = progress.current + event.deltaY * SENSITIVITY;
      progress.current = Math.min(1, Math.max(0, next));
      callback.current();
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [containerRef, enabled]);

  return progress;
}
