"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Color, MathUtils, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from "three";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import type { LabTokens } from "@/three/materials/tokens";

/**
 * One progression-stage node and its connector (design spec §3.2). Unlike
 * three/objects/CoreNode, a node here carries real, distinct information —
 * it is one of six identity stages — so its position never moves; only its
 * emissive state changes, driven by `active`/hover.
 */
const RADIUS = 1.05;
const DAMPING = 6;
const HOVER_EMISSIVE = 2.4;
const ACTIVE_EMISSIVE = 1.6;

type Props = {
  direction: readonly [number, number, number];
  tokens: LabTokens;
  active: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};

export function ProgressionNode({ direction, tokens, active, onHoverChange, onSelect }: Props) {
  const [hovered, setHovered] = useState(false);

  const material = useMemo(() => createMetalMaterial(tokens), [tokens]);
  const connectorMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(tokens.borderStrong),
        transparent: true,
        opacity: 0.85,
        toneMapped: false,
      }),
    [tokens],
  );

  const orientation = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...direction)),
    [direction],
  );

  useEffect(() => {
    material.emissive = new Color(tokens.accent);
    material.emissiveIntensity = 0;
    return () => {
      material.dispose();
      connectorMaterial.dispose();
    };
  }, [material, connectorMaterial, tokens]);

  const meshRef = useRef<Mesh>(null);
  const connectorRef = useRef<Mesh>(null);
  const restColor = useMemo(() => new Color(tokens.borderStrong), [tokens]);
  const activeColor = useMemo(() => new Color(tokens.accentDim), [tokens]);

  useFrame((_, delta) => {
    const step = Math.min(delta, 1 / 30);

    if (meshRef.current) {
      meshRef.current.position.set(direction[0] * RADIUS, direction[1] * RADIUS, direction[2] * RADIUS);
      const targetScale = hovered ? 1.35 : active ? 1.15 : 1;
      const scale = MathUtils.damp(meshRef.current.scale.x, targetScale, DAMPING, step);
      meshRef.current.scale.setScalar(scale);
    }

    if (connectorRef.current) {
      connectorRef.current.position.y = RADIUS / 2;
      connectorRef.current.scale.y = RADIUS;
    }

    const target = hovered ? HOVER_EMISSIVE : active ? ACTIVE_EMISSIVE : 0;
    material.emissiveIntensity = MathUtils.damp(material.emissiveIntensity, target, DAMPING, step);

    const lit = Math.min(material.emissiveIntensity / HOVER_EMISSIVE, 1);
    connectorMaterial.color.lerpColors(restColor, activeColor, lit);
    connectorMaterial.opacity = 0.85 + lit * 0.15;
  });

  function setHover(next: boolean) {
    setHovered(next);
    onHoverChange(next);
  }

  return (
    <>
      <group quaternion={orientation}>
        <mesh ref={connectorRef} material={connectorMaterial}>
          <cylinderGeometry args={[0.014, 0.014, 1, 6]} />
        </mesh>
      </group>

      <mesh
        ref={meshRef}
        material={material}
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
        <boxGeometry args={[0.085, 0.085, 0.085]} />
      </mesh>
    </>
  );
}
