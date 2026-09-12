"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Color, MathUtils, MeshBasicMaterial } from "three";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";

/**
 * Strategy Wall (/systems) — "segmentation, GTM, positioning and
 * customer-journey work laid out visually." A pinboard: a flat panel with
 * four cards and two connecting threads, boxes and cylinders only — the
 * Workstation's desk vocabulary, not the hero Core's.
 */
const HOVER_DAMPING = 6;

type Props = {
  label: string;
  hovered: boolean;
  focused: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};

const CARDS = [
  { pos: [-0.14, 0.36] as const, size: [0.09, 0.06] as const },
  { pos: [0.1, 0.34] as const, size: [0.08, 0.055] as const },
  { pos: [-0.05, 0.2] as const, size: [0.085, 0.06] as const },
  { pos: [0.16, 0.2] as const, size: [0.07, 0.05] as const },
] as const;

/** A thread's rest pose: cylinderGeometry's default axis is +Y, so aligning
 * it to a direction in the board's XY plane only needs a Z rotation. */
function thread(p1: readonly [number, number], p2: readonly [number, number]) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return {
    position: [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2] as const,
    rotationZ: Math.atan2(-dx, dy),
    length: Math.hypot(dx, dy),
  };
}

const THREADS = [thread(CARDS[0].pos, CARDS[2].pos), thread(CARDS[1].pos, CARDS[3].pos)];

const BOARD_Z = 0.01;
const CARD_Z = BOARD_Z + 0.015;
const THREAD_Z = BOARD_Z + 0.01;

export function StrategyWall({ label, hovered, focused, onHoverChange, onSelect }: Props) {
  const tokens = useMemo(readTokens, []);
  const metal = useMemo(() => createMetalMaterial(tokens), [tokens]);
  const card = useMemo(() => createMetalMaterial(tokens, tokens.accentDim), [tokens]);
  const threadMaterials = useMemo(
    () => THREADS.map(() => new MeshBasicMaterial({ color: new Color(tokens.accentDim), toneMapped: false })),
    [tokens],
  );

  useEffect(() => {
    return () => {
      metal.dispose();
      card.dispose();
      threadMaterials.forEach((m) => m.dispose());
    };
  }, [metal, card, threadMaterials]);

  const [localHover, setLocalHover] = useState(false);
  const active = hovered || localHover || focused;
  const lit = useRef(0);
  const restColor = useMemo(() => new Color(tokens.accentDim), [tokens]);
  const activeColor = useMemo(() => new Color(tokens.accent), [tokens]);

  useFrame((_, delta) => {
    const step = Math.min(delta, 1 / 30);
    lit.current = MathUtils.damp(lit.current, active ? 1 : 0, HOVER_DAMPING, step);
    threadMaterials.forEach((m) => m.color.lerpColors(restColor, activeColor, lit.current));
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
      <mesh visible={false} position={[0, 0.28, 0.05]}>
        <boxGeometry args={[0.6, 0.5, 0.2]} />
      </mesh>

      {/* Panel + two legs */}
      <mesh material={metal} position={[0, 0.28, 0]}>
        <boxGeometry args={[0.5, 0.35, 0.02]} />
      </mesh>
      <mesh material={metal} position={[-0.18, 0.08, 0]}>
        <boxGeometry args={[0.02, 0.16, 0.02]} />
      </mesh>
      <mesh material={metal} position={[0.18, 0.08, 0]}>
        <boxGeometry args={[0.02, 0.16, 0.02]} />
      </mesh>

      {/* Threads, behind the cards */}
      {THREADS.map((t, i) => (
        <mesh
          key={i}
          material={threadMaterials[i]}
          position={[t.position[0], t.position[1], THREAD_Z]}
          rotation={[0, 0, t.rotationZ]}
        >
          <cylinderGeometry args={[0.006, 0.006, t.length, 6]} />
        </mesh>
      ))}

      {/* Pinned cards */}
      {CARDS.map((c, i) => (
        <mesh key={i} material={card} position={[c.pos[0], c.pos[1], CARD_Z]}>
          <boxGeometry args={[c.size[0], c.size[1], 0.005]} />
        </mesh>
      ))}

      {!focused && (
        <Html position={[0, 0.62, 0]} center distanceFactor={6} style={{ pointerEvents: "none" }}>
          <span className="label whitespace-nowrap" style={{ color: active ? "var(--color-accent)" : "var(--color-accent-dim)" }}>
            {label}
          </span>
        </Html>
      )}
    </group>
  );
}
