"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { MathUtils, type Mesh, type MeshStandardMaterial } from "three";
import { createCoreMaterial } from "@/three/materials/CoreMaterial";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";

/**
 * The Workstation (PLAN.md Phase 13) — desk, stand and screen. A flat slab
 * and rectilinear panels on purpose: the hero Core's vocabulary is rings,
 * facets and octahedrons, so a desk reading as "boxes on a table" is enough
 * on its own to keep this from feeling like a second Core (see the /about
 * mind map rebuild note on that mistake).
 *
 * ~180 triangles — the whole six-station ring plus hub is budgeted well
 * under the Phase 9 hero's own 60k/20k ceiling.
 */
const HOVER_DAMPING = 6;

type Props = {
  hovered: boolean;
  focused: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};

export function Workstation({ hovered, focused, onHoverChange, onSelect }: Props) {
  const tokens = useMemo(readTokens, []);
  const metal = useMemo(() => createMetalMaterial(tokens), [tokens]);
  const screen = useMemo(() => createCoreMaterial(tokens), [tokens]);

  useEffect(() => {
    return () => {
      metal.dispose();
      screen.dispose();
    };
  }, [metal, screen]);

  const screenRef = useRef<Mesh>(null);
  const [localHover, setLocalHover] = useState(false);
  const active = hovered || localHover || focused;

  useFrame((state, delta) => {
    const step = Math.min(delta, 1 / 30);
    if (screenRef.current) {
      const material = screenRef.current.material as MeshStandardMaterial;
      const target = active ? 2.2 : 1.1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.2;
      material.emissiveIntensity = MathUtils.damp(material.emissiveIntensity, target, HOVER_DAMPING, step);
    }
  });

  function setHover(next: boolean) {
    setLocalHover(next);
    onHoverChange(next);
  }

  return (
    <group
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHover(false);
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Oversized invisible hotspot — the desk itself reads small at ring
          scale, and a hotspot sized to the visible mesh makes it hard to
          hover reliably from a distance. */}
      <mesh visible={false} position={[0, 0.32, 0]}>
        <boxGeometry args={[1.1, 0.9, 0.9]} />
      </mesh>

      {/* Desk */}
      <mesh material={metal} position={[0, 0.14, 0]}>
        <boxGeometry args={[0.9, 0.04, 0.5]} />
      </mesh>
      <mesh material={metal} position={[-0.38, 0.07, 0.19]}>
        <boxGeometry args={[0.04, 0.14, 0.04]} />
      </mesh>
      <mesh material={metal} position={[0.38, 0.07, 0.19]}>
        <boxGeometry args={[0.04, 0.14, 0.04]} />
      </mesh>
      <mesh material={metal} position={[-0.38, 0.07, -0.19]}>
        <boxGeometry args={[0.04, 0.14, 0.04]} />
      </mesh>
      <mesh material={metal} position={[0.38, 0.07, -0.19]}>
        <boxGeometry args={[0.04, 0.14, 0.04]} />
      </mesh>

      {/* Stand + monitor */}
      <mesh material={metal} position={[0, 0.24, -0.14]}>
        <boxGeometry args={[0.03, 0.16, 0.03]} />
      </mesh>
      <mesh material={metal} position={[0, 0.34, -0.14]}>
        <boxGeometry args={[0.34, 0.22, 0.02]} />
      </mesh>
      <mesh ref={screenRef} material={screen} position={[0, 0.34, -0.129]}>
        <boxGeometry args={[0.29, 0.17, 0.005]} />
      </mesh>

      {/* Keyboard deck */}
      <mesh material={metal} position={[0, 0.165, 0.1]} rotation={[-0.05, 0, 0]}>
        <boxGeometry args={[0.24, 0.01, 0.11]} />
      </mesh>
    </group>
  );
}
