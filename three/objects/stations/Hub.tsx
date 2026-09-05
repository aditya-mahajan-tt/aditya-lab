import { useMemo } from "react";
import type { QualityTier } from "@/lib/quality";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";

/**
 * The Lab floor's centre (PLAN.md Phase 13) — a flat pedestal the six
 * stations ring around. Deliberately a plain disc and a single thin
 * outline, not the hero Core's layered rings and machined-module frame:
 * that grammar is reserved for the hero object (see the /about mind map
 * rebuild — reusing it elsewhere read as "the same 3D thing again").
 */
const RING_SEGMENTS: Record<Exclude<QualityTier, "low">, number> = { high: 96, medium: 48 };

export function Hub({ tier }: { tier: Exclude<QualityTier, "low"> }) {
  const tokens = useMemo(readTokens, []);
  const material = useMemo(() => createMetalMaterial(tokens), [tokens]);
  const segments = RING_SEGMENTS[tier];

  return (
    <group>
      {/* cylinderGeometry's flat caps already sit perpendicular to Y — no
          rotation needed to lie flat. (ringGeometry is the opposite: it
          defaults to the XY plane, so it does need the tilt.) An earlier
          version rotated both the same way, which stood the disc up on its
          edge like a wall instead of a pedestal. */}
      <mesh material={material}>
        <cylinderGeometry args={[0.6, 0.66, 0.05, segments]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.58, 0.6, segments]} />
        <meshBasicMaterial color={tokens.accentDim} toneMapped={false} />
      </mesh>
    </group>
  );
}
