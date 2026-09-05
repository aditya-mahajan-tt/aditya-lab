"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";

/**
 * Camera for the identity progression object (design spec §3.2). Same
 * hard-clamped pointer-parallax approach as three/systems/CameraController,
 * deliberately without its scroll-linked dolly: that exists to make the
 * hero recede as it leaves the viewport, which has no equivalent meaning
 * for a small object embedded mid-page on /about. This one just holds
 * still except for the pointer parallax.
 */
const BASE_Z = 5.2;
const MAX_OFFSET_X = 0.55;
const MAX_OFFSET_Y = 0.34;
const DAMPING = 2.4;

export function ProgressionCameraController() {
  useFrame((state, delta) => {
    const { camera, pointer } = state;
    const targetX = MathUtils.clamp(pointer.x, -1, 1) * MAX_OFFSET_X;
    const targetY = MathUtils.clamp(pointer.y, -1, 1) * MAX_OFFSET_Y;
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
