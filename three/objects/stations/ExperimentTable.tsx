"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Color, MeshStandardMaterial, type Mesh } from "three";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens, type LabTokens } from "@/three/materials/tokens";

/**
 * Experiment Table (/experiments) — "what's being built and broken right
 * now, including the honest failures." Four vials on a bench, each holding
 * one of the site's own experiment statuses (CLAUDE.md §10 /
 * data/experiments): LIVE, BUILDING, ARCHIVED, and — deliberately included,
 * not smoothed over — FAILED, which flickers instead of holding steady.
 */

type Props = {
  label: string;
  hovered: boolean;
  focused: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};

function statusColors(tokens: LabTokens) {
  return [
    { color: tokens.accent, flicker: false }, // LIVE
    { color: tokens.building, flicker: false }, // BUILDING
    { color: tokens.failed, flicker: true }, // FAILED
    { color: tokens.borderStrong, flicker: false }, // ARCHIVED
  ];
}

const VIAL_X = [-0.24, -0.08, 0.08, 0.24];

export function ExperimentTable({ label, hovered, focused, onHoverChange, onSelect }: Props) {
  const tokens = useMemo(readTokens, []);
  const metal = useMemo(() => createMetalMaterial(tokens), [tokens]);
  const statuses = useMemo(() => statusColors(tokens), [tokens]);
  const vialMaterials = useMemo(
    () =>
      statuses.map(
        (s) =>
          new MeshStandardMaterial({
            color: new Color(tokens.bg),
            emissive: new Color(s.color),
            emissiveIntensity: 1.3,
            roughness: 0.4,
            metalness: 0.1,
            toneMapped: false,
          }),
      ),
    [tokens, statuses],
  );

  useEffect(() => {
    return () => {
      metal.dispose();
      vialMaterials.forEach((m) => m.dispose());
    };
  }, [metal, vialMaterials]);

  const vialRefs = useRef<(Mesh | null)[]>([]);
  const [localHover, setLocalHover] = useState(false);
  const active = hovered || localHover || focused;

  useFrame((state) => {
    const base = active ? 2.4 : 1.3;
    statuses.forEach((s, i) => {
      const mesh = vialRefs.current[i];
      if (!mesh) return;
      const material = mesh.material as MeshStandardMaterial;
      if (s.flicker) {
        const t = state.clock.elapsedTime;
        const flicker = 0.55 + 0.45 * Math.max(0, Math.sin(t * 9) * Math.sin(t * 2.3));
        material.emissiveIntensity = base * flicker;
      } else {
        material.emissiveIntensity = base;
      }
    });
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
        <boxGeometry args={[0.85, 0.4, 0.4]} />
      </mesh>

      {/* Bench top + legs */}
      <mesh material={metal} position={[0, 0.12, 0]}>
        <boxGeometry args={[0.7, 0.03, 0.24]} />
      </mesh>
      {(
        [
          [-0.32, 0.16],
          [0.32, 0.16],
          [-0.32, -0.16],
          [0.32, -0.16],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={i} material={metal} position={[x, 0.06, z]}>
          <boxGeometry args={[0.02, 0.12, 0.02]} />
        </mesh>
      ))}

      {/* Vials */}
      {VIAL_X.map((x, i) => (
        <group key={i} position={[x, 0.135, 0]}>
          <mesh
            ref={(el) => {
              vialRefs.current[i] = el;
            }}
            material={vialMaterials[i]}
            position={[0, 0.045, 0]}
          >
            <cylinderGeometry args={[0.026, 0.02, 0.09, 8]} />
          </mesh>
          <mesh material={metal} position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.04, 8]} />
          </mesh>
        </group>
      ))}

      {!focused && (
        <Html position={[0, 0.32, 0]} center distanceFactor={6} style={{ pointerEvents: "none" }}>
          <span className="label whitespace-nowrap" style={{ color: active ? "var(--color-accent)" : "var(--color-accent-dim)" }}>
            {label}
          </span>
        </Html>
      )}
    </group>
  );
}
