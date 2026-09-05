import type { ComponentType } from "react";
import type { Experiment } from "@/data/schema";

/**
 * PLAN.md Phase 14 — "Interactive, actually-runnable experiments where
 * practical." The registry is the mechanism: each entry is a small
 * client component keyed by experiment slug, rendered inline on the
 * detail page when that experiment is marked `interactive: true`.
 *
 * CLAUDE.md §3 rule 1 — content is the product, effects are the
 * packaging — so this stays an empty, wired-up shell until a real
 * experiment actually has something runnable to show. Do not add a demo
 * here for a slug whose write-up is still a placeholder in
 * data/experiments.ts.
 *
 * To add one: import the demo component and add `"its-slug": ItsDemo` below.
 */
const registry: Record<string, ComponentType> = {};

export function ExperimentDemo({ experiment }: { experiment: Experiment }) {
  if (!experiment.interactive) return null;
  const Demo = registry[experiment.slug];
  if (!Demo) return null;

  return (
    <section aria-labelledby="e-run-it" className="mt-12 rounded-sm border border-border-strong bg-surface p-6">
      <p className="label mb-4" id="e-run-it">
        RUN IT
      </p>
      <Demo />
    </section>
  );
}
