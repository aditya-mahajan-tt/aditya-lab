"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { ThinkingStep } from "@/data/schema";
import { Fill } from "@/components/ui/Placeholder";

const NODE_W = 170;
const NODE_H = 56;
const COLS = 4;
const COL_SPACING = 240;
const ROW_SPACING = 210;

type Position = { x: number; y: number };

/** Lays steps out in a serpentine (left-right, then right-left) flow. */
function layout(count: number): Position[] {
  const cols = Math.min(COLS, count);
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = row % 2 === 0 ? i % cols : cols - 1 - (i % cols);
    return { x: 120 + col * COL_SPACING, y: 70 + row * ROW_SPACING };
  });
}

/** Endpoints on the facing edges of two node boxes, for a clean arrow between them. */
function edgePoints(a: Position, b: Position) {
  if (a.y === b.y) {
    const dir = b.x > a.x ? 1 : -1;
    return { x1: a.x + dir * (NODE_W / 2), y1: a.y, x2: b.x - dir * (NODE_W / 2), y2: b.y };
  }
  const dir = b.y > a.y ? 1 : -1;
  return { x1: a.x, y1: a.y + dir * (NODE_H / 2), x2: b.x, y2: b.y - dir * (NODE_H / 2) };
}

/**
 * The framework as a loop (PLAN.md Phase 4) — the last step feeds back into
 * the first. Two changes on 2026-09-19:
 *
 * 1. Nodes carry content. They used to be labels, with the worked example a
 *    paragraph below; selecting one now shows that step's body and a real
 *    moment from real work, which makes the diagram a trace of a project
 *    through the loop rather than an illustration of one.
 * 2. One traveling pulse, not many. Aditya's brief was a brain with many
 *    pulsing green neurons. The colour is right — DESIGN_SYSTEM.md §2
 *    already defines green as "activates, connects, is online" — but the
 *    same section caps signal colour at ~5% and says a green-tinted section
 *    is a bug. One moving signal says "this cycle runs continuously", which
 *    is the one thing a static diagram cannot; sixty twinkling nodes say
 *    nothing and tint the section.
 *
 * Because nodes now carry unique information, the diagram is no longer
 * desktop-only: below `md` the same steps render as a tappable stack.
 *
 * Progressive enhancement (CLAUDE.md §3.2): the caption only ever shows the
 * selected step, so the <noscript> block carries every step's full text for
 * visitors whose JavaScript fails.
 */
export function ThinkingFramework({ steps }: { steps: ThinkingStep[] }) {
  const [active, setActive] = useState(0);
  const nodeRefs = useRef<Array<SVGGElement | null>>([]);
  if (steps.length < 2) return null;

  const positions = layout(steps.length);
  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const minX = Math.min(...xs) - NODE_W / 2 - 110;
  const maxX = Math.max(...xs) + NODE_W / 2 + 20;
  const minY = Math.min(...ys) - NODE_H / 2 - 20;
  const maxY = Math.max(...ys) + NODE_H / 2 + 20;

  const first = positions[0];
  const last = positions[positions.length - 1];
  const loopX = minX + 40;
  const loopPath =
    first && last
      ? `M ${last.x - NODE_W / 2},${last.y} C ${loopX},${last.y} ${loopX},${first.y} ${first.x - NODE_W / 2},${first.y}`
      : "";

  // One path for the whole cycle -- every connector plus the feedback arrow --
  // so a single <animateMotion> traverses it. Empty when there is nothing to
  // travel, in which case the pulse is not rendered at all.
  const pulsePath = loopPath
    ? `${positions
        .slice(1)
        .map((pos, i) => {
          const from = positions[i];
          if (!from) return "";
          const { x1, y1, x2, y2 } = edgePoints(from, pos);
          return `M ${x1},${y1} L ${x2},${y2}`;
        })
        .join(" ")} ${loopPath}`
    : "";

  const activeStep = steps[active];

  const select = (i: number, focus = false) => {
    setActive(i);
    if (focus) nodeRefs.current[i]?.focus();
  };

  return (
    <>
    <figure>
      {/* Diagram: md and up */}
      <svg
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        role="group"
        aria-label={`The framework as a loop: ${steps.map((s) => s.label).join(" → ")} → back to ${first ? steps[0]?.label : ""}.`}
        className="hidden w-full md:block"
      >
        <defs>
          <marker id="tf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-border-strong)" />
          </marker>
          <marker id="tf-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-accent)" />
          </marker>
        </defs>

        {positions.slice(1).map((pos, i) => {
          const from = positions[i];
          if (!from) return null;
          const { x1, y1, x2, y2 } = edgePoints(from, pos);
          return (
            <line
              key={`arrow-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--color-border-strong)"
              strokeWidth={1.5}
              markerEnd="url(#tf-arrow)"
            />
          );
        })}

        {loopPath && (
          <path
            d={loopPath}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={1.5}
            markerEnd="url(#tf-arrow-accent)"
          />
        )}

        {/* One signal, travelling the whole loop. Decorative: hidden from
            assistive tech, unfocusable, and suppressed under
            prefers-reduced-motion by the CSS in globals.css. */}
        {pulsePath && (
          <circle
            data-framework-pulse
            aria-hidden="true"
            r={4}
            fill="var(--color-accent)"
            className="framework-pulse"
          >
            <animateMotion dur="12s" repeatCount="indefinite" path={pulsePath} />
          </circle>
        )}

        {positions.map((pos, i) => {
          const step = steps[i];
          if (!step) return null;
          const isActive = i === active;
          return (
            <g
              key={step.label}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              onClick={() => select(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  select(i);
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  select((i + 1) % steps.length, true);
                } else if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  select((i - 1 + steps.length) % steps.length, true);
                }
              }}
              className="group cursor-pointer"
            >
              {/* The global :focus-visible outline (globals.css) still applies
                  to the <g>. It is not relied on alone: SVG outline rendering
                  varies, so the rect also takes the focus colour and a
                  heavier stroke while the node is keyboard-focused. */}
              <rect
                x={pos.x - NODE_W / 2}
                y={pos.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={4}
                fill="var(--color-surface)"
                stroke={isActive ? "var(--color-accent)" : "var(--color-border)"}
                strokeWidth={isActive ? 2 : 1}
                className="group-focus-visible:[stroke-width:3px] group-focus-visible:[stroke:var(--color-focus)]"
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

      {/* Stack: below md */}
      <ul className="flex flex-col gap-2 md:hidden">
        {steps.map((step, i) => (
          <li key={step.label}>
            <button
              type="button"
              onClick={() => select(i)}
              aria-pressed={i === active}
              className="w-full border border-border bg-surface px-4 py-3 text-left font-mono uppercase tracking-[0.08em] aria-pressed:border-accent"
            >
              <span className="label mr-3 text-text-faint">{String(i + 1).padStart(2, "0")}</span>
              {step.label}
            </button>
          </li>
        ))}
      </ul>

      {activeStep && (
        <figcaption className="mt-6 border-t border-border pt-6" aria-live="polite">
          <p className="label">{activeStep.label}</p>
          <div className="prose-lab mt-3">
            <Fill value={activeStep.body} as="p" />
          </div>
          {activeStep.moment && (
            <div className="mt-4 border-l-2 border-accent pl-4">
              <div className="prose-lab text-text-muted">
                <Fill value={activeStep.moment.body} as="p" />
              </div>
              {activeStep.moment.link && (
                <Link
                  href={activeStep.moment.link.url}
                  className="label mt-2 inline-flex min-h-11 items-center text-accent hover:underline"
                >
                  {activeStep.moment.link.label} →
                </Link>
              )}
            </div>
          )}
        </figcaption>
      )}
    </figure>

      {/* No-JS fallback: the caption above only server-renders step 1, so the
          full trace lives here. React renders <noscript> on the server and
          skips it on hydration. */}
      <noscript>
        <ol className="mt-8 divide-y divide-border border-y border-border">
          {steps.map((step, i) => (
            <li key={step.label} className="flex flex-col gap-3 py-8 md:flex-row md:gap-10">
              <div className="flex items-baseline gap-4 md:w-56 md:shrink-0">
                <span className="label">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="font-mono text-sm uppercase tracking-widest text-text">{step.label}</h2>
              </div>
              <div className="prose-lab text-text-muted">
                <Fill value={step.body} as="p" />
                {step.moment && (
                  <>
                    <Fill value={step.moment.body} as="p" />
                    {step.moment.link && (
                      <Link href={step.moment.link.url} className="label text-accent hover:underline">
                        {step.moment.link.label} →
                      </Link>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      </noscript>
    </>
  );
}
