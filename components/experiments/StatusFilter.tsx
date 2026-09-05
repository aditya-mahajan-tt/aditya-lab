"use client";

import { useMemo, useState } from "react";
import type { Experiment } from "@/data/schema";
import { cn } from "@/lib/utils/cn";
import { useScrollReveal } from "@/lib/utils/useScrollReveal";
import { Fill } from "@/components/ui/Placeholder";
import { StatusChip } from "@/components/experiments/StatusChip";
import { TrackedLink } from "@/components/analytics/TrackedLink";

const ALL = "ALL";

/**
 * PLAN.md Phase 14 — filter the experiment table by status. Mirrors
 * ProjectArchive.tsx's category filter exactly: unfiltered list is
 * server-rendered so it works with JS disabled (e2e/smoke.spec.ts), the
 * filter is a progressive enhancement on top.
 */
export function StatusFilter({ experiments }: { experiments: Experiment[] }) {
  const statuses = useMemo(
    () => [...new Set(experiments.map((e) => e.status))],
    [experiments],
  );
  const [active, setActive] = useState<string>(ALL);
  const gridRef = useScrollReveal<HTMLUListElement>();

  const filtered = active === ALL ? experiments : experiments.filter((e) => e.status === active);

  return (
    <>
      <div role="group" aria-label="Filter by status" className="mt-10 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActive(ALL)}
          aria-pressed={active === ALL}
          className={cn(
            "min-h-11 rounded-sm border px-3 font-mono text-xs uppercase tracking-widest transition-colors duration-[var(--duration-fast)]",
            active === ALL
              ? "border-accent text-accent"
              : "border-border text-text-muted hover:border-border-strong hover:text-text",
          )}
        >
          ALL
        </button>
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setActive(status)}
            aria-pressed={active === status}
            className={cn(
              "min-h-11 rounded-sm border px-3 font-mono text-xs uppercase tracking-widest transition-colors duration-[var(--duration-fast)]",
              active === status
                ? "border-accent text-accent"
                : "border-border text-text-muted hover:border-border-strong hover:text-text",
            )}
          >
            {status}
          </button>
        ))}
      </div>

      <p className="label mt-6" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "EXPERIMENT" : "EXPERIMENTS"}
      </p>

      <ul ref={gridRef} className="mt-6 grid gap-px border border-border bg-border md:grid-cols-2">
        {filtered.map((experiment) => (
          <li key={experiment.slug} className="bg-surface">
            <TrackedLink
              href={`/experiments/${experiment.slug}`}
              data-cursor="view"
              event="experiment_open"
              eventProps={{ slug: experiment.slug }}
              className="flex h-full flex-col gap-6 p-6 transition-colors hover:bg-surface-raised"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="label">EXPERIMENT_{experiment.id}</span>
                <StatusChip status={experiment.status} />
              </div>
              <div>
                <h2 className="text-[length:var(--text-xl)]">
                  <Fill value={experiment.title} />
                </h2>
                <p className="mt-3 text-sm text-text-muted">
                  <Fill value={experiment.summary} />
                </p>
              </div>
            </TrackedLink>
          </li>
        ))}
      </ul>
    </>
  );
}
