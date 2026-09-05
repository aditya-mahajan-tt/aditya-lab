"use client";

import { useState } from "react";
import { timeline } from "@/data/timeline";
import { LogEntry } from "@/components/log/LogEntry";
import { cn } from "@/lib/utils/cn";
import type { TimelineEntry } from "@/data/schema";

const TYPES: TimelineEntry["type"][] = ["BUILD", "EXPERIMENT", "STRATEGY", "LEARNING", "LAUNCH"];

/**
 * PLAN.md Phase 12 — reverse-chronological (data/timeline.ts is pre-sorted),
 * filterable by type. The filter is a client enhancement over content that's
 * already fully in the initial HTML — "ALL" is the default render, so
 * nothing is lost with JavaScript off.
 */
export function LabLog() {
  const [filter, setFilter] = useState<TimelineEntry["type"] | "ALL">("ALL");
  const visible = filter === "ALL" ? timeline : timeline.filter((e) => e.type === filter);

  return (
    <div>
      <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-2">
        {(["ALL", ...TYPES] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            aria-pressed={filter === type}
            className={cn(
              "min-h-11 rounded-sm border px-3 font-mono text-xs uppercase tracking-widest transition-colors duration-[var(--duration-fast)]",
              filter === type
                ? "border-accent text-accent"
                : "border-border text-text-muted hover:border-border-strong hover:text-text",
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="label mt-10 text-text-faint">No entries for this filter yet.</p>
      ) : (
        <ol className="mt-10 divide-y divide-border border-y border-border">
          {visible.map((entry) => (
            <LogEntry key={`${entry.date}-${entry.body}`} entry={entry} />
          ))}
        </ol>
      )}
    </div>
  );
}
