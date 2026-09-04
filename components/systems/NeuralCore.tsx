"use client";

import { useState } from "react";
import Link from "next/link";
import { skillGroups } from "@/data/skills";
import { getAllProjects } from "@/data/queries";
import { Fill } from "@/components/ui/Placeholder";
import { cn } from "@/lib/utils/cn";

/**
 * Which real project categories (data/projects.ts) each capability group
 * connects to. This organises existing tags — it invents no new facts.
 */
const CAPABILITY_CATEGORIES: Record<string, string[]> = {
  THINK: ["Strategy", "Segmentation"],
  BUILD: ["Product", "Creative"],
  AUTOMATE: ["Automation"],
  INTELLIGENCE: ["AI"],
  GROW: ["Marketing", "Growth"],
};

const RADIUS = 130;
const CENTER = 170;

/**
 * PLAN.md Phase 11 — capability graph where nodes link to real projects.
 * The SVG hub-and-spoke is decorative (aria-hidden); the real interactive
 * surface is the button group + link list beneath it, so every bit of
 * unique information here — which capability connects to which project —
 * is reachable by keyboard, not hidden behind hover.
 */
export function NeuralCore() {
  const [active, setActive] = useState<string>(skillGroups[0]?.id ?? "THINK");
  const activeGroup = skillGroups.find((g) => g.id === active);
  const relatedProjects = getAllProjects().filter((p) =>
    (CAPABILITY_CATEGORIES[active] ?? []).some((cat) => p.category.includes(cat)),
  );
  const angleStep = (2 * Math.PI) / skillGroups.length;

  return (
    <div>
      <p className="prose-lab max-w-[60ch] text-[length:var(--text-lg)] text-text-muted">
        How the five capability groups connect to real work.
      </p>

      <svg
        viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
        aria-hidden="true"
        className="mx-auto mt-8 hidden w-full max-w-md md:block"
      >
        {skillGroups.map((group, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const x = CENTER + RADIUS * Math.cos(angle);
          const y = CENTER + RADIUS * Math.sin(angle);
          const isActive = group.id === active;
          return (
            <g key={group.id}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke={isActive ? "var(--color-accent)" : "var(--color-border)"}
                strokeWidth={isActive ? 2 : 1}
                className="transition-colors duration-[var(--duration-fast)]"
              />
              <circle
                cx={x}
                cy={y}
                r={28}
                strokeWidth={1.5}
                className={cn(
                  "fill-surface stroke-border transition-colors duration-[var(--duration-fast)]",
                  isActive && "stroke-accent",
                )}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn(
                  "fill-text-muted font-mono text-[9px] uppercase tracking-[0.08em] transition-colors duration-[var(--duration-fast)]",
                  isActive && "fill-accent",
                )}
              >
                {group.id}
              </text>
            </g>
          );
        })}
        <circle cx={CENTER} cy={CENTER} r={34} className="fill-surface-raised stroke-border-strong" strokeWidth={1.5} />
        <text
          x={CENTER}
          y={CENTER}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-text font-mono text-[10px] uppercase tracking-[0.08em]"
        >
          ADITYA
        </text>
      </svg>

      <div role="group" aria-label="Select a capability" className="mt-8 flex flex-wrap gap-2">
        {skillGroups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => setActive(group.id)}
            aria-pressed={active === group.id}
            className={cn(
              "min-h-11 rounded-sm border px-3 font-mono text-xs uppercase tracking-widest transition-colors duration-[var(--duration-fast)]",
              active === group.id
                ? "border-accent text-accent"
                : "border-border text-text-muted hover:border-border-strong hover:text-text",
            )}
          >
            {group.id}
          </button>
        ))}
      </div>

      {activeGroup && (
        <div className="mt-6">
          <p className="text-sm text-text-muted">
            <Fill value={activeGroup.description} />
          </p>
          {relatedProjects.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {relatedProjects.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/work/${p.slug}`}
                    className="label inline-flex min-h-11 items-center text-accent transition-colors duration-[var(--duration-fast)] hover:text-accent-dim"
                  >
                    <Fill value={p.title} /> →
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="label mt-4 text-text-faint">No linked project yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
