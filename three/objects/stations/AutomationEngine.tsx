"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Mesh } from "three";
import { createCoreMaterial } from "@/three/materials/CoreMaterial";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";

/**
 * Automation Engine (/systems) — "input → data → enrich → AI → decision →
 * automation → output, animated end to end." Three packets travel a rail
 * from the input hopper to the output collector, glowing brightest as each
 * crosses the midpoint — the pipeline's AI/decision stage made literal
 * rather than described.
 */
const RAIL_HALF_LENGTH = 0.3;
const CYCLE_SECONDS = 4;
const PACKET_PHASES = [0, 1 / 3, 2 / 3];

type Props = {
  label: string;
  hovered: boolean;
  focused: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};

export function AutomationEngine({ label, hovered, focused, onHoverChange, onSelect }: Props) {
  const tokens = useMemo(readTokens, []);
  const metal = useMemo(() => createMetalMaterial(tokens), [tokens]);
  const packetMaterials = useMemo(() => PACKET_PHASES.map(() => createCoreMaterial(tokens)), [tokens]);

  useEffect(() => {
    return () => {
      metal.dispose();
      packetMaterials.forEach((m) => m.dispose());
    };
  }, [metal, packetMaterials]);

  const packetRefs = useRef<(Mesh | null)[]>([]);
  const [localHover, setLocalHover] = useState(false);
  const active = hovered || localHover || focused;

  useFrame((state) => {
    const boost = active ? 1.4 : 1;
    PACKET_PHASES.forEach((phase, i) => {
      const mesh = packetRefs.current[i];
      if (!mesh) return;
      const t = ((state.clock.elapsedTime / CYCLE_SECONDS + phase) % 1 + 1) % 1;
      mesh.position.x = -RAIL_HALF_LENGTH + t * RAIL_HALF_LENGTH * 2;
      // Bell curve peaking at the rail's midpoint — the "AI / decision" stage.
      const centerDistance = (t - 0.5) * 6;
      const glow = Math.exp(-(centerDistance * centerDistance));
      const material = packetMaterials[i];
      if (!material) return;
      material.emissiveIntensity = (0.6 + glow * 2.2) * boost;
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
      <mesh visible={false} position={[0, 0.14, 0]}>
        <boxGeometry args={[0.95, 0.4, 0.3]} />
      </mesh>

      {/* Rail + legs */}
      <mesh material={metal} position={[0, 0.08, 0]}>
        <boxGeometry args={[0.64, 0.015, 0.05]} />
      </mesh>
      <mesh material={metal} position={[-0.3, 0.04, 0]}>
        <boxGeometry args={[0.02, 0.08, 0.02]} />
      </mesh>
      <mesh material={metal} position={[0.3, 0.04, 0]}>
        <boxGeometry args={[0.02, 0.08, 0.02]} />
      </mesh>

      {/* Input hopper */}
      <mesh material={metal} position={[-0.36, 0.14, 0]}>
        <boxGeometry args={[0.09, 0.12, 0.09]} />
      </mesh>

      {/* Output collector */}
      <mesh material={metal} position={[0.36, 0.13, 0]}>
        <boxGeometry args={[0.09, 0.1, 0.09]} />
      </mesh>

      {/* Packets travelling the rail */}
      {PACKET_PHASES.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            packetRefs.current[i] = el;
          }}
          material={packetMaterials[i]}
          position={[-RAIL_HALF_LENGTH, 0.1, 0]}
        >
          <boxGeometry args={[0.045, 0.045, 0.045]} />
        </mesh>
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
