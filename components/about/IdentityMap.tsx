"use client";

import { useId, useState } from "react";
import { about } from "@/data/about";
import { progressionIcons } from "@/components/icons/ProgressionIcons";
import { Fill } from "@/components/ui/Placeholder";
import { cn } from "@/lib/utils/cn";
import type { SkillGroup } from "@/data/schema";

/**
 * Which capability groups each identity stage cross-links to — a
 * categorisation of content that already exists (data/about.ts,
 * data/skills.ts), not new information. Keyed by stage label.
 */
const STAGE_CAPABILITY: Record<string, Array<SkillGroup["id"]>> = {
  CURIOUS: ["THINK"],
  BUILDER: ["BUILD"],
  MARKETER: ["GROW"],
  "PRODUCT THINKER": ["THINK", "BUILD"],
  "AI EXPLORER": ["INTELLIGENCE"],
  "STILL EXPERIMENTING": ["GROW"],
};

const ANGLES_DEG = [-90, -30, 30, 90, 150, 210];
const CENTER = 300;
const RADIUS = 235; // clear of the 92px hub and (at this card width) clear of neighbouring cards

function polar(deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CENTER + RADIUS * Math.cos(rad), y: CENTER + RADIUS * Math.sin(rad) };
}

/**
 * Desktop-only placement per stage, as a percentage of the same 600-unit
 * stage the SVG connector lines use (`polar()` above, at this exact
 * RADIUS) — a card's centre lands precisely on its connector's far
 * endpoint. These MUST be literal strings, not computed at runtime:
 * Tailwind's build only generates CSS for arbitrary-value classes it can
 * find as static text in the source — a template-string class name here
 * would silently produce no CSS at all, not a runtime-computed style.
 * (Recompute by hand from `polar()` if RADIUS or ANGLES_DEG ever changes.)
 * Tailwind arbitrary properties, `md:`-scoped: below `md` none of this
 * applies, `position` falls back to `static` and the card simply takes its
 * place in normal block flow.
 */
const NODE_POS_CLASS = [
  "md:left-1/2 md:top-[10.8%] md:-translate-x-1/2 md:-translate-y-1/2", // -90deg
  "md:left-[83.9%] md:top-[30.4%] md:-translate-x-1/2 md:-translate-y-1/2", // -30deg
  "md:left-[83.9%] md:top-[69.6%] md:-translate-x-1/2 md:-translate-y-1/2", // 30deg
  "md:left-1/2 md:top-[89.2%] md:-translate-x-1/2 md:-translate-y-1/2", // 90deg
  "md:left-[16.1%] md:top-[69.6%] md:-translate-x-1/2 md:-translate-y-1/2", // 150deg
  "md:left-[16.1%] md:top-[30.4%] md:-translate-x-1/2 md:-translate-y-1/2", // 210deg
];

/**
 * The identity mind map (design spec revision, 2026-09-05) — a 2D hub-and-
 * spoke, not a 3D object: every stage is a fully readable card at rest, all
 * six visible together, connected to a central "ADITYA" hub. Hover/focus
 * lights the matching connector as a purely decorative enhancement — no
 * content is gated behind it, so a mouse-less or JS-off visitor loses
 * nothing.
 *
 * One set of six cards, not two: below `md` they're `position:static` and
 * stack as a plain list (the SVG hub/rings/connectors are hidden entirely —
 * pure decoration, no text, so hiding them loses nothing); at `md`+ the same
 * elements become `position:absolute` and take their radial spot. Each
 * card's inner layout (icon+index row, then title, body, tags) is identical
 * at both sizes — only the card's own position/sizing responds to `md:`. An
 * earlier draft rendered two separate copies instead, which put duplicate
 * ids and duplicate text in the DOM at once — invalid HTML, and it broke
 * anchor links and locator-based tests alike.
 */
export function IdentityMap() {
  const [active, setActive] = useState<number | null>(null);
  const glowId = useId();
  const glowFillId = useId();

  return (
    <div className="relative mx-auto mt-4 md:aspect-square md:w-full md:max-w-[680px]">
      <svg
        viewBox="0 0 600 600"
        aria-hidden="true"
        className="absolute inset-0 hidden h-full w-full overflow-visible md:block"
      >
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id={glowFillId} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="var(--color-accent-dim)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-surface)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className="map-ring-rotate">
          <circle cx={CENTER} cy={CENTER} r={160} fill="none" stroke="var(--color-border)" strokeWidth={1} />
        </g>
        <g className="map-ring-rotate-reverse">
          <circle
            cx={CENTER}
            cy={CENTER}
            r={128}
            fill="none"
            stroke="var(--color-border-strong)"
            strokeWidth={1}
            strokeDasharray="2 7"
          />
        </g>
        <circle cx={CENTER} cy={CENTER} r={100} fill={`url(#${glowFillId})`} />

        {ANGLES_DEG.map((deg, i) => {
          const { x, y } = polar(deg);
          const isActive = active === i;
          return (
            <line
              key={i}
              data-testid={`identity-connector-${i}`}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke={isActive ? "var(--color-accent)" : "var(--color-border-strong)"}
              strokeWidth={isActive ? 2 : 1.4}
              filter={isActive ? `url(#${glowId})` : undefined}
              className="transition-[stroke,stroke-width] duration-[var(--duration-medium)] ease-[var(--ease-out-lab)]"
            />
          );
        })}
      </svg>

      <div className="absolute left-1/2 top-1/2 hidden h-[92px] w-[92px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-accent-dim bg-surface-raised text-center map-hub-pulse md:flex">
        <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-accent">System online</span>
        <span className="mt-1 font-mono text-sm font-semibold text-text">ADITYA</span>
      </div>

      <ol className="divide-y divide-border border-y border-border md:divide-y-0 md:border-none">
        {about.progression.map((step, i) => {
          const Icon = progressionIcons[i];
          const posClass = NODE_POS_CLASS[i];
          if (!Icon || !posClass) return null;
          const isActive = active === i;
          const tags = STAGE_CAPABILITY[step.label] ?? [];
          return (
            <li
              key={step.label}
              data-testid={`identity-stage-${i}`}
              tabIndex={0}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive((a) => (a === i ? null : a))}
              onFocus={() => setActive(i)}
              onBlur={() => setActive((a) => (a === i ? null : a))}
              className={cn(
                "flex flex-col gap-1.5 py-5 transition-colors duration-[var(--duration-medium)] ease-[var(--ease-out-lab)] focus:outline-none",
                "md:absolute md:w-[188px] md:rounded-sm md:border md:bg-surface md:p-4 md:py-4 md:shadow-[0_10px_24px_-16px_rgba(0,0,0,0.7)] md:focus-visible:ring-1 md:focus-visible:ring-accent",
                isActive ? "md:border-accent-dim" : "md:border-border",
                posClass,
              )}
            >
              <div className="flex items-center justify-between">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-[var(--duration-medium)]",
                    isActive ? "text-accent" : "text-text-faint",
                  )}
                />
                <span className="label rounded-full border border-border-strong px-2 py-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3
                className={cn(
                  "font-mono text-xs font-semibold uppercase tracking-widest transition-colors duration-[var(--duration-medium)]",
                  isActive ? "text-accent" : "text-text",
                )}
              >
                {step.label}
              </h3>
              <p className="prose-lab text-sm leading-relaxed text-text-muted md:text-[12.5px]">
                <Fill value={step.body} />
              </p>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="label rounded-full border border-border px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
