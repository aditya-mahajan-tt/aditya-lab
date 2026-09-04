"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import type { QualityTier } from "@/lib/quality";
import { createCoreMaterial } from "@/three/materials/CoreMaterial";
import { createGlassMaterial } from "@/three/materials/GlassMaterial";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";

/**
 * The computational core, Phase 8 form: the same object the DOM fallback
 * draws (components/hero/CoreFallback) — layered rings, a structural frame,
 * five nodes on connectors, an emissive core — rebuilt in three dimensions.
 *
 * Phase 9 turns this into the signature object: node illumination on hover,
 * expansion on click, and a scroll-linked camera dolly. This file is where
 * that work lands; nothing here is scaffolding to be thrown away.
 *
 * Triangle count is ~2.6k against a 60k HIGH budget. The object is made of
 * thin rings and flat facets on purpose — it is a machine, not a glowing
 * sphere (PLAN.md Phase 9's "avoid" list).
 */

/** Same five positions as the SVG core, so the cross-fade lands on itself. */
const NODE_ANGLES_DEG = [-90, -18, 54, 126, 198];
const NODE_RADIUS = 1.05;

/** MEDIUM halves the tubular segments; at this ring thickness it is invisible. */
const RING_SEGMENTS: Record<Exclude<QualityTier, "low">, number> = { high: 160, medium: 80 };

export function Core({ tier }: { tier: Exclude<QualityTier, "low"> }) {
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

  // Materials are created imperatively, so R3F will not dispose them.
  // Geometries below are declarative and are disposed for us.
  useEffect(() => {
    return () => {
      materials.core.dispose();
      materials.glass.dispose();
      materials.metal.dispose();
    };
  }, [materials]);

  const nodes = useMemo(
    () =>
      NODE_ANGLES_DEG.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return [Math.cos(rad) * NODE_RADIUS, 0, Math.sin(rad) * NODE_RADIUS] as const;
      }),
    [],
  );

  const connectors = useMemo(() => {
    const points = new Float32Array(nodes.length * 6);
    nodes.forEach(([x, y, z], i) => {
      points.set([0, 0, 0, x, y, z], i * 6);
    });
    return points;
  }, [nodes]);

  const ringsRef = useRef<Group>(null);
  const meridianRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const step = Math.min(delta, 1 / 30);

    if (ringsRef.current) {
      ringsRef.current.rotation.y += step * 0.14;
      ringsRef.current.rotation.x = Math.sin(t * 0.16) * 0.05;
    }

    // Counter-rotation keeps the silhouette reading as a mechanism rather
    // than a single spinning object.
    if (meridianRef.current) {
      meridianRef.current.rotation.z -= step * 0.08;
    }

    if (coreRef.current) {
      const material = coreRef.current.material as MeshStandardMaterial;
      material.emissiveIntensity = 1.35 + Math.sin(t * 1.6) * 0.45;
    }
  });

  return (
    // Scaled so the outer ring sits inside the 420px stage at the same
    // proportion the SVG's outer circle does — the two have to be the same
    // object at the same size for the cross-fade to land on itself.
    <group rotation={[0.24, 0, 0.08]} scale={0.78}>
      <group ref={ringsRef}>
        {/* Equatorial rings */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.metal}>
          <torusGeometry args={[1.9, 0.013, 3, segments]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.metal}>
          <torusGeometry args={[1.5, 0.009, 3, Math.round(segments * 0.75)]} />
        </mesh>

        {/* Nodes and their connectors back to the core */}
        {nodes.map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[0, (i * Math.PI) / 5, 0]} material={materials.metal}>
            <boxGeometry args={[0.075, 0.075, 0.075]} />
          </mesh>
        ))}

        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[connectors, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={tokens.border} transparent opacity={0.55} />
        </lineSegments>
      </group>

      <group ref={meridianRef}>
        <mesh material={materials.metal}>
          <torusGeometry args={[1.72, 0.009, 3, segments]} />
        </mesh>
      </group>

      {/* Structural frame. A detail-0 octahedron's wireframe is exactly its
          twelve edges — no EdgesGeometry, no second geometry to dispose. */}
      <mesh>
        <octahedronGeometry args={[1.34, 0]} />
        <meshBasicMaterial color={tokens.border} wireframe transparent opacity={0.45} />
      </mesh>

      {/* The shell is a housing, not a gem: it has to stay small enough that
          the surrounding mechanism still reads as the subject. */}
      <mesh material={materials.glass}>
        <octahedronGeometry args={[0.38, 0]} />
      </mesh>

      <mesh ref={coreRef} material={materials.core} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.22, 0]} />
      </mesh>
    </group>
  );
}
