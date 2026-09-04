"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from "three";
import type { QualityTier } from "@/lib/quality";
import { createCoreMaterial } from "@/three/materials/CoreMaterial";
import { createGlassMaterial } from "@/three/materials/GlassMaterial";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";
import { CoreNode } from "./CoreNode";

/**
 * The computational core (PLAN.md Phase 9) — the same object the DOM
 * fallback draws (components/hero/CoreFallback), built as a machine:
 * layered rings carrying modules, a structural frame, five data nodes on
 * connectors, and a slow-pulsing energy core inside a housing.
 *
 * Deliberately not a glowing sphere, a brain or a crypto cube: every part
 * is a flat facet, a thin ring or a machined block, and the silhouette is
 * built from counter-rotating layers so it reads as a mechanism.
 *
 * Interactions here are response, never information. Hovering lights a
 * node; clicking expands the assembly. Neither reveals anything that is
 * not already in the DOM, which is what lets the canvas stay `aria-hidden`
 * (CLAUDE.md §3.5).
 *
 * ~4.6k triangles against a 60k HIGH budget / 20k MEDIUM.
 */

/** Same five positions as the SVG core, so the cross-fade lands on itself. */
const NODE_ANGLES_DEG = [-90, -18, 54, 126, 198];

/** Machined blocks riding the outer ring — the "modular" in modular machine. */
const MODULE_COUNT = 12;
const MODULE_RING_RADIUS = 1.9;

const RING_SEGMENTS: Record<Exclude<QualityTier, "low">, number> = { high: 160, medium: 80 };

/** How fast expansion settles. Frame-rate independent via MathUtils.damp. */
const EXPANSION_DAMPING = 4.5;

export function Core({ tier, onHoverChange }: { tier: Exclude<QualityTier, "low">; onHoverChange: (hovered: boolean) => void }) {
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

  /**
   * Hover is tracked as a count, not a boolean: moving between two adjacent
   * nodes fires the new node's `over` before the old one's `out`, and a
   * boolean would flicker the cursor off and on.
   */
  const hoverCount = useRef(0);
  const handleNodeHover = useCallback(
    (hovered: boolean) => {
      hoverCount.current = Math.max(0, hoverCount.current + (hovered ? 1 : -1));
      onHoverChange(hoverCount.current > 0);
    },
    [onHoverChange],
  );

  const [expanded, setExpanded] = useState(false);
  const expansion = useRef(0);
  const toggle = useCallback(() => setExpanded((value) => !value), []);

  const rotationRef = useRef<Group>(null);
  const ringScaleRef = useRef<Group>(null);
  const meridianRef = useRef<Group>(null);
  const tiltRef = useRef<Group>(null);
  const frameRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const step = Math.min(delta, 1 / 30);

    expansion.current = MathUtils.damp(expansion.current, expanded ? 1 : 0, EXPANSION_DAMPING, step);
    const e = expansion.current;

    if (rotationRef.current) {
      // Expanded, the machine spins up slightly — the response to a click
      // has to be legible in motion, not only in position.
      rotationRef.current.rotation.y += step * (0.14 + e * 0.16);
      rotationRef.current.rotation.x = Math.sin(t * 0.16) * 0.05;
    }

    if (ringScaleRef.current) ringScaleRef.current.scale.setScalar(1 + e * 0.07);
    if (tiltRef.current) {
      tiltRef.current.rotation.y += step * 0.06;
      tiltRef.current.scale.setScalar(1 + e * 0.1);
    }
    if (meridianRef.current) {
      meridianRef.current.rotation.z -= step * (0.08 + e * 0.1);
      meridianRef.current.scale.setScalar(1 + e * 0.09);
    }
    if (frameRef.current) frameRef.current.scale.setScalar(1 + e * 0.12);

    if (coreRef.current) {
      const material = coreRef.current.material as MeshStandardMaterial;
      // Kept deliberately low: past roughly 2.0 the octahedron stops reading
      // as a faceted machine part and becomes the glowing orb PLAN.md Phase
      // 9 explicitly rules out.
      material.emissiveIntensity = 1.1 + Math.sin(t * 1.6) * 0.35 + e * 0.45;
      coreRef.current.rotation.y += step * (0.2 + e * 0.5);
    }
  });

  // The housing is the other place the object accepts a click, so it gets
  // the same hover treatment as a node — an affordance the cursor can read.
  const selectHandlers = {
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      toggle();
    },
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      handleNodeHover(true);
    },
    onPointerOut: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      handleNodeHover(false);
    },
  };

  return (
    // Scaled so the outer ring sits inside the 420px stage at the same
    // proportion the SVG's outer circle does — the two have to be the same
    // object at the same size for the cross-fade to land on itself.
    <group rotation={[0.24, 0, 0.08]} scale={0.72}>
      <group ref={rotationRef}>
        <group ref={ringScaleRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.metal}>
            <torusGeometry args={[1.9, 0.013, 3, segments]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.metal}>
            <torusGeometry args={[1.5, 0.009, 3, Math.round(segments * 0.75)]} />
          </mesh>

          {modules.map((module, i) => (
            <mesh key={i} position={module.position} rotation={module.rotation} material={materials.metal}>
              <boxGeometry args={[0.05, 0.085, 0.13]} />
            </mesh>
          ))}
        </group>

        {directions.map((direction, i) => (
          <CoreNode
            key={i}
            direction={direction}
            tokens={tokens}
            expansion={expansion}
            onHoverChange={handleNodeHover}
            onSelect={toggle}
          />
        ))}
      </group>

      <group ref={meridianRef}>
        <mesh material={materials.metal}>
          <torusGeometry args={[1.72, 0.009, 3, segments]} />
        </mesh>
      </group>

      <group ref={tiltRef} rotation={[0.95, 0, 0.4]}>
        <mesh material={materials.metal}>
          <torusGeometry args={[1.62, 0.007, 3, Math.round(segments * 0.75)]} />
        </mesh>
      </group>

      {/* Structural frame. A detail-0 octahedron's wireframe is exactly its
          twelve edges — no EdgesGeometry, no second geometry to dispose. */}
      <mesh ref={frameRef}>
        <octahedronGeometry args={[1.34, 0]} />
        <meshBasicMaterial color={tokens.border} wireframe transparent opacity={0.45} />
      </mesh>

      {/* The shell is a housing, not a gem: it has to stay small enough that
          the surrounding mechanism still reads as the subject. */}
      <mesh material={materials.glass} {...selectHandlers}>
        <octahedronGeometry args={[0.38, 0]} />
      </mesh>

      <mesh ref={coreRef} material={materials.core} rotation={[0, Math.PI / 4, 0]} {...selectHandlers}>
        <octahedronGeometry args={[0.22, 0]} />
      </mesh>
    </group>
  );
}
