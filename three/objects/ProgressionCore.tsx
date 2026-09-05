"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from "three";
import { about } from "@/data/about";
import type { QualityTier } from "@/lib/quality";
import { createCoreMaterial } from "@/three/materials/CoreMaterial";
import { createGlassMaterial } from "@/three/materials/GlassMaterial";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";
import { ProgressionNode } from "./ProgressionNode";

/**
 * The identity progression object (design spec §3.2) — echoes the hero
 * Core's visual grammar (rings, frame, housing) at the same scale, but each
 * of its 6 nodes maps to one data/about.ts progression stage and is
 * individually selectable, unlike Core's single shared expand toggle.
 * Lighter than Core (no meridian/tilt rings) — the selection state does the
 * work Core's expansion animation did there.
 */
const NODE_ANGLES_DEG = about.progression.map(
  (_, i) => -90 + (i * 360) / about.progression.length,
);
const MODULE_COUNT = 12;
const MODULE_RING_RADIUS = 1.9;
const RING_SEGMENTS: Record<Exclude<QualityTier, "low">, number> = { high: 160, medium: 80 };

type Props = {
  tier: Exclude<QualityTier, "low">;
  activeStage: number | null;
  onSelectStage: (index: number) => void;
  onHoverChange: (hovered: boolean) => void;
};

export function ProgressionCore({ tier, activeStage, onSelectStage, onHoverChange }: Props) {
  const tokens = useMemo(readTokens, []);
  const segments = RING_SEGMENTS[tier];

  const materials = useMemo(
    () => ({
      core: createCoreMaterial(tokens),
      glass: createGlassMaterial(tokens, tier),
      metal: createMetalMaterial(tokens),
    }),
    [tokens, tier],
  );

  useEffect(() => {
    return () => {
      materials.core.dispose();
      materials.glass.dispose();
      materials.metal.dispose();
    };
  }, [materials]);

  const directions = useMemo(
    () =>
      NODE_ANGLES_DEG.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return [Math.cos(rad), 0, Math.sin(rad)] as const;
      }),
    [],
  );

  const modules = useMemo(
    () =>
      Array.from({ length: MODULE_COUNT }, (_, i) => {
        const rad = (i / MODULE_COUNT) * Math.PI * 2;
        return {
          position: [Math.cos(rad) * MODULE_RING_RADIUS, 0, Math.sin(rad) * MODULE_RING_RADIUS] as const,
          rotation: [0, -rad, 0] as const,
        };
      }),
    [],
  );

  const hoverCount = useRef(0);
  const handleNodeHover = useCallback(
    (hovered: boolean) => {
      hoverCount.current = Math.max(0, hoverCount.current + (hovered ? 1 : -1));
      onHoverChange(hoverCount.current > 0);
    },
    [onHoverChange],
  );

  const rotationRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const step = Math.min(delta, 1 / 30);
    const anySelected = activeStage !== null;

    if (rotationRef.current) {
      rotationRef.current.rotation.y += step * 0.12;
      rotationRef.current.rotation.x = Math.sin(t * 0.16) * 0.05;
    }

    if (coreRef.current) {
      const material = coreRef.current.material as MeshStandardMaterial;
      const pulse = Math.sin(t * 1.6);
      const target = 1.1 + pulse * 0.45 + (anySelected ? 0.45 : 0);
      material.emissiveIntensity = MathUtils.damp(material.emissiveIntensity, target, 4.5, step);
      coreRef.current.scale.setScalar(1 + pulse * 0.06);
      coreRef.current.rotation.y += step * 0.2;
    }
  });

  return (
    <group rotation={[0.24, 0, 0.08]} scale={0.72}>
      <group ref={rotationRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.metal}>
          <torusGeometry args={[1.9, 0.02, 3, segments]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.metal}>
          <torusGeometry args={[1.5, 0.015, 3, Math.round(segments * 0.75)]} />
        </mesh>

        {modules.map((module, i) => (
          <mesh key={i} position={module.position} rotation={module.rotation} material={materials.metal}>
            <boxGeometry args={[0.05, 0.085, 0.13]} />
          </mesh>
        ))}

        {directions.map((direction, i) => (
          <ProgressionNode
            key={i}
            direction={direction}
            tokens={tokens}
            active={activeStage === i}
            onHoverChange={handleNodeHover}
            onSelect={() => onSelectStage(i)}
          />
        ))}
      </group>

      <mesh>
        <octahedronGeometry args={[1.34, 0]} />
        <meshBasicMaterial color={tokens.borderStrong} wireframe transparent opacity={0.65} toneMapped={false} />
      </mesh>

      <mesh material={materials.glass}>
        <octahedronGeometry args={[0.38, 0]} />
      </mesh>

      <mesh ref={coreRef} material={materials.core} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.22, 0]} />
      </mesh>
    </group>
  );
}
