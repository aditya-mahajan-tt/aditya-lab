import Link from "next/link";
import type { PlaneValue } from "@/data/schema";
import { HERO_PLANES, type HeroBody } from "@/data/queries";
import { HERO_PLANE_CENTER_DEG, degToXY, layoutBodyAngles } from "@/lib/heroOrbitalLayout";

const INNER_RADIUS = 95;
const OUTER_RADIUS = 155;
const PLANE_ARC_DEG = 100;
/**
 * Side length (viewBox units) of each body's invisible hit-target square.
 * The `<svg>` renders at up to 420px wide over a 400-unit viewBox — close
 * to 1:1 — but shrinks below that on narrow phones; 70 units clears the
 * 44px CLAUDE.md §4 minimum with margin even at the smallest supported
 * width (375px viewport, further reduced by layout padding).
 */
const HIT_TARGET_SIZE = 70;
const PLANE_LABEL: Record<PlaneValue, string> = { ai: "AI", product: "PRODUCT", business: "BUSINESS" };
const PLANE_DASH: Record<PlaneValue, string> = { ai: "none", product: "2 6", business: "5 3" };

type Props = {
  suppressed?: boolean;
  bodies: HeroBody[];
  /** When set (mobile tabs, Task 6), only this plane's bodies render at full weight. `null` = desktop, show every plane. */
  activePlane?: PlaneValue | null;
  activeBodyId: string | null;
  onBodyHover: (id: string | null) => void;
};

/**
 * The permanent CSS/SVG hero visual (PLAN.md Phase 5), rewritten for the
 * orbital hero (docs/superpowers/specs/2026-09-06-mobile-audit-and-
 * orbital-hero-design.md §3.6, layer 1). Three planes, two ring depths,
 * every body a real `<a>` — not decoration.
 *
 * Accessibility note: `aria-hidden` here is tied to `suppressed`, not
 * hardcoded. While this layer is the visible surface (`suppressed=false`)
 * its bodies are real, focusable links with their own accessible names —
 * axe's `aria-hidden-focus` rule (WCAG 4.1.2) correctly flags a hardcoded
 * `aria-hidden="true"` wrapping focusable descendants as a serious
 * violation, since a keyboard/screen-reader user could tab onto a link the
 * accessibility tree says doesn't exist. Once the 3D core
 * (components/hero/CoreStage) is drawing real frames on top of it,
 * `suppressed` fades this to opacity 0 *and* hides+untabs it — it stays in
 * the document (so the fade can run and so this remains a real fallback
 * the moment the 3D layer drops out again), but at that point it is
 * `layer-0/OrbitalBodyList` (always in the DOM, never suppressed) that is
 * the accessible representation, not this. `role="img"` is deliberately
 * never applied: it asserts no interactive descendant, which this — a
 * diagram made *of* links — always violates.
 */
export function CoreFallback({ suppressed = false, bodies, activePlane = null, activeBodyId, onBodyHover }: Props) {
  const angles = layoutBodyAngles(bodies);
  const angleById = new Map(angles.map((a) => [a.id, a]));

  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden={suppressed}
      className="core-dom mx-auto w-full max-w-[420px]"
      data-suppressed={suppressed}
    >
      {HERO_PLANES.map((plane) => {
        const center = HERO_PLANE_CENTER_DEG[plane];
        const start = degToXY(center - PLANE_ARC_DEG / 2, OUTER_RADIUS + 18);
        const end = degToXY(center + PLANE_ARC_DEG / 2, OUTER_RADIUS + 18);
        const label = degToXY(center, OUTER_RADIUS + 34);
        const dimmed = activePlane !== null && activePlane !== plane;
        return (
          <g
            key={plane}
            aria-hidden="true"
            opacity={dimmed ? 0.35 : 1}
            className="transition-opacity duration-[var(--duration-base)]"
          >
            <path
              d={`M ${200 + start.x} ${200 + start.y} A ${OUTER_RADIUS + 18} ${OUTER_RADIUS + 18} 0 0 1 ${200 + end.x} ${200 + end.y}`}
              fill="none"
              stroke="var(--color-border-strong)"
              strokeWidth="1"
              strokeDasharray={PLANE_DASH[plane]}
            />
            <text
              x={200 + label.x}
              y={200 + label.y}
              textAnchor="middle"
              className="fill-text-faint font-mono text-[10px] uppercase tracking-[0.2em]"
            >
              {PLANE_LABEL[plane]}
            </text>
          </g>
        );
      })}

      <circle cx="200" cy="200" r={OUTER_RADIUS} stroke="var(--color-border)" strokeWidth="1" fill="none" opacity="0.4" />
      <circle cx="200" cy="200" r={INNER_RADIUS} stroke="var(--color-border)" strokeWidth="1" fill="none" opacity="0.4" />

      <g className="core-rotate">
        {bodies.map((body) => {
          const angle = angleById.get(body.id);
          if (!angle) return null;
          const radius = body.ring === "inner" ? INNER_RADIUS : OUTER_RADIUS;
          const { x, y } = degToXY(angle.deg, radius);
          const active = activeBodyId === body.id;
          const dimmed = activePlane !== null && !body.planes.includes(activePlane);
          const size = angle.spanning ? 14 : 10;

          return (
            <Link
              key={body.id}
              href={body.href}
              aria-label={`${body.label}${angle.spanning ? " (spans multiple planes)" : ""}`}
              onMouseEnter={() => onBodyHover(body.id)}
              onMouseLeave={() => onBodyHover(null)}
              onFocus={() => onBodyHover(body.id)}
              onBlur={() => onBodyHover(null)}
              onClick={() => onBodyHover(body.id)}
              tabIndex={dimmed || suppressed ? -1 : 0}
            >
              <g opacity={dimmed ? 0.3 : 1} className="transition-opacity duration-[var(--duration-base)]">
                <line
                  x1="200"
                  y1="200"
                  x2={200 + x}
                  y2={200 + y}
                  stroke="var(--color-border)"
                  strokeWidth="1"
                  opacity="0.5"
                />
                {/* Invisible hit-target, centered on the body: the visible marker
                    alone (10-14 viewBox units) plus the thin connector line can
                    produce an `<a>` bounding box under 44px in one dimension at
                    small viewports, regressing the 44px minimum tap target
                    CLAUDE.md §4 requires (e2e/mobile-audit.spec.ts "no
                    interactive element renders under 44px..."). `fill="transparent"`
                    (not "none") so it still participates in SVG hit-testing. */}
                <rect
                  x={200 + x - HIT_TARGET_SIZE / 2}
                  y={200 + y - HIT_TARGET_SIZE / 2}
                  width={HIT_TARGET_SIZE}
                  height={HIT_TARGET_SIZE}
                  fill="transparent"
                />
                <rect
                  x={200 + x - size / 2}
                  y={200 + y - size / 2}
                  width={size}
                  height={size}
                  fill={active ? "var(--color-accent)" : "var(--color-surface)"}
                  stroke={active ? "var(--color-accent)" : "var(--color-accent-dim)"}
                  strokeWidth="1.5"
                />
              </g>
            </Link>
          );
        })}
      </g>

      <g className="core-pulse">
        <rect x="185" y="185" width="30" height="30" fill="var(--color-accent)" transform="rotate(45 200 200)" />
      </g>
    </svg>
  );
}
