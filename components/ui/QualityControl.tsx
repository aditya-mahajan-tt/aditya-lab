"use client";

import { useEffect, useState } from "react";
import type { QualityPreference } from "@/lib/quality";
import { useLabStore } from "@/lib/store";
import { cn } from "@/lib/utils/cn";

/**
 * The user-facing half of the quality system (PLAN.md Phase 8: "resolves
 * quality to AUTO | HIGH | MEDIUM | LOW. User-overridable, persisted").
 *
 * Native radios rather than buttons with `role="radiogroup"`: arrow-key
 * navigation, roving focus and the focus ring all come free and correct,
 * and this is exactly the control radios were designed for.
 */
const OPTIONS: Array<{ value: QualityPreference; label: string }> = [
  { value: "auto", label: "AUTO" },
  { value: "high", label: "HIGH" },
  { value: "medium", label: "MED" },
  { value: "low", label: "LOW" },
];

export function QualityControl() {
  const quality = useLabStore((s) => s.quality);
  const setQuality = useLabStore((s) => s.setQuality);
  const webglAvailable = useLabStore((s) => s.webglAvailable);

  // The stored preference is rehydrated from localStorage, so the first
  // client render would not match the server's. This control enhances a
  // JS-only feature, so waiting for mount costs nothing.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || webglAvailable === false) return null;

  return (
    <fieldset className="flex items-center gap-3">
      <legend className="sr-only">
        Render quality for the 3D layer. LOW keeps the static core and loads no 3D code.
      </legend>
      <span aria-hidden="true" className="label text-text-faint">
        RENDER
      </span>

      <div className="flex gap-1">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className="relative cursor-pointer"
            data-cursor="interact"
          >
            <input
              type="radio"
              name="render-quality"
              value={option.value}
              checked={quality === option.value}
              onChange={() => setQuality(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "block rounded-sm border px-2 py-1 font-mono text-xs uppercase tracking-widest transition-colors duration-[var(--duration-fast)]",
                "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
                quality === option.value
                  ? "border-accent text-accent"
                  : "border-border text-text-faint hover:border-border-strong hover:text-text-muted",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
