"use client";

import { useEffect, useState } from "react";
import { tourPrompt } from "@/data/tour";
import { analytics } from "@/lib/analytics/events";
import { useLabStore } from "@/lib/store";

/**
 * Hero entry point for the tour. Rendered only after mount: with JavaScript
 * off a tour button would be dead, and nothing here is worth a dead control.
 */
export function TourTrigger() {
  const setTourOpen = useLabStore((s) => s.setTourOpen);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      type="button"
      data-cursor="interact"
      onClick={() => {
        analytics.tourStart("hero");
        setTourOpen(true);
      }}
      className="inline-flex min-h-11 items-center px-2 font-mono text-xs uppercase tracking-widest text-accent transition-colors duration-[var(--duration-fast)] hover:underline"
    >
      {tourPrompt.trigger} →
    </button>
  );
}
