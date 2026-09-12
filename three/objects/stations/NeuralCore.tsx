"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { MathUtils, type Mesh, type MeshStandardMaterial } from "three";
import { createCoreMaterial } from "@/three/materials/CoreMaterial";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";

/**
 * Neural Core (/systems) — "the capability graph, linked to real projects."
 * A small stacked rack (metal, matching the Workstation's desk vocabulary —
 * boxes, not the hero Core's rings/facets/octahedrons, per the note on
 * three/objects/stations/Workstation) with three arms radiating out to
 * glowing nodes at different heights: the graph, not the hero object.
 */
const HOVER_DAMPING = 6;

type Props = {
  label: string;
  hovered: boolean;
  focused: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};

const NODES = [
  { armPos: [0.11, 0.22, 0] as const, armRotation: [0, 0, Math.PI / 2] as const, nodePos: [0.22, 0.22, 0] as const },
  { armPos: [-0.11, 0.15, 0] as const, armRotation: [0, 0, Math.PI / 2] as const, nodePos: [-0.22, 0.15, 0] as const },
  { armPos: [0, 0.28, 0.11] as const, armRotation: [Math.PI / 2, 0, 0] as const, nodePos: [0, 0.28, 0.22] as const },
];

export function NeuralCore({ label, hovered, focused, onHoverChange, onSelect }: Props) {
  const tokens = useMemo(readTokens, []);
  const metal = useMemo(() => createMetalMaterial(tokens), [tokens]);
  const node = useMemo(() => createCoreMaterial(tokens), [tokens]);

  useEffect(() => {
    return () => {
      metal.dispose();
      node.dispose();
    };
  }, [metal, node]);

  const nodeRefs = useRef<(Mesh | null)[]>([]);
  const [localHover, setLocalHover] = useState(false);
  const active = hovered || localHover || focused;

  useFrame((state, delta) => {
    const step = Math.min(delta, 1 / 30);
    const target = active ? 2.2 : 1.1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.2;
    for (const mesh of nodeRefs.current) {
      if (!mesh) continue;
      const material = mesh.material as MeshStandardMaterial;
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
      {/* Oversized invisible hotspot, same reasoning as Workstation's. */}
      <mesh visible={false} position={[0, 0.2, 0]}>
        <boxGeometry args={[0.85, 0.7, 0.85]} />
      </mesh>

      {/* Rack base */}
      <mesh material={metal} position={[0, 0.02, 0]}>
        <boxGeometry args={[0.24, 0.04, 0.18]} />
      </mesh>

      {/* Blades */}
      <mesh material={metal} position={[0, 0.09, 0]}>
        <boxGeometry args={[0.22, 0.05, 0.16]} />
      </mesh>
      <mesh material={metal} position={[0, 0.16, 0]}>
        <boxGeometry args={[0.22, 0.05, 0.16]} />
      </mesh>
      <mesh material={metal} position={[0, 0.23, 0]}>
        <boxGeometry args={[0.22, 0.05, 0.16]} />
      </mesh>

      {/* Arms + nodes — the graph */}
      {NODES.map((n, i) => (
        <group key={i}>
          <mesh material={metal} position={n.armPos} rotation={n.armRotation}>
            <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
          </mesh>
          <mesh
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            material={node}
            position={n.nodePos}
          >
            <boxGeometry args={[0.055, 0.055, 0.055]} />
          </mesh>
        </group>
      ))}

      {!focused && (
        <Html position={[0, 0.5, 0]} center distanceFactor={6} style={{ pointerEvents: "none" }}>
          <span className="label whitespace-nowrap" style={{ color: active ? "var(--color-accent)" : "var(--color-accent-dim)" }}>
            {label}
          </span>
        </Html>
      )}
    </group>
  );
}
