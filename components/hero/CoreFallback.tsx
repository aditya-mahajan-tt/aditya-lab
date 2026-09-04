const NODE_ANGLES_DEG = [-90, -18, 54, 126, 198];
const NODE_RING_RADIUS = 100;

/**
 * The permanent CSS/SVG hero visual (PLAN.md Phase 5) — not a placeholder
 * to be thrown away. Phase 8+ swaps in a 3D core only once WebGL is
 * confirmed available and the quality tier allows it; this is what every
 * other visitor sees, always. Rings, square nodes and straight connectors,
 * deliberately not a glowing sphere (PLAN.md Phase 9's "avoid" list —
 * same object, same rule, just without WebGL). Ambient rotation/pulse
 * animation lives in globals.css and is frozen by the sitewide
 * prefers-reduced-motion rule.
 */
export function CoreFallback() {
  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label="An animated composition of rings and connected nodes around a pulsing core — the site's computational core, in its non-3D form."
      className="mx-auto w-full max-w-[420px]"
    >
      <line x1="200" y1="20" x2="200" y2="380" stroke="var(--color-border)" strokeWidth="1" opacity="0.4" />
      <line x1="20" y1="200" x2="380" y2="200" stroke="var(--color-border)" strokeWidth="1" opacity="0.4" />
      <circle cx="200" cy="200" r="170" stroke="var(--color-border)" strokeWidth="1" fill="none" />
      <circle
        cx="200"
        cy="200"
        r="140"
        stroke="var(--color-border-strong)"
        strokeWidth="1"
        strokeDasharray="3 9"
        fill="none"
      />

      <g className="core-rotate">
        {NODE_ANGLES_DEG.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x = 200 + NODE_RING_RADIUS * Math.cos(rad);
          const y = 200 + NODE_RING_RADIUS * Math.sin(rad);
          return (
            <g key={angle}>
              <line x1="200" y1="200" x2={x} y2={y} stroke="var(--color-border)" strokeWidth="1" opacity="0.5" />
              <rect
                x={x - 5}
                y={y - 5}
                width="10"
                height="10"
                fill="var(--color-surface)"
                stroke="var(--color-accent-dim)"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </g>

      <g className="core-pulse">
        <rect x="185" y="185" width="30" height="30" fill="var(--color-accent)" transform="rotate(45 200 200)" />
      </g>
    </svg>
  );
}
