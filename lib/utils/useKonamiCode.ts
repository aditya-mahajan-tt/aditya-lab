"use client";

import { useEffect, useRef } from "react";

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

/**
 * PLAN.md Phase 15 — the classic ↑↑↓↓←→←→BA. Ignored while typing in any
 * field (command palette search, contact form) so it can never fire on
 * accidental key overlap, and never calls preventDefault — it must not
 * interfere with normal arrow-key or keyboard navigation anywhere on site.
 */
export function useKonamiCode(onComplete: () => void) {
  const progress = useRef(0);
  const callback = useRef(onComplete);
  callback.current = onComplete;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;

      const expected = SEQUENCE[progress.current];
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (key === expected) {
        progress.current += 1;
        if (progress.current === SEQUENCE.length) {
          progress.current = 0;
          callback.current();
        }
      } else {
        progress.current = key === SEQUENCE[0] ? 1 : 0;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
