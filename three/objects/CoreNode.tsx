"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { BufferGeometry, Color, Float32BufferAttribute, LineBasicMaterial, MathUtils, Mesh, Line } from "three";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import type { LabTokens } from "@/three/materials/tokens";

/**
 * One data node and the connector tying it back to the core (PLAN.md Phase
 * 9: "node illumination on hover").
 *
 * The node carries no information — it lights up and the whole assembly
 * responds, which is the point: the object demonstrates that it is a
 * machine rather than a picture. Nothing here is content, so nothing here
 * needs a DOM equivalent beyond the one CoreFallback already draws
 * (CLAUDE.md §3.5).
 *
 * The connector is a unit-length line scaled to the node's current radius,
 * so pushing the node outward on expansion costs no buffer rewrites.
 */

const REST_RADIUS = 1.05;
const EXPANDED_EXTRA = 0.3;
const DAMPING = 6;

const HOVER_EMISSIVE = 2.4;
const EXPANDED_EMISSIVE = 1.3;

type Props = {
  /** Unit direction from the core. */
  direction: readonly [number, number, number];
  tokens: LabTokens;
  /** Shared, damped 0→1 expansion driven by Core. */
  expansion: MutableRefObject<number>;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};

export function CoreNode({ direction, tokens, expansion, onHoverChange, onSelect }: Props) {
  const [hovered, setHovered] = useState(false);

  const material = useMemo(() => createMetalMaterial(tokens), [tokens]);
  const lineMaterial = useMemo(
    () => new LineBasicMaterial({ color: new Color(tokens.border), transparent: true, opacity: 0.55 }),
    [tokens],
  );

  const lineGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute([0, 0, 0, direction[0], direction[1], direction[2]], 3),
    );
    return geometry;
  }, [direction]);

  useEffect(() => {
    // Emissive is animated per-node, so each node owns its material and has
    // to dispose it — R3F only cleans up what it created declaratively.
    material.emissive = new Color(tokens.accent);
    material.emissiveIntensity = 0;
    return () => {
      material.dispose();
      lineMaterial.dispose();
      lineGeometry.dispose();
    };
  }, [material, lineMaterial, lineGeometry, tokens]);

  const meshRef = useRef<Mesh>(null);

  // Built once and mutated in the frame loop. `<line>` as an intrinsic
  // collides with the SVG element type in TSX, so this is a plain object
  // handed to <primitive>.
  const line = useMemo(() => new Line(lineGeometry, lineMaterial), [lineGeometry, lineMaterial]);

  const restColor = useMemo(() => new Color(tokens.border), [tokens]);
  const activeColor = useMemo(() => new Color(tokens.accentDim), [tokens]);

  useFrame((_, delta) => {
    const step = Math.min(delta, 1 / 30);
    const radius = REST_RADIUS + expansion.current * EXPANDED_EXTRA;

    if (meshRef.current) {
      meshRef.current.position.set(direction[0] * radius, direction[1] * radius, direction[2] * radius);

      const targetScale = hovered ? 1.35 : 1;
      const scale = MathUtils.damp(meshRef.current.scale.x, targetScale, DAMPING, step);
      meshRef.current.scale.setScalar(scale);
    }

    line.scale.setScalar(radius);

    // Expansion lights every node, hover lights one. Without this the click
    // only moves things a few percent, which is not a legible response —
    // "the machine is energised" has to be readable in a still frame, not
    // only in motion.
    const target = (hovered ? HOVER_EMISSIVE : 0) + expansion.current * EXPANDED_EMISSIVE;
    material.emissiveIntensity = MathUtils.damp(material.emissiveIntensity, target, DAMPING, step);

    const lit = Math.min(material.emissiveIntensity / HOVER_EMISSIVE, 1);
    lineMaterial.color.lerpColors(restColor, activeColor, lit);
    lineMaterial.opacity = 0.55 + lit * 0.35;
  });

  function setHover(next: boolean) {
    setHovered(next);
    onHoverChange(next);
  }

  return (
    <>
      <primitive object={line} />

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
