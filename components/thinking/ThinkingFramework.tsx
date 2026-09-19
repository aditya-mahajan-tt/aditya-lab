"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ThinkingStep } from "@/data/schema";
import { Fill } from "@/components/ui/Placeholder";
import { buildBrainMesh } from "./brainMesh";

/**
 * The framework as a brain (PLAN.md Phase 4) -- a neural mesh in a side-view
 * silhouette, with one hub per step on a loop inside it and the last step
 * feeding back into the first. Aditya approved this as "Option B" of the
 * brain mockups; the geometry lives in ./brainMesh.ts.
 *
 * Two states, both carrying the same information so neither is decoration:
 *
 * - IDLE (nothing hovered or focused): a handful of seeded neurons blink and
 *   one signal travels the hub loop -- "this cycle runs continuously".
 * - LIT (a hub is hovered or keyboard-focused; on touch, the selected hub):
 *   blinking and the pulse stop and the one section of the brain belonging to
 *   that step turns green -- small dots and thin lines only, never a fill,
 *   because DESIGN_SYSTEM.md section 2 caps signal colour at ~5% and calls a
 *   green-tinted section a bug. Under prefers-reduced-motion the lit section
 *   is steady: the state change carries the meaning, not the motion.
 *
 * Hover only lights a section. Selecting (click, Enter, Space, arrows) is a
 * separate act: it swaps the caption and rings the hub.
 *
 * The hubs are too small to be touch targets at phone width, so the diagram
 * is md-and-up; below `md` the same steps render as a tappable stack.
 *
 * Progressive enhancement (CLAUDE.md section 3.2): the caption only ever
 * shows the selected step, so the <noscript> block carries every step's full
 * text for visitors whose JavaScript fails.
 */
export function ThinkingFramework({ steps }: { steps: ThinkingStep[] }) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [coarse, setCoarse] = useState(false);
  // The selection starts on step 1 without the visitor having done anything.
  // On touch that must not read as "tapped": idle stays idle until a tap.
  const [interacted, setInteracted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const nodeRefs = useRef<Array<SVGGElement | null>>([]);
  const mesh = useMemo(() => (steps.length >= 2 ? buildBrainMesh(steps.length) : null), [steps.length]);

  // Read in an effect, defaulting to false, so server and first client render
  // agree. Lit state only ever begins after an interaction, so there is no
  // flash to hide.
  useEffect(() => {
    const coarseQuery = window.matchMedia("(hover: none)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setCoarse(coarseQuery.matches);
      setReduceMotion(motionQuery.matches);
    };
    sync();
    coarseQuery.addEventListener("change", sync);
    motionQuery.addEventListener("change", sync);
    return () => {
      coarseQuery.removeEventListener("change", sync);
      motionQuery.removeEventListener("change", sync);
    };
  }, []);

  if (steps.length < 2 || !mesh) return null;

  const lit = hovered ?? focused ?? (coarse && interacted ? active : null);
  const activeStep = steps[active];

  const select = (i: number, focus = false) => {
    setActive(i);
    setInteracted(true);
    if (focus) nodeRefs.current[i]?.focus();
  };

  const first = steps[0];
  const litNodes = lit === null ? [] : mesh.nodes.map((n, i) => ({ n, i })).filter(({ n }) => n.section === lit);
  const litOrder = new Map(litNodes.map(({ i }, order) => [i, order]));

  return (
    <>
    <figure>
      {/* Diagram: md and up */}
      <svg
        viewBox="60 24 580 424"
        role="group"
        aria-label={`The framework as a loop through a brain: ${steps.map((s) => s.label).join(" → ")} → back to ${first?.label ?? ""}. Hover or focus a step to light its region.`}
        className="mx-auto hidden w-full max-w-[880px] md:block"
      >
        {/* Silhouette. Decorative. The cerebellum and brainstem are drawn
            first and start inside the cerebrum's lower outline; its opaque
            fill then hides the joins, so nothing floats free. */}
        <g aria-hidden="true" data-brain-shape>
          <path d={mesh.cerebellumPath} fill="var(--color-surface)" stroke="var(--color-border-strong)" strokeWidth={1.2} />
          {mesh.cerebellumFoldPaths.map((d) => (
            <path key={d} d={d} fill="none" stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <path d={mesh.stemPath} fill="var(--color-surface)" stroke="var(--color-border-strong)" strokeWidth={1.2} strokeLinejoin="round" />
          <path d={mesh.outlinePath} fill="var(--color-surface)" stroke="var(--color-border-strong)" strokeWidth={1.2} />
          {mesh.gyriPaths.map((d) => (
            <path key={d} d={d} fill="none" stroke="var(--color-border)" strokeWidth={1} />
          ))}
        </g>

        {/* Mesh edges. Lit edges are thin accent-dim lines, never a fill. */}
        <g aria-hidden="true">
          {mesh.edges.map((e) => {
            const a = mesh.nodes[e.a]!;
            const b = mesh.nodes[e.b]!;
            const isLit = lit !== null && e.section === lit;
            return (
              <line
                key={`${e.a}-${e.b}`}
                data-brain-edge
                data-section={e.section ?? undefined}
                data-edge-lit={isLit ? "true" : "false"}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={isLit ? "var(--color-accent-dim)" : "var(--color-border)"}
                strokeWidth={isLit ? 1.2 : 0.9}
              />
            );
          })}
        </g>

        {/* Neurons. In the lit section each one fires softly, staggered --
            unless motion is reduced, when it is a steady green dot. */}
        <g aria-hidden="true">
          {mesh.nodes.map((n, i) => {
            const isLit = lit !== null && n.section === lit;
            const order = litOrder.get(i) ?? 0;
            return (
              <circle
                key={i}
                data-brain-node
                data-section={n.section}
                data-lit={isLit ? "true" : "false"}
                cx={n.x}
                cy={n.y}
                r={isLit ? 2.2 : 1.8}
                fill={isLit ? "var(--color-accent)" : "var(--color-border-strong)"}
              >
                {isLit && !reduceMotion && (
                  <>
                    <animate attributeName="opacity" values="0.45;1;0.45" dur="2.4s" begin={`${((order * 0.31) % 2.4).toFixed(2)}s`} repeatCount="indefinite" />
                    <animate attributeName="r" values="2.2;3.4;2.2" dur="2.4s" begin={`${((order * 0.31) % 2.4).toFixed(2)}s`} repeatCount="indefinite" />
                  </>
                )}
              </circle>
            );
          })}
        </g>

        {/* IDLE only: a few neurons blink. Hidden under reduced motion by the
            CSS in globals.css, and not rendered at all while a section is lit. */}
        {lit === null && (
          <g aria-hidden="true">
            {mesh.blinkNodes.map((ni, k) => {
              const n = mesh.nodes[ni]!;
              const begin = `${((k * 0.83) % 3).toFixed(2)}s`;
              const dur = `${(2.4 + (k % 3) * 0.5).toFixed(1)}s`;
              return (
                <circle
                  key={ni}
                  data-brain-blink
                  className="brain-blink"
                  cx={n.x}
                  cy={n.y}
                  r={2.2}
                  fill="var(--color-accent)"
                  opacity={0}
                >
                  <animate attributeName="opacity" values="0;1;0" dur={dur} begin={begin} repeatCount="indefinite" />
                  <animate attributeName="r" values="2.2;3.8;2.2" dur={dur} begin={begin} repeatCount="indefinite" />
                </circle>
              );
            })}
          </g>
        )}

        {/* The hub loop: neutral line, one green signal travelling it. */}
        {mesh.ringPath && (
          <path
            aria-hidden="true"
            d={mesh.ringPath}
            fill="none"
            stroke="var(--color-border-strong)"
            strokeWidth={1}
            strokeDasharray="2 5"
          />
        )}

        {/* One signal, travelling the whole loop while idle. Decorative:
            hidden from assistive tech, unfocusable, and suppressed under
            prefers-reduced-motion by the CSS in globals.css. */}
        {mesh.ringPath && lit === null && (
          <>
            <circle aria-hidden="true" r={13} fill="var(--color-accent)" opacity={0.16} className="framework-pulse">
              <animateMotion dur="14s" repeatCount="indefinite" path={mesh.ringPath} />
            </circle>
            <circle
              data-framework-pulse
              aria-hidden="true"
              r={5}
              fill="var(--color-accent)"
              className="framework-pulse"
            >
              <animateMotion dur="14s" repeatCount="indefinite" path={mesh.ringPath} />
            </circle>
          </>
        )}

        {mesh.hubs.map((hub, i) => {
          const step = steps[i];
          if (!step) return null;
          const isActive = i === active;
          const isLit = i === lit;
          return (
            <g
              key={step.label}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              data-hub={i}
              onClick={() => select(i)}
              onPointerEnter={(e) => {
                if (e.pointerType !== "touch") setHovered(i);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType !== "touch") setHovered((h) => (h === i ? null : h));
              }}
              onFocus={(e) => {
                // Only keyboard focus lights a section; a mouse click also
                // focuses the <g>, and that must not pin the section lit.
                if (e.currentTarget.matches(":focus-visible")) setFocused(i);
              }}
              onBlur={() => setFocused((f) => (f === i ? null : f))}
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
              {/* Generous transparent hit target: the hub itself is small. */}
              <circle data-hub-hit cx={hub.x} cy={hub.y} r={24} fill="transparent" />
              {/* The global :focus-visible outline (globals.css) still applies
                  to the <g>. It is not relied on alone: SVG outline rendering
                  varies, so the ring also takes the focus colour and a
                  heavier stroke while the hub is keyboard-focused. */}
              <circle
                data-hub-ring
                cx={hub.x}
                cy={hub.y}
                r={isActive ? 9 : 7}
                fill="var(--color-bg)"
                stroke={isActive ? "var(--color-accent)" : isLit ? "var(--color-text)" : "var(--color-border-strong)"}
                strokeWidth={isActive ? 2 : 1.4}
                className="group-focus-visible:[stroke-width:3px] group-focus-visible:[stroke:var(--color-focus)]"
              />
              <text
                x={hub.x + 13}
                y={hub.y - 8}
                fill="var(--color-text-faint)"
                stroke="var(--color-surface)"
                strokeWidth={3}
                strokeLinejoin="round"
                paintOrder="stroke"
                className="font-mono text-[10px] tracking-[0.08em]"
              >
                {String(i + 1).padStart(2, "0")}
              </text>
              <text
                x={hub.x + 13}
                y={hub.y + 5}
                fill="var(--color-text)"
                stroke="var(--color-surface)"
                strokeWidth={3}
                strokeLinejoin="round"
                paintOrder="stroke"
                className="font-mono text-[12px] uppercase tracking-[0.08em]"
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
