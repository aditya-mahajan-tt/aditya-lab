/**
 * The 3D layer reads its palette out of the CSS custom properties in
 * globals.css rather than repeating hex values here. DESIGN_SYSTEM.md is the
 * single source of truth for colour; a second copy in TypeScript would drift
 * the first time the accent is nudged.
 *
 * The literals below are a last-resort fallback for a non-browser context,
 * not a parallel palette.
 */

const FALLBACK = {
  bg: "#070809",
  surface: "#111416",
  surfaceRaised: "#1b1f21",
  border: "#252a2c",
  borderStrong: "#3b4145",
  text: "#e9eceb",
  accent: "#b6ff4a",
  accentDim: "#77bd0f",
} as const;

export type LabTokens = { -readonly [K in keyof typeof FALLBACK]: string };

const CSS_VAR: Record<keyof LabTokens, string> = {
  bg: "--color-bg",
  surface: "--color-surface",
  surfaceRaised: "--color-surface-raised",
  border: "--color-border",
  borderStrong: "--color-border-strong",
  text: "--color-text",
  accent: "--color-accent",
  accentDim: "--color-accent-dim",
};

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * THREE.Color only parses a subset of CSS colour syntax, so anything that
 * is not plain hex falls back rather than throwing inside a material
 * constructor.
 */
export function readTokens(): LabTokens {
  if (typeof window === "undefined") return { ...FALLBACK };

  const computed = getComputedStyle(document.documentElement);
  const tokens = { ...FALLBACK } as LabTokens;

  for (const key of Object.keys(CSS_VAR) as Array<keyof LabTokens>) {
    const value = computed.getPropertyValue(CSS_VAR[key]).trim();
    if (HEX.test(value)) tokens[key] = value;
  }

  return tokens;
}
