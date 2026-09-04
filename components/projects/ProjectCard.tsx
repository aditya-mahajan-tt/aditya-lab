"use client";

import Link from "next/link";
import type { Project } from "@/data/schema";
import { Fill } from "@/components/ui/Placeholder";
import { useMagnetic } from "@/lib/utils/useMagnetic";

/**
 * The project card CTA is one of the four magnetic elements sitewide
 * (PLAN.md Phase 6). The whole card stays a single link (DESIGN_SYSTEM.md
 * §8 — no nested interactive elements); only the "Explore →" affordance
 * moves, tracking pointer position over the card as a whole.
 */
export function ProjectCard({ project }: { project: Project }) {
  const { triggerRef, targetRef } = useMagnetic<HTMLAnchorElement, HTMLSpanElement>();

  return (
    <Link
      ref={triggerRef}
      href={`/work/${project.slug}`}
      data-cursor="view"
      className="group flex h-full flex-col justify-between gap-8 p-6 transition-colors hover:bg-surface-raised"
    >
      <div>
        <p className="label">PROJECT_{project.id}</p>
        <h3 className="mt-3 text-[length:var(--text-xl)]">
          <Fill value={project.title} />
        </h3>
        {project.subtitle && <p className="mt-1 text-sm text-text-muted">{project.subtitle}</p>}
        <p className="mt-4 text-sm text-text-muted">
          <Fill value={project.summary} />
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="label">{project.status}</span>
        <span ref={targetRef} className="font-mono text-xs uppercase tracking-widest text-accent">
          Explore →
        </span>
      </div>
    </Link>
  );
}
