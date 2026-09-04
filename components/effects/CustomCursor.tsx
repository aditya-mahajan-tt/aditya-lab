"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/animations/gsap";
import { prefersReducedMotion } from "@/animations/tokens";
import { useLabStore } from "@/lib/store";
import { cn } from "@/lib/utils/cn";

type CursorState = "default" | "view" | "open" | "interact" | "drag";

const LABELS: Record<Exclude<CursorState, "default">, string> = {
  view: "VIEW",
  open: "OPEN",
  interact: "INTERACT",
  drag: "DRAG",
};

/**
 * DESIGN_SYSTEM.md §8. Fine-pointer desktop only (`@media (pointer: fine)`);
 * off entirely under reduced motion, on touch, and whenever the menu
 * overlay or command palette is open. Hover targets opt in with
 * `data-cursor="view|open|interact|drag"`. Never touches focus-visible —
 * that's a separate CSS property from `cursor` entirely. The native
 * cursor is hidden (globals.css `.custom-cursor-active`) only after this
 * has actually positioned itself at least once, never preemptively.
 */
export function CustomCursor() {
  const menuOpen = useLabStore((s) => s.menuOpen);
  const commandPaletteOpen = useLabStore((s) => s.commandPaletteOpen);
  const aiOpen = useLabStore((s) => s.aiOpen);
  // Ask the Lab is also a native <dialog>/showModal() — same top-layer
  // reasoning as the command palette (see CommandPalette.tsx's comment):
  // this fixed-position cursor can never paint above it, so it must bail
  // out entirely and let the real OS cursor back in, or the visitor gets
  // no visible pointer at all inside the dialog.
  const overlayOpen = menuOpen || commandPaletteOpen || aiOpen;

  const [eligible, setEligible] = useState(false);
  const [state, setState] = useState<CursorState>("default");
  const dotRef = useRef<HTMLDivElement>(null);
  const activatedRef = useRef(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    setEligible(fine && !prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (!eligible || overlayOpen) {
      document.documentElement.classList.remove("custom-cursor-active");
      activatedRef.current = false;
      return;
    }

    const dot = dotRef.current;
    if (!dot) return;

    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(dot, "x", { duration: 0.15, ease: "power3.out" });
    const yTo = gsap.quickTo(dot, "y", { duration: 0.15, ease: "power3.out" });

    function handleMove(e: PointerEvent) {
      xTo(e.clientX);
      yTo(e.clientY);
      if (!activatedRef.current) {
        activatedRef.current = true;
        document.documentElement.classList.add("custom-cursor-active");
      }
    }

    function handleOver(e: PointerEvent) {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]");
      const next = target?.dataset.cursor as CursorState | undefined;
      setState(next && next in LABELS ? next : "default");
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerover", handleOver);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerover", handleOver);
      document.documentElement.classList.remove("custom-cursor-active");
      activatedRef.current = false;
    };
  }, [eligible, overlayOpen]);

  if (!eligible || overlayOpen) return null;

  return (
    <div ref={dotRef} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[var(--z-cursor)]">
      <div
        className={cn(
          "flex items-center justify-center rounded-full border border-accent transition-[width,height,padding,background-color] duration-[var(--duration-fast)]",
          state === "default" ? "h-2 w-2" : "h-11 gap-1 bg-bg px-4",
        )}
      >
        {state !== "default" && (
          <span className="font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-accent">
            {LABELS[state]}
          </span>
        )}
      </div>
    </div>
  );
}
