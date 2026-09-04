/**
 * Motion tokens — the ONLY durations and easings permitted in the codebase.
 * Mirrors the CSS custom properties in app/globals.css.
 * See DESIGN_SYSTEM.md §5.
 */

export const duration = {
  instant: 0.1,
  fast: 0.2,
  medium: 0.4,
  slow: 0.7,
  cinema: 1.2,
} as const;

export const ease = {
  out: "cubic-bezier(0.16, 1, 0.3, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

/** Stagger between siblings. Never stagger more than 8 items. */
export const stagger = {
  tight: 0.04,
  normal: 0.06,
  loose: 0.08,
} as const;

export const MAX_STAGGER_ITEMS = 8;

/** True when the visitor has asked for reduced motion. Safe on the server. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
