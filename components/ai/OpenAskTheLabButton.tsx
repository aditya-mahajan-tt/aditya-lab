"use client";

import { useLabStore } from "@/lib/store";
import { analytics } from "@/lib/analytics/events";

/** The "persistent contact-adjacent entry point" from AI_SPEC.md §6. */
export function OpenAskTheLabButton() {
  const setOpen = useLabStore((s) => s.setAiOpen);

  return (
    <button
      type="button"
      onClick={() => {
        setOpen(true);
        analytics.askLabOpen("contact");
      }}
      data-cursor="interact"
      className="mt-4 flex min-h-11 items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent transition-colors duration-[var(--duration-fast)] hover:text-accent-dim"
    >
      Open the full conversation →
    </button>
  );
}
