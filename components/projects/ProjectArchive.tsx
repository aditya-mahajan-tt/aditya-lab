"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/data/schema";
import { cn } from "@/lib/utils/cn";
import { useScrollReveal } from "@/lib/utils/useScrollReveal";
import { ProjectArchiveRow } from "@/components/projects/ProjectArchiveRow";

const ALL = "ALL";

/** PLAN.md Phase 4 — the project archive with category filtering. */
export function ProjectArchive({ projects }: { projects: Project[] }) {
  const categories = useMemo(
    () => [...new Set(projects.flatMap((p) => p.category))].sort(),
    [projects],
  );
  const [active, setActive] = useState<string>(ALL);
  const listRef = useScrollReveal<HTMLUListElement>();

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

      <ul ref={listRef} className="mt-6 divide-y divide-border border-y border-border">
        {filtered.map((project) => (
          <li key={project.slug}>
            <ProjectArchiveRow project={project} />
          </li>
        ))}
      </ul>
    </>
  );
}
