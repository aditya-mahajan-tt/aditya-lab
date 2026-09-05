/**
 * Pure orbit math for the Lab environment (PLAN.md Phase 13), shared by
 * three/systems/OrbitalCameraController (inside the dynamically-imported 3D
 * chunk) and components/lab/LabEnvironmentStage (in the initial bundle,
 * driving the prev/next controls). Living here instead of in `three/`
 * mirrors why lib/quality.ts isn't in `three/` either: this file must stay
 * free of Three.js imports so the stage's arrow buttons don't drag the 3D
 * chunk into the homepage's first load.
 *
 * The sweep is 300°, not a full 360° — azimuth never has to wrap, which is
 * what lets three/systems/OrbitalCameraController damp it as a plain,
 * unwrapped degree value.
 */
export const ORBIT_START_DEG = -240;
export const ORBIT_SWEEP_DEG = 300;

export function stationAngleDeg(order: number, count: number): number {
  return ORBIT_START_DEG + (ORBIT_SWEEP_DEG / (count - 1)) * order;
}

/** The progress (0-1) value whose azimuth equals `stationAngleDeg(order, count)`. */
export function stationProgress(order: number, count: number): number {
  return order / (count - 1);
}
