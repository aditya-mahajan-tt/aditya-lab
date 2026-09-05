"use client";

import { useEffect, useRef } from "react";
import { about } from "@/data/about";
import { Fill } from "@/components/ui/Placeholder";

/**
 * The permanent DOM representation of the identity progression (design spec
 * §3.2). Six native <details> elements, closed by default — every stage's
 * text is reachable with JavaScript entirely off, and closed-by-default is
 * also what fixes the "wall of text" complaint the whole feature exists to
 * address.
 *
 * This is not a decorative lookalike the way components/hero/CoreFallback
 * is (Core's nodes carry no information, so CoreFallback can safely go
 * inert once 3D loads). This component IS the accessible control surface,
 * for the page's whole life: a 3D node click opens the matching <details>
 * programmatically via `activeStage`; a real click on a <summary> fires the
 * native `toggle` event, reported back up via `onToggle` so 3D and DOM stay
 * in sync through one piece of state.
 */
export function ProgressionFallback({
  activeStage,
  onToggle,
}: {
  activeStage: number | null;
  onToggle: (index: number, open: boolean) => void;
}) {
  const refs = useRef<Array<HTMLDetailsElement | null>>([]);

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (el && el.open !== (activeStage === i)) el.open = activeStage === i;
    });
  }, [activeStage]);

  return (
    <ol className="divide-y divide-border border-y border-border">
      {about.progression.map((step, i) => (
        <li key={step.label}>
          <details
            ref={(el) => {
              refs.current[i] = el;
            }}
            onToggle={(e) => onToggle(i, e.currentTarget.open)}
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-baseline gap-4 py-6 marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="label">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-mono text-sm uppercase tracking-widest text-text">{step.label}</h3>
            </summary>
            <div className="prose-lab pb-6 pl-9 text-text-muted">
              <Fill value={step.body} as="p" />
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}
