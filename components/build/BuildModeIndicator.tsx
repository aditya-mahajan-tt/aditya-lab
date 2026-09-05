"use client";

import { useEffect } from "react";
import { useLabStore } from "@/lib/store";

/**
 * PLAN.md Phase 12 — "Build Mode" is a real global flag (lib/store.ts,
 * scaffolded since Phase 3), not just a page title. Visiting /build
 * activates it; leaving resets it. Purely a status readout — no content
 * on this page is gated behind it, so the page is identical with JS off.
 */
export function BuildModeIndicator() {
  const buildMode = useLabStore((s) => s.buildMode);
  const toggleBuildMode = useLabStore((s) => s.toggleBuildMode);

  useEffect(() => {
    toggleBuildMode();
    return () => toggleBuildMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <p className="label inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={buildMode ? "h-1.5 w-1.5 rounded-full bg-accent" : "h-1.5 w-1.5 rounded-full bg-text-faint"}
      />
      SYSTEM · BUILD MODE · {buildMode ? "ACTIVE" : "OFFLINE"}
    </p>
  );
}
