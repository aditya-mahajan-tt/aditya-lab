"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import type { StationId } from "@/data/stations";
import { ORBIT_START_DEG, ORBIT_SWEEP_DEG } from "@/lib/stationLayout";

/**
 * The Lab environment's camera (PLAN.md Phase 13 — "scroll- and click-driven
 * camera transitions with hard bounds"). Orbits a fixed radius around the
 * hub; progress (lib/utils/useWheelOrbitProgress — the stage's own wheel
 * capture, not the page's scroll) maps to azimuth across a bounded 300°
 * sweep, the same "scroll is an input to a clamp, never in control" contract
 * as the hero's CameraController. Clicking a station, or the prev/next
 * controls, overrides the progress-driven azimuth and dollies in until the
 * visitor scrolls the stage again or clears focus.
 *
 * The 300° sweep (not a full 360°) means azimuth never needs to wrap — every
 * angle used here is a plain, unwrapped degree value, so MathUtils.damp
 * never has to reason about which way is "shorter" around the circle.
 *
 * The sweep bounds and the per-station angle formula live in
 * lib/stationLayout, not here — components/lab/LabEnvironmentStage needs the
 * same math for its prev/next buttons, and that component is in the initial
 * bundle, so the shared math has to stay free of Three.js imports.
 */
const CAM_RADIUS = 5.4;
const FOCUS_RADIUS = 4.3;
const CAM_HEIGHT = 1.5;
const LOOK_HEIGHT = 0.32;
const DAMPING = 3.4;

type Props = {
  progressRef: RefObject<number>;
  angles: Record<StationId, number>;
  focusedId: StationId | null;
};

export function OrbitalCameraController({ progressRef, angles, focusedId }: Props) {
  const azimuth = useRef(ORBIT_START_DEG);
  const radius = useRef(CAM_RADIUS);

  useFrame((state, delta) => {
    const step = Math.min(delta, 1 / 30);

    const targetAzimuth = focusedId
      ? angles[focusedId]
      : ORBIT_START_DEG + progressRef.current * ORBIT_SWEEP_DEG;
    const targetRadius = focusedId ? FOCUS_RADIUS : CAM_RADIUS;

    azimuth.current = MathUtils.damp(azimuth.current, targetAzimuth, DAMPING, step);
    radius.current = MathUtils.damp(radius.current, targetRadius, DAMPING, step);

    azimuth.current = MathUtils.clamp(azimuth.current, ORBIT_START_DEG, ORBIT_START_DEG + ORBIT_SWEEP_DEG);
    radius.current = MathUtils.clamp(radius.current, FOCUS_RADIUS, CAM_RADIUS);

    const rad = (azimuth.current * Math.PI) / 180;
    state.camera.position.set(Math.cos(rad) * radius.current, CAM_HEIGHT, Math.sin(rad) * radius.current);
    state.camera.lookAt(0, LOOK_HEIGHT, 0);
  });

  return null;
}
