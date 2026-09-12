"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { MathUtils, type Mesh, type MeshStandardMaterial } from "three";
import { createCoreMaterial } from "@/three/materials/CoreMaterial";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";

/**
 * Communication Terminal (/contact) — "where a visitor starts a
 * conversation." A console with a screen (same glowing-panel material as
 * the Workstation's) and an antenna whose tip breathes on its own and
 * brightens on hover/focus — signalling "ready," not just decoration.
 */
const HOVER_DAMPING = 6;

type Props = {
  label: string;
  hovered: boolean;
  focused: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};

export function CommunicationTerminal({ label, hovered, focused, onHoverChange, onSelect }: Props) {
  const tokens = useMemo(readTokens, []);
  const metal = useMemo(() => createMetalMaterial(tokens), [tokens]);
  const screen = useMemo(() => createCoreMaterial(tokens), [tokens]);
  const tip = useMemo(() => createCoreMaterial(tokens), [tokens]);

  useEffect(() => {
    return () => {
      metal.dispose();
      screen.dispose();
      tip.dispose();
    };
  }, [metal, screen, tip]);

  const screenRef = useRef<Mesh>(null);
  const tipRef = useRef<Mesh>(null);
  const [localHover, setLocalHover] = useState(false);
  const active = hovered || localHover || focused;

  useFrame((state, delta) => {
    const step = Math.min(delta, 1 / 30);
    const breathe = 1.1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.2;

    if (screenRef.current) {
      const material = screenRef.current.material as MeshStandardMaterial;
      material.emissiveIntensity = MathUtils.damp(material.emissiveIntensity, active ? 2.2 : breathe, HOVER_DAMPING, step);
    }
    if (tipRef.current) {
      const material = tipRef.current.material as MeshStandardMaterial;
      const target = active ? 3 : breathe * 1.4;
      material.emissiveIntensity = MathUtils.damp(material.emissiveIntensity, target, HOVER_DAMPING, step);
      const scaleTarget = active ? 1.4 : 1;
      const scale = MathUtils.damp(tipRef.current.scale.x, scaleTarget, HOVER_DAMPING, step);
      tipRef.current.scale.setScalar(scale);
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
      <mesh visible={false} position={[0, 0.24, 0]}>
        <boxGeometry args={[0.4, 0.6, 0.35]} />
      </mesh>

      {/* Console body */}
      <mesh material={metal} position={[0, 0.09, 0]}>
        <boxGeometry args={[0.26, 0.18, 0.2]} />
      </mesh>
      <mesh ref={screenRef} material={screen} position={[0, 0.2, 0.095]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.16, 0.1, 0.005]} />
      </mesh>

      {/* Antenna + pulsing tip */}
      <mesh material={metal} position={[0, 0.29, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.22, 6]} />
      </mesh>
      <mesh ref={tipRef} material={tip} position={[0, 0.41, 0]}>
        <sphereGeometry args={[0.03, 8, 6]} />
      </mesh>

      {!focused && (
        <Html position={[0, 0.58, 0]} center distanceFactor={6} style={{ pointerEvents: "none" }}>
          <span className="label whitespace-nowrap" style={{ color: active ? "var(--color-accent)" : "var(--color-accent-dim)" }}>
            {label}
          </span>
        </Html>
      )}
    </group>
  );
}
