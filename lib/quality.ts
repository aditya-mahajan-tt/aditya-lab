/**
 * Capability detection and quality resolution for the 3D layer (PLAN.md
 * Phase 8).
 *
 * This lives in `lib/`, not `three/`, deliberately: it is the module that
 * decides *whether* the Three.js chunk gets downloaded at all, so it must
 * contain zero Three.js imports and be safe in the initial bundle.
 * `three/systems/PerformanceManager` consumes its output on the far side of
 * the dynamic import and handles runtime adaptation from there.
 */

export type QualityTier = "high" | "medium" | "low";

/** Matches the persisted `quality` value in lib/store.ts. */
export type QualityPreference = "auto" | QualityTier;

/**
 * Why the DOM core is showing instead of the 3D one. Sent to analytics as
 * `webgl_fallback { reason }` (QA_AND_PERFORMANCE.md §8) — a fixed set of
 * machine-readable values, never a renderer string (that is a fingerprinting
 * surface and we do not send it anywhere).
 */
export type FallbackReason =
  | "no-webgl"
  | "reduced-motion"
  | "save-data"
  | "slow-connection"
  | "software-renderer"
  | "low-power"
  | "user-preference"
  | "context-lost"
  | "runtime-error"
  | "sustained-low-fps";

export type Capability = {
  /** Whether a WebGL context can be created at all. */
  webgl: boolean;
  /** Auto-resolved tier, before any user override is applied. */
  tier: QualityTier;
  /** Null when nothing stands in the way of rendering at `tier`. */
  reason: FallbackReason | null;
};

/**
 * Vetoes a user cannot override with the quality control. Three of them are
 * stated user intent (an OS accessibility setting, a data-saver switch, a
 * connection that cannot afford the chunk); the fourth is physics.
 */
const HARD_VETOES: readonly FallbackReason[] = ["no-webgl", "reduced-motion", "save-data", "slow-connection"];

/** Renderers that report WebGL support but rasterise on the CPU. */
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;

const DPR_BY_TIER: Record<QualityTier, [number, number]> = {
  high: [1, 2],
  medium: [1, 1.5],
  low: [1, 1],
};

/** Device-pixel-ratio clamp for a tier. The single biggest fill-rate lever. */
export function dprFor(tier: QualityTier): [number, number] {
  return DPR_BY_TIER[tier];
}

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
  getBattery?: () => Promise<{ charging: boolean; level: number }>;
};

/**
 * Creates a throwaway context, reads the renderer string, then releases it
 * immediately — browsers cap simultaneous WebGL contexts (~16 in Chrome, far
 * fewer in Safari) and a leaked probe context would starve the real one.
 */
function probeWebGL(): { ok: boolean; software: boolean } {
  if (typeof document === "undefined") return { ok: false, software: false };

  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return { ok: false, software: false };

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? "") : "";

    gl.getExtension("WEBGL_lose_context")?.loseContext();

    return { ok: true, software: SOFTWARE_RENDERER.test(renderer) };
  } catch {
    return { ok: false, software: false };
  }
}

/**
 * Resolves what this device can afford. Async solely because the Battery
 * Status API is — everything else is synchronous.
 */
export async function detectCapability(): Promise<Capability> {
  if (typeof window === "undefined") {
    return { webgl: false, tier: "low", reason: "no-webgl" };
  }

  const probe = probeWebGL();
  if (!probe.ok) return { webgl: false, tier: "low", reason: "no-webgl" };

  const veto = (reason: FallbackReason): Capability => ({ webgl: true, tier: "low", reason });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return veto("reduced-motion");

  const nav = navigator as NavigatorWithHints;
  if (nav.connection?.saveData) return veto("save-data");
  if (nav.connection?.effectiveType && /^(slow-)?2g$/.test(nav.connection.effectiveType)) {
    return veto("slow-connection");
  }

  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  if (memory <= 2 || cores <= 2) return veto("low-power");

  // Soft vetoes below this line: the auto tier declines, but an explicit
  // HIGH/MEDIUM from the quality control still renders. That is what makes
  // the 3D path reachable in headless Chromium, which is all SwiftShader.
  if (probe.software) return { webgl: true, tier: "low", reason: "software-renderer" };

  let tier: QualityTier = "high";
  if (memory <= 4 || cores <= 4) tier = "medium";
  if (window.matchMedia("(pointer: coarse)").matches) tier = "medium";
  if (window.innerWidth < 768) tier = "medium";

  if (nav.getBattery) {
    try {
      const battery = await nav.getBattery();
      if (!battery.charging && battery.level <= 0.2) tier = tier === "high" ? "medium" : "low";
    } catch {
      // The API is gated or absent — no signal, no change.
    }
  }

  return tier === "low"
    ? { webgl: true, tier, reason: "low-power" }
    : { webgl: true, tier, reason: null };
}

/**
 * Folds the detected capability together with the user's persisted
 * preference. `null` means "render the DOM core" — the honest default, not
 * an error state.
 */
export function resolveTier(
  capability: Capability,
  preference: QualityPreference,
): { tier: QualityTier | null; reason: FallbackReason | null } {
  if (capability.reason && HARD_VETOES.includes(capability.reason)) {
    return { tier: null, reason: capability.reason };
  }

  // LOW is a real choice, not a degraded one: it means "give me the static
  // core" (PLAN.md Phase 9 budget line).
  if (preference === "low") return { tier: null, reason: "user-preference" };

  if (preference !== "auto") return { tier: preference, reason: null };

  return capability.tier === "low"
    ? { tier: null, reason: capability.reason ?? "low-power" }
    : { tier: capability.tier, reason: null };
}
