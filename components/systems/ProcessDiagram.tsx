"use client";

import { useState } from "react";

const NODE_W = 170;
const NODE_H = 56;
const MAX_COLS = 6;
const COL_SPACING = 210;
const ROW_SPACING = 130;

type Step = { label: string; detail?: string };
type Position = { x: number; y: number };

/** Lays steps out in a serpentine (left-right, then right-left) flow, wrapping past MAX_COLS. */
function layout(count: number): Position[] {
  const cols = Math.min(MAX_COLS, count);
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = row % 2 === 0 ? i % cols : cols - 1 - (i % cols);
    return { x: 100 + col * COL_SPACING, y: 40 + row * ROW_SPACING };
  });
}

/** Endpoints on the facing edges of two node boxes, for a clean connecting line. */
function edgePoints(a: Position, b: Position) {
  if (a.y === b.y) {
    const dir = b.x > a.x ? 1 : -1;
    return { x1: a.x + dir * (NODE_W / 2), y1: a.y, x2: b.x - dir * (NODE_W / 2), y2: b.y };
  }
  const dir = b.y > a.y ? 1 : -1;
  return { x1: a.x, y1: a.y + dir * (NODE_H / 2), x2: b.x, y2: b.y - dir * (NODE_H / 2) };
}

/**
 * Shared per-project process flow (ARCHITECTURE.md components/systems,
 * PLAN.md Phase 11). Reads `project.process` — schema-optional, so this
 * renders nothing for projects that don't have one. Hover/focus is a visual
 * enhancement only: the SVG is decorative (aria-label carries the sequence),
 * and the ordered list rendered alongside it is the real accessible content
 * per DESIGN_SYSTEM.md's diagram rule (see ThinkingFramework for the same
 * pattern).
 */
export function ProcessDiagram({ steps }: { steps: Step[] }) {
  const [active, setActive] = useState<number | null>(null);

  if (steps.length < 2) return null;

  const positions = layout(steps.length);
  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const minX = Math.min(...xs) - NODE_W / 2 - 16;
  const maxX = Math.max(...xs) + NODE_W / 2 + 16;
  const minY = Math.min(...ys) - NODE_H / 2 - 16;
  const maxY = Math.max(...ys) + NODE_H / 2 + 16;

  const hasDetail = steps.some((s) => s.detail);
  const activeStep = active !== null ? steps[active] : undefined;

  return (
    <figure className="hidden md:block">
      <svg
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        role="img"
        aria-label={`Process: ${steps.map((s) => s.label).join(" → ")}.`}
        className="w-full"
      >
        <defs>
          <marker id="pd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-border-strong)" />
          </marker>
        </defs>

        {positions.slice(1).map((pos, i) => {
          const from = positions[i];
          if (!from) return null;
          const { x1, y1, x2, y2 } = edgePoints(from, pos);
          return (
            <line
              key={`edge-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--color-border-strong)"
              strokeWidth={1.5}
              markerEnd="url(#pd-arrow)"
            />
          );
        })}

        {positions.map((pos, i) => {
          const step = steps[i];
          if (!step) return null;
          return (
            <g
              key={step.label}
              className="group cursor-default"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive((a) => (a === i ? null : a))}
            >
              <rect
                x={pos.x - NODE_W / 2}
                y={pos.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={4}
                className="fill-surface stroke-border transition-colors duration-[var(--duration-fast)] group-hover:stroke-accent"
                strokeWidth={1.5}
              />
              <text
                x={pos.x - NODE_W / 2 + 10}
                y={pos.y - NODE_H / 2 - 8}
                className="fill-text-faint font-mono text-[10px] tracking-[0.08em] transition-colors duration-[var(--duration-fast)] group-hover:fill-accent"
              >
                {String(i + 1).padStart(2, "0")}
              </text>
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-text font-mono text-[15px] uppercase tracking-[0.08em]"
              >
                {step.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hasDetail && (
        <figcaption className="label mt-4 min-h-[1.5em]">
          {activeStep?.detail ?? "Hover a stage for detail."}
        </figcaption>
      )}
    </figure>
  );
}
