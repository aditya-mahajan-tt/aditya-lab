"use client";

import { useState } from "react";
import { layoutSerpentine, layoutVertical, edgePoints, boundingViewBox } from "./diagramLayout";

const NODE_W = 170;
const NODE_H = 56;
const LAYOUT = { nodeW: NODE_W, nodeH: NODE_H, maxCols: 6, colSpacing: 210, rowSpacing: 130 };
const MOBILE_ROW_SPACING = 96;

type Step = { label: string; detail?: string };

/**
 * Shared per-project process flow (ARCHITECTURE.md components/systems,
 * PLAN.md Phase 11). Reads `project.process` — schema-optional, so this
 * renders nothing for projects that don't have one. The ordered list
 * rendered alongside it (app/work/[slug]/page.tsx) is a plain-text fallback
 * for JS-off/screen-reader visitors, but it only carries each step's label,
 * not its `detail` — so the SVG itself has to be genuinely keyboard-operable
 * (each node is a real, focusable, labeled control, not a hover-only `<g>`)
 * for that detail text to be reachable without a mouse (Diagnostic Report
 * §03/§09). No `role="img"` on the `<svg>` as a result — that role asserts
 * no interactive descendant, which real focusable nodes always violates.
 */
export function ProcessDiagram({ steps }: { steps: Step[] }) {
  const [active, setActive] = useState<number | null>(null);

  if (steps.length < 2) return null;

  const positions = layoutSerpentine(steps.length, LAYOUT);
  const { minX, minY, width, height } = boundingViewBox(positions, NODE_W, NODE_H);
  const mobilePositions = layoutVertical(steps.length, { nodeW: NODE_W, nodeH: NODE_H, rowSpacing: MOBILE_ROW_SPACING });
  const mobileBox = boundingViewBox(mobilePositions, NODE_W, NODE_H);
  const hasDetail = steps.some((s) => s.detail);
  const activeStep = active !== null ? steps[active] : undefined;

  return (
    <div>
    <figure className="hidden md:block">
      <svg
        viewBox={`${minX} ${minY} ${width} ${height}`}
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
              tabIndex={step.detail ? 0 : undefined}
              role={step.detail ? "button" : undefined}
              aria-label={step.detail ? `${step.label} — show detail` : undefined}
              className="group cursor-default"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive((a) => (a === i ? null : a))}
              onFocus={() => setActive(i)}
              onBlur={() => setActive((a) => (a === i ? null : a))}
              onClick={() => setActive((a) => (a === i ? null : i))}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                setActive((a) => (a === i ? null : i));
              }}
            >
              <rect
                x={pos.x - NODE_W / 2}
                y={pos.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={4}
                className="fill-surface stroke-border transition-colors duration-[var(--duration-fast)] group-hover:stroke-accent group-focus-visible:stroke-accent"
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
          {activeStep?.detail ?? "Hover or tab to a stage for detail."}
        </figcaption>
      )}
    </figure>

    <figure className="mt-8 md:hidden">
      <svg
        viewBox={`${mobileBox.minX} ${mobileBox.minY} ${mobileBox.width} ${mobileBox.height}`}
        aria-label={`Process: ${steps.map((s) => s.label).join(" → ")}.`}
        className="w-full"
      >
        <defs>
          <marker id="pd-arrow-mobile" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-border-strong)" />
          </marker>
        </defs>

        {mobilePositions.slice(1).map((pos, i) => {
          const from = mobilePositions[i];
          if (!from) return null;
          const { x1, y1, x2, y2 } = edgePoints(from, pos, NODE_W, NODE_H);
          return (
            <line
              key={`mobile-edge-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--color-border-strong)"
              strokeWidth={1.5}
              markerEnd="url(#pd-arrow-mobile)"
            />
          );
        })}

        {mobilePositions.map((pos, i) => {
          const step = steps[i];
          if (!step) return null;
          return (
            <g
              key={`mobile-${step.label}`}
              tabIndex={step.detail ? 0 : undefined}
              role={step.detail ? "button" : undefined}
              aria-label={step.detail ? `${step.label} — show detail` : undefined}
              className="cursor-pointer"
              onFocus={() => setActive(i)}
              onClick={() => setActive((a) => (a === i ? null : i))}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                setActive((a) => (a === i ? null : i));
              }}
            >
              <rect
                x={pos.x - NODE_W / 2}
                y={pos.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={4}
                className="fill-surface stroke-border transition-colors duration-[var(--duration-fast)] focus-visible:stroke-accent"
                stroke={active === i ? "var(--color-accent)" : undefined}
                strokeWidth={1.5}
              />
              <text
                x={pos.x - NODE_W / 2 + 10}
                y={pos.y - NODE_H / 2 - 8}
                className="fill-text-faint font-mono text-[10px] tracking-[0.08em]"
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
          {activeStep?.detail ?? "Tap or tab to a stage for detail."}
        </figcaption>
      )}
    </figure>
  </div>
  );
}
