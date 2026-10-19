"use client";

import Link from "next/link";
import type { ArchiveItem } from "@/components/projects/archiveItem";
import { Fill } from "@/components/ui/Placeholder";
import { useMagnetic } from "@/lib/utils/useMagnetic";
import { analytics } from "@/lib/analytics/events";

/** The row-list project card CTA — one of the four magnetic elements sitewide (PLAN.md Phase 6). */
export function ProjectArchiveRow({ item }: { item: ArchiveItem }) {
  const { triggerRef, targetRef } = useMagnetic<HTMLAnchorElement, HTMLSpanElement>();

  return (
    <Link
      ref={triggerRef}
      href={item.href}
      data-cursor="view"
      onClick={() => analytics.projectOpen(item.slug)}
      className="group flex flex-col gap-4 py-8 transition-colors hover:bg-surface md:flex-row md:items-baseline md:gap-10"
    >
      <span className="label md:w-28 md:shrink-0">{item.label}</span>

      <div className="flex-1">
        <h3 className="text-[length:var(--text-xl)]">
          <Fill value={item.title} />
          {item.subtitle && <span className="text-text-muted"> — {item.subtitle}</span>}
        </h3>
        <p className="prose-lab mt-2 text-sm text-text-muted">
          <Fill value={item.summary} />
        </p>
        <p className="label mt-3">{item.category.join(" / ")}</p>
      </div>

      <div className="flex items-center gap-6 md:flex-col md:items-end md:gap-2">
        <span className="label">{item.status}</span>
        <span ref={targetRef} className="font-mono text-xs uppercase tracking-widest text-accent">
          Explore →
        </span>
      </div>
    </Link>
  );
}
