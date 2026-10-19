"use client";

import { useMemo, useState } from "react";
import type { ArchiveItem } from "@/components/projects/archiveItem";
import { cn } from "@/lib/utils/cn";
import { useScrollReveal } from "@/lib/utils/useScrollReveal";
import { ProjectArchiveRow } from "@/components/projects/ProjectArchiveRow";

const ALL = "ALL";

const GROUPS: Array<{ kind: ArchiveItem["kind"]; heading: string }> = [
  { kind: "built", heading: "BUILT & SHIPPED" },
  { kind: "case-study", heading: "CASE STUDIES" },
];

/** PLAN.md Phase 4 — the project archive with category filtering, grouped by kind. */
export function ProjectArchive({ items }: { items: ArchiveItem[] }) {
  const categories = useMemo(
    () => [...new Set(items.flatMap((p) => p.category))].sort(),
    [items],
  );
  const [active, setActive] = useState<string>(ALL);
  const listRef = useScrollReveal<HTMLDivElement>();

  const filtered = active === ALL ? items : items.filter((p) => p.category.includes(active));

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

      <div ref={listRef}>
        {GROUPS.map(({ kind, heading }) => {
          const rows = filtered.filter((p) => p.kind === kind).sort((a, b) => a.order - b.order);
          if (rows.length === 0) return null;
          return (
            <section key={kind} aria-labelledby={`group-${kind}`} className="mt-10">
              <h2 id={`group-${kind}`} className="label">
                {heading}
              </h2>
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {rows.map((item) => (
                  <li key={item.slug}>
                    <ProjectArchiveRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
