"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";

/**
 * The camera controller (PLAN.md Phase 8). Hard clamps, no free orbit.
 *
 * OrbitControls is deliberately not used: it lets a visitor fly the camera
 * inside the object, lose the subject entirely, and — worse — it swallows
 * wheel events, which is scroll hijacking by another name (CLAUDE.md §9).
 * What is left is pointer parallax within a fixed box, critically damped so
 * it never overshoots and never keeps moving after the pointer stops.
 *
 * The pointer is only ever an *input to a clamp*. The camera cannot leave
 * this volume regardless of what the pointer does.
 */
const BASE_Z = 5.2;
const MAX_OFFSET_X = 0.55;
const MAX_OFFSET_Y = 0.34;

/** Higher = snappier. Frame-rate independent via MathUtils.damp. */
const DAMPING = 2.4;

export function CameraController() {
  useFrame((state, delta) => {
    const { camera, pointer } = state;

    // pointer is already normalised to -1..1 over the canvas.
    const targetX = MathUtils.clamp(pointer.x, -1, 1) * MAX_OFFSET_X;
    const targetY = MathUtils.clamp(pointer.y, -1, 1) * MAX_OFFSET_Y;

    // `delta` is capped because a backgrounded tab can hand back a delta of
    // several seconds on its first frame, which would snap the camera.
    const step = Math.min(delta, 1 / 30);

    camera.position.x = MathUtils.damp(camera.position.x, targetX, DAMPING, step);
    camera.position.y = MathUtils.damp(camera.position.y, targetY, DAMPING, step);
    camera.position.z = BASE_Z;

    camera.position.x = MathUtils.clamp(camera.position.x, -MAX_OFFSET_X, MAX_OFFSET_X);
    camera.position.y = MathUtils.clamp(camera.position.y, -MAX_OFFSET_Y, MAX_OFFSET_Y);

    camera.lookAt(0, 0, 0);
  });

  return null;
}
