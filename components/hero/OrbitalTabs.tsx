"use client";

import type { PlaneValue } from "@/data/schema";
import { HERO_PLANES } from "@/data/queries";

const PLANE_LABEL: Record<PlaneValue, string> = { ai: "AI", product: "PRODUCT", business: "BUSINESS" };

/**
 * Mobile-only plane switcher (spec §3.5). Desktop shows every plane at
 * once via components/hero/CoreFallback's own labeled arcs, so this is
 * `md:hidden`. Horizontal scroll-snap makes the row swipeable without a
 * custom gesture implementation — `snap-x` plus `scroll-smooth` is a real
 * touch-drag interaction on every mobile browser.
 */
export function OrbitalTabs({ active, onChange }: { active: PlaneValue; onChange: (plane: PlaneValue) => void }) {
  return (
    <div role="tablist" aria-label="Filter by discipline" className="mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto md:hidden">
      {HERO_PLANES.map((plane) => (
        <button
          key={plane}
          type="button"
          role="tab"
          aria-selected={active === plane}
          onClick={() => onChange(plane)}
          data-cursor="interact"
          className="flex min-h-11 shrink-0 snap-start items-center rounded-sm border border-border px-4 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors duration-[var(--duration-fast)] aria-selected:border-accent aria-selected:text-accent"
        >
          {PLANE_LABEL[plane]}
        </button>
      ))}
    </div>
  );
}
