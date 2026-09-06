"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { layoutSerpentine, layoutVertical, edgePoints, boundingViewBox } from "./diagramLayout";
import { Fill } from "@/components/ui/Placeholder";
import { getProject } from "@/data/queries";
import { prefersReducedMotion } from "@/animations/tokens";
import type { SystemDiagram } from "@/data/schema";

const NODE_W = 150;
const NODE_H = 52;
const LAYOUT = { nodeW: NODE_W, nodeH: NODE_H, maxCols: 6, colSpacing: 190, rowSpacing: 120 };
const MOBILE_ROW_SPACING = 90;

/**
 * Shared visual for the Phase 11 system diagrams (AutomationEngine,
 * StrategyWall — ARCHITECTURE.md components/systems). `animated` adds a
 * particle travelling each connector, per PLAN.md Phase 11's Automation
 * Engine spec; disabled entirely under prefers-reduced-motion rather than
 * just paused, per DESIGN_SYSTEM.md §5.
 */
export function SystemDiagramCard({
  diagram,
  animated = false,
}: {
  diagram: SystemDiagram;
  animated?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  const positions = layoutSerpentine(diagram.nodes.length, LAYOUT);
  const { minX, minY, width, height } = boundingViewBox(positions, NODE_W, NODE_H);

  const mobilePositions = layoutVertical(diagram.nodes.length, {
    nodeW: NODE_W,
    nodeH: NODE_H,
    rowSpacing: MOBILE_ROW_SPACING,
  });
  const mobileBox = boundingViewBox(mobilePositions, NODE_W, NODE_H);
  const activeNode = active !== null ? diagram.nodes[active] : undefined;
  const relatedProject = diagram.relatedProjectSlug ? getProject(diagram.relatedProjectSlug) : undefined;
  const related = diagram.relatedLink ?? (relatedProject ? { label: relatedProject.title, url: `/work/${relatedProject.slug}` } : undefined);

  return (
    <div>
      <p className="prose-lab max-w-[60ch] text-[length:var(--text-lg)] text-text-muted">
        <Fill value={diagram.description} />
      </p>

      {/* Desktop: the horizontal serpentine layout with room for
          {diagram.nodes.length} legible columns. Below `md`, the sibling
          figure right after this one renders the same nodes stacked
          vertically instead — see the mobile figure below. */}
      <figure className="mt-8 hidden md:block">
        <svg
          viewBox={`${minX} ${minY} ${width} ${height}`}
          role="img"
          aria-label={`${diagram.title}: ${diagram.nodes.map((n) => n.label).join(" → ")}.`}
          className="w-full"
        >
          <defs>
            <marker
              id={`arrow-${diagram.id}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-border-strong)" />
            </marker>
          </defs>

          {positions.slice(1).map((pos, i) => {
            const from = positions[i];
            if (!from) return null;
            const { x1, y1, x2, y2 } = edgePoints(from, pos, NODE_W, NODE_H);
            return (
              <g key={`edge-${diagram.id}-${i}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--color-border-strong)"
                  strokeWidth={1.5}
                  markerEnd={`url(#arrow-${diagram.id})`}
                />
                {animated && !reduced && (
                  <circle r={3} fill="var(--color-accent)">
                    <animateMotion
                      dur="2.4s"
                      begin={`${i * 0.3}s`}
                      repeatCount="indefinite"
                      path={`M ${x1},${y1} L ${x2},${y2}`}
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {positions.map((pos, i) => {
            const node = diagram.nodes[i];
            if (!node) return null;
            return (
              <g
                key={node.label}
                className="group cursor-default"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive((a) => (a === i ? null : a))}
                onClick={() => setActive((a) => (a === i ? null : i))}
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
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-text font-mono text-[13px] uppercase tracking-[0.08em]"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
        <figcaption className="label mt-4 min-h-[1.5em]">
          {activeNode?.detail ?? "Hover a stage for detail."}
        </figcaption>
      </figure>

      {/* Mobile: the same nodes stacked in a single column top-to-bottom,
          using layoutVertical instead of the desktop serpentine. Tap a
          node for its detail — there is no hover on touch. */}
      <figure className="mt-8 md:hidden">
        <svg
          viewBox={`${mobileBox.minX} ${mobileBox.minY} ${mobileBox.width} ${mobileBox.height}`}
          role="img"
          aria-label={`${diagram.title}: ${diagram.nodes.map((n) => n.label).join(" → ")}.`}
          className="w-full"
        >
          <defs>
            <marker
              id={`arrow-mobile-${diagram.id}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-border-strong)" />
            </marker>
          </defs>

          {mobilePositions.slice(1).map((pos, i) => {
            const from = mobilePositions[i];
            if (!from) return null;
            const { x1, y1, x2, y2 } = edgePoints(from, pos, NODE_W, NODE_H);
            return (
              <line
                key={`mobile-edge-${diagram.id}-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-border-strong)"
                strokeWidth={1.5}
                markerEnd={`url(#arrow-mobile-${diagram.id})`}
              />
            );
          })}

          {mobilePositions.map((pos, i) => {
            const node = diagram.nodes[i];
            if (!node) return null;
            return (
              <g
                key={`mobile-${node.label}`}
                className="cursor-pointer"
                onClick={() => setActive((a) => (a === i ? null : i))}
              >
                <rect
                  x={pos.x - NODE_W / 2}
                  y={pos.y - NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx={4}
                  className="fill-surface stroke-border transition-colors duration-[var(--duration-fast)]"
                  stroke={active === i ? "var(--color-accent)" : undefined}
                  strokeWidth={1.5}
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-text font-mono text-[13px] uppercase tracking-[0.08em]"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
        <figcaption className="label mt-4 min-h-[1.5em]">
          {activeNode?.detail ?? "Tap a stage for detail."}
        </figcaption>
      </figure>

      {related && (
        <Link
          href={related.url}
          className="label mt-6 inline-flex min-h-11 items-center gap-2 text-accent transition-colors duration-[var(--duration-fast)] hover:text-accent-dim"
        >
          {relatedProject ? "SEE THE CASE STUDY: " : "SEE MORE: "}
          <Fill value={related.label} /> →
        </Link>
      )}
    </div>
  );
}
