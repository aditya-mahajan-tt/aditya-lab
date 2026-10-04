"use client";

import { useMemo, useState } from "react";
import type { Workflow, WorkflowNode } from "@/data/schema";
import { layoutSwimlane, routeSwimlaneEdge, SWIMLANE } from "./diagramLayout";
import { WorkflowStepList } from "./WorkflowStepList";
import { KIND_TAG, nodeLabel } from "./workflowSteps";

const { nodeW: W, nodeH: H } = SWIMLANE;
const INSET = 16; // gate hexagon point inset (spec 6.2)

type Kind = WorkflowNode["kind"];

/** Spec 6.2. Shape carries meaning; accent colour appears only for the active node. */
const KIND_STYLE: Record<Kind, { fill: string; stroke: string; dash?: string }> = {
  trigger: { fill: "var(--color-surface)", stroke: "var(--color-border-strong)" },
  step: { fill: "var(--color-surface)", stroke: "var(--color-border)" },
  gate: { fill: "var(--color-surface)", stroke: "var(--color-border-strong)" },
  human: { fill: "var(--color-surface)", stroke: "var(--color-border-strong)" },
  surface: { fill: "var(--color-surface-raised)", stroke: "var(--color-border-strong)" },
  store: { fill: "var(--color-surface)", stroke: "var(--color-border-strong)", dash: "5 4" },
  end: { fill: "var(--color-bg)", stroke: "var(--color-border)" },
};

const LEGEND_KINDS: Kind[] = ["trigger", "step", "gate", "human", "surface", "store", "end"];

function Shape({
  kind,
  x,
  y,
  w = W,
  h = H,
  active = false,
}: {
  kind: Kind;
  x: number; // centre
  y: number; // centre
  w?: number;
  h?: number;
  active?: boolean;
}) {
  const s = KIND_STYLE[kind];
  const left = x - w / 2;
  const top = y - h / 2;
  const common = {
    fill: s.fill,
    stroke: active ? "var(--color-accent)" : s.stroke,
    strokeWidth: 1.5,
    strokeDasharray: s.dash,
    className: "transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none",
  };
  if (kind === "gate") {
    const inset = h === H ? INSET : INSET / 2;
    const pts = [
      [left, y],
      [left + inset, top],
      [left + w - inset, top],
      [left + w, y],
      [left + w - inset, top + h],
      [left + inset, top + h],
    ]
      .map((p) => p.join(","))
      .join(" ");
    return <polygon points={pts} {...common} />;
  }
  const rx = kind === "trigger" || kind === "human" ? h / 2 : 4;
  return <rect x={left} y={top} width={w} height={h} rx={rx} {...common} />;
}

/**
 * Spec 6: one combined swimlane. 1280px and up: the SVG, a sticky detail
 * caption, a skip link, and the same data as a closed <details> list. Below
 * 1280px: the list alone. (`min-[1280px]:` rather than `xl:` because this
 * repo sets --breakpoint-xl to 1440px; see the plan's R9.) Both come from the same workflow object. No
 * role="img" on the svg: it has focusable descendants (see ProcessDiagram).
 */
export function WorkflowDiagram({ workflow }: { workflow: Workflow }) {
  const [active, setActive] = useState<string | null>(null);

  const { positions, width, height } = useMemo(
    () => layoutSwimlane(workflow.nodes, workflow.lanes),
    [workflow],
  );
  const edges = useMemo(
    () =>
      workflow.edges.map((e) => ({
        ...e,
        routed: routeSwimlaneEdge(positions[e.from]!, positions[e.to]!, SWIMLANE, e.route),
      })),
    [workflow, positions],
  );
  const phaseCaptions = useMemo(
    () =>
      workflow.phases.map((p) => {
        const node = workflow.nodes.find((n) => n.lane === p.lane && n.row === p.row);
        return { p, at: node ? positions[node.id]! : undefined };
      }),
    [workflow, positions],
  );

  const activeNode = active ? workflow.nodes.find((n) => n.id === active) : undefined;
  const touches = (e: { from: string; to: string }) =>
    active !== null && (e.from === active || e.to === active);
  const arrow = `wf-arrow-${workflow.slug}`;
  const arrowOn = `wf-arrow-on-${workflow.slug}`;
  const after = `wf-after-${workflow.slug}`;
  const toggle = (id: string) => setActive((a) => (a === id ? null : id));

  // Legend sits bottom-left, in the empty block under Phase B (lanes 1-2, rows 14-16).
  const legendRow = 26;
  const legendTop = height - SWIMLANE.pad - (20 + (LEGEND_KINDS.length + 2) * legendRow);

  return (
    <div>
      <a
        href={`#${after}`}
        className="sr-only min-[1280px]:focus:not-sr-only min-[1280px]:focus:inline-flex min-[1280px]:focus:min-h-11 min-[1280px]:focus:items-center focus:rounded-sm focus:border focus:border-accent focus:bg-bg focus:px-4 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-accent"
      >
        Skip the diagram
      </a>

      <figure className="hidden min-[1280px]:block" onKeyDown={(e) => e.key === "Escape" && setActive(null)}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          aria-label={`${workflow.title} workflow, swimlane diagram`}
        >
          <defs>
            {[
              [arrow, "var(--color-border-strong)"],
              [arrowOn, "var(--color-accent)"],
            ].map(([id, fill]) => (
              <marker
                key={id}
                id={id}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 Z" fill={fill} />
              </marker>
            ))}
          </defs>

          {/* Lane headers and dividers */}
          <line x1={0} x2={width} y1={SWIMLANE.head} y2={SWIMLANE.head} stroke="var(--color-border)" />
          {workflow.lanes.map((lane, i) => (
            <g key={lane.id}>
              {i > 0 && (
                <line
                  x1={i * SWIMLANE.laneW}
                  x2={i * SWIMLANE.laneW}
                  y1={0}
                  y2={height}
                  stroke="var(--color-border)"
                />
              )}
              <text
                x={i * SWIMLANE.laneW + SWIMLANE.laneW / 2}
                y={SWIMLANE.head / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="label"
                fill="currentColor"
              >
                {lane.label}
              </text>
            </g>
          ))}

          {/* Edges: idle first, so active edges paint on top */}
          {[...edges]
            .sort((a, b) => Number(touches(a)) - Number(touches(b)))
            .map((e) => {
              const on = touches(e);
              return (
                <g key={`${e.from}->${e.to}`}>
                  <polyline
                    points={e.routed.points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke={on ? "var(--color-accent)" : "var(--color-border-strong)"}
                    strokeWidth={1.5}
                    strokeDasharray={e.kind === "data" ? "3 4" : undefined}
                    markerEnd={`url(#${on ? arrowOn : arrow})`}
                    className="transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none"
                  />
                  {e.label && (
                    <text
                      x={e.routed.label.x}
                      y={e.routed.label.y}
                      textAnchor={e.routed.label.anchor}
                      className="fill-text-muted font-mono text-[10px] tracking-[0.08em]"
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}

          {/* Phase captions: the one static use of the accent (spec 6.2). Baseline sits above the tag. */}
          {phaseCaptions.map(({ p, at }) =>
            at ? (
              <text
                key={p.id}
                x={at.x - W / 2}
                y={at.y - H / 2 - 20}
                className="fill-accent font-mono text-[10px] tracking-[0.08em]"
              >
                {p.id} · {p.label}
              </text>
            ) : null,
          )}

          {/* Nodes, in array (reading) order so Tab walks the flow */}
          {workflow.nodes.map((n) => {
            const c = positions[n.id]!;
            return (
              <g
                key={n.id}
                tabIndex={0}
                role="button"
                aria-label={`${KIND_TAG[n.kind]}: ${nodeLabel(n)}. ${n.detail}`}
                className="cursor-default"
                onMouseEnter={() => setActive(n.id)}
                onMouseLeave={() => setActive((a) => (a === n.id ? null : a))}
                onFocus={() => setActive(n.id)}
                onBlur={() => setActive((a) => (a === n.id ? null : a))}
                onClick={() => toggle(n.id)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  toggle(n.id);
                }}
              >
                <Shape kind={n.kind} x={c.x} y={c.y} active={active === n.id} />
                <text
                  x={c.x - W / 2 + 10}
                  y={c.y - H / 2 - 8}
                  className="fill-text-faint font-mono text-[10px] tracking-[0.08em]"
                >
                  {KIND_TAG[n.kind]}
                </text>
                {n.label.map((line, i) => (
                  <text
                    key={line}
                    x={c.x}
                    y={c.y + (i - (n.label.length - 1) / 2) * 16}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-text font-mono text-[13px] uppercase tracking-[0.08em]"
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* Legend: seven shapes, two edge styles */}
          <g aria-hidden="true">
            <text x={24} y={legendTop} className="fill-text-faint font-mono text-[10px] tracking-[0.08em]">
              LEGEND
            </text>
            {LEGEND_KINDS.map((k, i) => (
              <g key={k}>
                <Shape kind={k} x={24 + 22} y={legendTop + 20 + i * legendRow} w={44} h={18} />
                <text
                  x={24 + 56}
                  y={legendTop + 20 + i * legendRow}
                  dominantBaseline="middle"
                  className="fill-text-muted font-mono text-[10px] tracking-[0.08em]"
                >
                  {KIND_TAG[k]}
                </text>
              </g>
            ))}
            {(["flow", "data"] as const).map((k, i) => {
              const y = legendTop + 20 + (LEGEND_KINDS.length + i) * legendRow;
              return (
                <g key={k}>
                  <line
                    x1={24}
                    x2={24 + 44}
                    y1={y}
                    y2={y}
                    stroke="var(--color-border-strong)"
                    strokeWidth={1.5}
                    strokeDasharray={k === "data" ? "3 4" : undefined}
                  />
                  <text
                    x={24 + 56}
                    y={y}
                    dominantBaseline="middle"
                    className="fill-text-muted font-mono text-[10px] tracking-[0.08em]"
                  >
                    {k === "flow" ? "FLOW" : "DATA READ / WRITE"}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Taller than the viewport, so the caption sticks to its bottom (spec 6.3). */}
        <figcaption
          aria-live="polite"
          className="sticky bottom-4 z-[var(--z-sticky)] mt-4 min-h-[5.5rem] rounded-sm border border-border-strong bg-surface-raised p-4"
        >
          {activeNode ? (
            <>
              <p className="label">{KIND_TAG[activeNode.kind]}</p>
              <p className="mt-1 font-mono text-sm uppercase tracking-[0.08em] text-text">
                {nodeLabel(activeNode)}
              </p>
              <p className="mt-2 text-text-muted">{activeNode.detail}</p>
            </>
          ) : (
            <p className="label">Hover, tab or tap a step for detail.</p>
          )}
        </figcaption>
      </figure>

      <div id={after} tabIndex={-1} />

      {/* 1280px and up: the text equivalent, closed by default. */}
      <details className="mt-8 hidden border-t border-border pt-4 min-[1280px]:block">
        <summary className="label flex min-h-11 cursor-pointer items-center hover:text-accent">
          READ AS A LIST
        </summary>
        <div className="mt-6">
          <WorkflowStepList workflow={workflow} />
        </div>
      </details>

      {/* Below 1280px: the whole diagram. */}
      <div className="mt-8 min-[1280px]:hidden">
        <WorkflowStepList workflow={workflow} />
      </div>
    </div>
  );
}
