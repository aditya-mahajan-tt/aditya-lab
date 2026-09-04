"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Project } from "@/data/schema";
import { Fill } from "@/components/ui/Placeholder";
import { cn } from "@/lib/utils/cn";

const ALL = "ALL";

/** PLAN.md Phase 4 — the project archive with category filtering, no motion yet. */
export function ProjectArchive({ projects }: { projects: Project[] }) {
  const categories = useMemo(
    () => [...new Set(projects.flatMap((p) => p.category))].sort(),
    [projects],
  );
  const [active, setActive] = useState<string>(ALL);

  const filtered = active === ALL ? projects : projects.filter((p) => p.category.includes(active));

  return (
    <>
      <div role="group" aria-label="Filter by category" className="mt-10 flex flex-wrap gap-2">
        {[ALL, ...categories].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActive(category)}
            aria-pressed={active === category}
            className={cn(
              "min-h-11 rounded-sm border px-3 font-mono text-xs uppercase tracking-widest transition-colors duration-[var(--duration-fast)]",
              active === category
                ? "border-accent text-accent"
                : "border-border text-text-muted hover:border-border-strong hover:text-text",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <p className="label mt-6" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "PROJECT" : "PROJECTS"}
      </p>

      <ul className="mt-6 divide-y divide-border border-y border-border">
        {filtered.map((project) => (
          <li key={project.slug}>
            <Link
              href={`/work/${project.slug}`}
              className="group flex flex-col gap-4 py-8 transition-colors hover:bg-surface md:flex-row md:items-baseline md:gap-10"
            >
              <span className="label md:w-28 md:shrink-0">PROJECT_{project.id}</span>

              <div className="flex-1">
                <h2 className="text-[length:var(--text-xl)]">
                  <Fill value={project.title} />
                  {project.subtitle && (
                    <span className="text-text-muted"> — {project.subtitle}</span>
                  )}
                </h2>
                <p className="prose-lab mt-2 text-sm text-text-muted">
                  <Fill value={project.summary} />
                </p>
                <p className="label mt-3">{project.category.join(" / ")}</p>
              </div>

              <div className="flex items-center gap-6 md:flex-col md:items-end md:gap-2">
                <span className="label">{project.status}</span>
                <span className="font-mono text-xs uppercase tracking-widest text-accent">
                  Explore →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
