"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import type { StationId } from "@/data/stations";

/**
 * The Lab environment's camera (PLAN.md Phase 13 — "scroll- and click-driven
 * camera transitions with hard bounds"). Orbits a fixed radius around the
 * hub; scroll progress through the sticky section (lib/utils/
 * useSectionScrollProgress) maps to azimuth across a bounded 300° sweep, the
 * same "scroll is an input to a clamp, never in control" contract as the
 * hero's CameraController. Clicking a station overrides the scroll-driven
 * azimuth and dollies in until the visitor scrolls again or clears focus.
 *
 * The 300° sweep (not a full 360°) means azimuth never needs to wrap — every
 * angle used here is a plain, unwrapped degree value, so MathUtils.damp
 * never has to reason about which way is "shorter" around the circle.
 */
const START_DEG = -240;
const SWEEP_DEG = 300;
const CAM_RADIUS = 5.4;
const FOCUS_RADIUS = 4.3;
const CAM_HEIGHT = 1.5;
const LOOK_HEIGHT = 0.32;
const DAMPING = 3.4;

export function stationAngleDeg(order: number, count: number): number {
  return START_DEG + (SWEEP_DEG / (count - 1)) * order;
}

type Props = {
  progressRef: RefObject<number>;
  angles: Record<StationId, number>;
  focusedId: StationId | null;
};

export function OrbitalCameraController({ progressRef, angles, focusedId }: Props) {
  const azimuth = useRef(START_DEG);
  const radius = useRef(CAM_RADIUS);

  useFrame((state, delta) => {
    const step = Math.min(delta, 1 / 30);

    const targetAzimuth = focusedId
      ? angles[focusedId]
      : START_DEG + progressRef.current * SWEEP_DEG;
    const targetRadius = focusedId ? FOCUS_RADIUS : CAM_RADIUS;

    azimuth.current = MathUtils.damp(azimuth.current, targetAzimuth, DAMPING, step);
    radius.current = MathUtils.damp(radius.current, targetRadius, DAMPING, step);

    azimuth.current = MathUtils.clamp(azimuth.current, START_DEG, START_DEG + SWEEP_DEG);
    radius.current = MathUtils.clamp(radius.current, FOCUS_RADIUS, CAM_RADIUS);

    const rad = (azimuth.current * Math.PI) / 180;
    state.camera.position.set(Math.cos(rad) * radius.current, CAM_HEIGHT, Math.sin(rad) * radius.current);
    state.camera.lookAt(0, LOOK_HEIGHT, 0);
  });

  return null;
}
