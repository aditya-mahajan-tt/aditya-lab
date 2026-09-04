"use client";

import Link from "next/link";
import type { Project } from "@/data/schema";
import { Fill } from "@/components/ui/Placeholder";
import { useMagnetic } from "@/lib/utils/useMagnetic";

/** The row-list project card CTA — one of the four magnetic elements sitewide (PLAN.md Phase 6). */
export function ProjectArchiveRow({ project }: { project: Project }) {
  const { triggerRef, targetRef } = useMagnetic<HTMLAnchorElement, HTMLSpanElement>();

  return (
    <Link
      ref={triggerRef}
      href={`/work/${project.slug}`}
      data-cursor="view"
      className="group flex flex-col gap-4 py-8 transition-colors hover:bg-surface md:flex-row md:items-baseline md:gap-10"
    >
      <span className="label md:w-28 md:shrink-0">PROJECT_{project.id}</span>

      <div className="flex-1">
        <h2 className="text-[length:var(--text-xl)]">
          <Fill value={project.title} />
          {project.subtitle && <span className="text-text-muted"> — {project.subtitle}</span>}
        </h2>
        <p className="prose-lab mt-2 text-sm text-text-muted">
          <Fill value={project.summary} />
        </p>
        <p className="label mt-3">{project.category.join(" / ")}</p>
      </div>

      <div className="flex items-center gap-6 md:flex-col md:items-end md:gap-2">
        <span className="label">{project.status}</span>
        <span ref={targetRef} className="font-mono text-xs uppercase tracking-widest text-accent">
          Explore →
        </span>
      </div>
    </Link>
  );
}
