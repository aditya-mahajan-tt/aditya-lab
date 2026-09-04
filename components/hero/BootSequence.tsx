"use client";

import { useEffect, useRef, useState } from "react";
import { useLabStore } from "@/lib/store";

const BOOT_DURATION_MS = 800;
const SESSION_KEY = "aditya-lab:booted";

/**
 * PLAN.md Phase 5. An overlay, never a gate: the hero underneath is already
 * in the DOM and fully readable the entire time this is showing — a crawler
 * or screen reader sees the real content immediately, and any key, click,
 * scroll or touch dismisses it early. Runs once per browser session, and
 * never at all under prefers-reduced-motion.
 */
export function BootSequence() {
  const setBootComplete = useLabStore((s) => s.setBootComplete);
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadyBooted = sessionStorage.getItem(SESSION_KEY) === "1";

    if (reduced || alreadyBooted) {
      setBootComplete(true);
      return;
    }

    setVisible(true);

    function dismiss() {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      window.clearTimeout(timer);
      sessionStorage.setItem(SESSION_KEY, "1");
      setVisible(false);
      setBootComplete(true);
    }

    const timer = window.setTimeout(dismiss, BOOT_DURATION_MS);

    window.addEventListener("keydown", dismiss);
    window.addEventListener("pointerdown", dismiss);
    window.addEventListener("wheel", dismiss, { passive: true });
    window.addEventListener("touchstart", dismiss, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("wheel", dismiss);
      window.removeEventListener("touchstart", dismiss);
    };
  }, [setBootComplete]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[var(--z-boot)] flex items-center justify-center bg-bg"
    >
      <p className="font-mono text-xs uppercase tracking-[var(--tracking-mono)] text-text-faint">
        <span className="text-accent">SYSTEM</span> · INITIALIZING LAB…
      </p>
    </div>
  );
}
