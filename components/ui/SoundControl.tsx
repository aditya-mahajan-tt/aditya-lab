"use client";

import { useEffect, useState } from "react";
import { useLabStore } from "@/lib/store";
import { playTone } from "@/lib/sound";
import { cn } from "@/lib/utils/cn";

/**
 * PLAN.md Phase 15 — the visible control for `soundEnabled` (default off,
 * persisted). Mirrors QualityControl.tsx's native-input pattern so the
 * mount-guard and focus styling stay identical across both site-wide toggles.
 */
export function SoundControl() {
  const soundEnabled = useLabStore((s) => s.soundEnabled);
  const setSoundEnabled = useLabStore((s) => s.setSoundEnabled);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <label className="flex cursor-pointer items-center gap-2" data-cursor="interact">
      <input
        type="checkbox"
        checked={soundEnabled}
        onChange={(e) => {
          const next = e.target.checked;
          setSoundEnabled(next);
          if (next) playTone("blip");
        }}
        className="peer sr-only"
      />
      <span aria-hidden="true" className="label text-text-faint">
        SOUND
      </span>
      <span
        className={cn(
          "block rounded-sm border px-2 py-1 font-mono text-xs uppercase tracking-widest transition-colors duration-[var(--duration-fast)]",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
          soundEnabled
            ? "border-accent text-accent"
            : "border-border text-text-faint hover:border-border-strong hover:text-text-muted",
        )}
      >
        {soundEnabled ? "ON" : "OFF"}
      </span>
    </label>
  );
}
