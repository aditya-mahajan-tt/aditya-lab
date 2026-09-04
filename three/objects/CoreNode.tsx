"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Color, Group, MathUtils, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from "three";
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
 * The connector is a real cylinder, not a `Line` — WebGL caps line width at
 * ~1 physical pixel on almost every driver regardless of `linewidth`, which
 * made the original connector nearly invisible against the background. A
 * thin mesh renders at its actual width on every GPU. It is oriented once
 * via a quaternion from the connector's rest axis (+Y) to `direction`, then
 * stretched along its own local Y each frame to reach the node's radius —
 * same zero-buffer-rewrite trick the old Line used, just on a mesh.
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
  const connectorMaterial = useMemo(
    () => new MeshBasicMaterial({ color: new Color(tokens.borderStrong), transparent: true, opacity: 0.85, toneMapped: false }),
    [tokens],
  );

  // Aligns the connector's rest axis (+Y) to `direction` once — direction
  // never changes for a given node, so this is a one-time quaternion, not a
  // per-frame computation.
  const orientation = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...direction)),
    [direction],
  );

  useEffect(() => {
    // Emissive is animated per-node, so each node owns its material and has
    // to dispose it — R3F only cleans up what it created declaratively.
    material.emissive = new Color(tokens.accent);
    material.emissiveIntensity = 0;
    return () => {
      material.dispose();
      connectorMaterial.dispose();
    };
  }, [material, connectorMaterial, tokens]);

  const meshRef = useRef<Mesh>(null);
  const connectorGroupRef = useRef<Group>(null);
  const connectorRef = useRef<Mesh>(null);

  const restColor = useMemo(() => new Color(tokens.borderStrong), [tokens]);
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

    if (connectorRef.current) {
      // Cylinder is centered on its local origin, so a length of `radius`
      // running from the core out to the node sits at the midpoint.
      connectorRef.current.position.y = radius / 2;
      connectorRef.current.scale.y = radius;
    }

    // Expansion lights every node, hover lights one. Without this the click
    // only moves things a few percent, which is not a legible response —
    // "the machine is energised" has to be readable in a still frame, not
    // only in motion.
    const target = (hovered ? HOVER_EMISSIVE : 0) + expansion.current * EXPANDED_EMISSIVE;
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
      <group ref={connectorGroupRef} quaternion={orientation}>
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
