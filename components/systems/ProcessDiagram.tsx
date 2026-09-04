"use client";

import { useState } from "react";
import { layoutSerpentine, edgePoints, boundingViewBox } from "./diagramLayout";

const NODE_W = 170;
const NODE_H = 56;
const LAYOUT = { nodeW: NODE_W, nodeH: NODE_H, maxCols: 6, colSpacing: 210, rowSpacing: 130 };

type Step = { label: string; detail?: string };

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

  const positions = layoutSerpentine(steps.length, LAYOUT);
  const { minX, minY, width, height } = boundingViewBox(positions, NODE_W, NODE_H);
  const hasDetail = steps.some((s) => s.detail);
  const activeStep = active !== null ? steps[active] : undefined;

  return (
    <figure className="hidden md:block">
      <svg
        viewBox={`${minX} ${minY} ${width} ${height}`}
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
          const { x1, y1, x2, y2 } = edgePoints(from, pos, NODE_W, NODE_H);
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
