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
 * The thinking framework as a static SVG loop (PLAN.md Phase 4) — not just a
 * sequence, since the last step feeds back into the first. Shown from the
 * `md` breakpoint up only: at 375px there isn't room for four legible
 * columns, and the ordered list below is the full text equivalent at every
 * size regardless (DESIGN_SYSTEM.md §9 — every diagram needs one).
 */
export function ThinkingFramework({ steps }: { steps: Array<{ label: string }> }) {
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

  return (
    <figure className="hidden md:block">
      <svg
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        role="img"
        aria-label={`The framework as a loop: ${steps.map((s) => s.label).join(" → ")} → back to ${first ? steps[0]?.label : ""}.`}
        className="w-full"
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

        {positions.map((pos, i) => {
          const step = steps[i];
          if (!step) return null;
          return (
            <g key={step.label}>
              <rect
                x={pos.x - NODE_W / 2}
                y={pos.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={4}
                fill="var(--color-surface)"
                stroke="var(--color-border)"
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
      <figcaption className="label mt-4">
        Iterate feeds back into {steps[0]?.label ?? "the start"} — this is a loop, not a line.
      </figcaption>
    </figure>
  );
}
