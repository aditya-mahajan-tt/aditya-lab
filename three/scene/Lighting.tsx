"use client";

import { useMemo } from "react";
import { readTokens } from "@/three/materials/tokens";

/**
 * Two lights, which is the whole budget (PLAN.md Phase 9). No shadow maps —
 * an extra depth pass per frame buys almost nothing on an object this size
 * floating in empty space, and it is the first thing that would break the
 * 30fps floor on the LOW tier.
 *
 * Everything else is the environment map (three/scene/Environment).
 */
export function Lighting() {
  const tokens = useMemo(readTokens, []);

  return (
    <>
      <ambientLight intensity={0.4} color={tokens.text} />
      <directionalLight position={[3.5, 4.5, 5]} intensity={1.15} color={tokens.text} />
    </>
  );
}
