"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/animations/gsap";
import { prefersReducedMotion } from "@/animations/tokens";

const DEFAULT_STRENGTH = 0.18;
/** Displacement never exceeds this many px, however wide the trigger is —
 * without a cap a full-width card CTA would fly the label a distance that
 * reads as broken tracking rather than a magnetic nudge. */
const MAX_OFFSET = 14;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Magnetic pointer-follow (PLAN.md Phase 6) — desktop `pointer: fine` only,
 * off entirely under reduced motion. `triggerRef` is what listens for the
 * pointer (often a whole card, per DESIGN_SYSTEM.md's "the whole card is
 * one link" rule); `targetRef` is what actually moves. For a plain button
 * they're the same element — just use `triggerRef` for both.
 */
export function useMagnetic<T extends HTMLElement = HTMLElement, U extends HTMLElement = T>(options?: {
  strength?: number;
}) {
  const triggerRef = useRef<T>(null);
  const targetRef = useRef<U>(null);
  const strength = options?.strength ?? DEFAULT_STRENGTH;

  useEffect(() => {
    const trigger = triggerRef.current;
    const target: HTMLElement | null = targetRef.current ?? trigger;
    if (!trigger || !target) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const xTo = gsap.quickTo(target, "x", { duration: 0.3, ease: "power3.out" });
    const yTo = gsap.quickTo(target, "y", { duration: 0.3, ease: "power3.out" });

    function handleMove(e: PointerEvent) {
      const rect = trigger!.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      xTo(clamp(relX * strength, -MAX_OFFSET, MAX_OFFSET));
      yTo(clamp(relY * strength, -MAX_OFFSET, MAX_OFFSET));
    }

    function handleLeave() {
      xTo(0);
      yTo(0);
    }

    trigger.addEventListener("pointermove", handleMove);
    trigger.addEventListener("pointerleave", handleLeave);
    return () => {
      trigger.removeEventListener("pointermove", handleMove);
      trigger.removeEventListener("pointerleave", handleLeave);
      gsap.set(target, { x: 0, y: 0 });
    };
  }, [strength]);

  return { triggerRef, targetRef };
}
