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
 * Since the orbital rewrite each node is one real body from `getHeroBodies`
 * (Task 2): hovering it names it in the caption row, clicking it routes.
 * The node still holds no information of its own — its label, detail and
 * href all live in `/data` and are drawn as real anchors by
 * components/hero/OrbitalBodyList (layer 0) and components/hero/CoreFallback
 * (layer 1), which is what lets this canvas stay `aria-hidden` and keeps 3D
 * from ever being the only route to content (CLAUDE.md §3.5).
 *
 * The connector is a real cylinder, not a `Line` — WebGL caps line width at
 * ~1 physical pixel on almost every driver regardless of `linewidth`, which
 * made the original connector nearly invisible against the background. A
 * thin mesh renders at its actual width on every GPU. It is oriented once
 * via a quaternion from the connector's rest axis (+Y) to `direction`, then
 * stretched along its own local Y each frame to reach the node's radius —
 * same zero-buffer-rewrite trick the old Line used, just on a mesh.
 */

/** Extra distance every node travels outward when the assembly is expanded. */
const EXPANDED_EXTRA = 0.3;
const DAMPING = 6;

/**
 * The visible node is a 0.085-unit box — at the hero's on-screen scale that
 * raycasts to roughly a 12px target (16px at the 1.35x hover scale), well
 * under the 44px-equivalent hit area components/hero/CoreFallback
 * deliberately pads its own SVG markers with. An invisible mesh this much
 * larger is the 3D layer's equivalent of that padding, so clicking "near" a
 * node is exactly as forgiving in 3D as it already is in the DOM/SVG
 * fallback, instead of demanding pixel-precision only here.
 */
const HIT_TARGET_SIZE = 0.34;

const HOVER_EMISSIVE = 2.4;
const EXPANDED_EMISSIVE = 1.3;

type Props = {
  /** Unit direction from the core. */
  direction: readonly [number, number, number];
  /** Rest distance from the core — inner-ring bodies sit closer than outer-ring ones. */
  radius: number;
  tokens: LabTokens;
  /** Shared, damped 0→1 expansion driven by Core. */
  expansion: MutableRefObject<number>;
  /**
   * Highlighted from outside — the caption row's current body, set by a
   * desktop hover on either layer or a mobile tap. Lights the node exactly
   * as a live pointer hover does, so "which body is highlighted" has one
   * source of truth across all three layers.
   */
  active: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};

export function CoreNode({ direction, radius, tokens, expansion, active, onHoverChange, onSelect }: Props) {
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
  const hitRef = useRef<Mesh>(null);
  const connectorGroupRef = useRef<Group>(null);
  const connectorRef = useRef<Mesh>(null);

  const restColor = useMemo(() => new Color(tokens.borderStrong), [tokens]);
  const activeColor = useMemo(() => new Color(tokens.accentDim), [tokens]);

  useFrame((_, delta) => {
    const step = Math.min(delta, 1 / 30);
    const dist = radius + expansion.current * EXPANDED_EXTRA;

    if (meshRef.current) {
      meshRef.current.position.set(direction[0] * dist, direction[1] * dist, direction[2] * dist);

      const targetScale = hovered ? 1.35 : 1;
      const scale = MathUtils.damp(meshRef.current.scale.x, targetScale, DAMPING, step);
      meshRef.current.scale.setScalar(scale);
    }

    // The hit target tracks the visible node's position but never its hover
    // scale — it has to stay a stable, predictable size to raycast against,
    // not grow/shrink under the same pointer event that's deciding whether
    // it's hovered.
    if (hitRef.current) {
      hitRef.current.position.set(direction[0] * dist, direction[1] * dist, direction[2] * dist);
    }

    if (connectorRef.current) {
      // Cylinder is centered on its local origin, so a length of `dist`
      // running from the core out to the node sits at the midpoint.
      connectorRef.current.position.y = dist / 2;
      connectorRef.current.scale.y = dist;
    }

    // Expansion lights every node, hover lights one. Without this the click
    // only moves things a few percent, which is not a legible response —
    // "the machine is energised" has to be readable in a still frame, not
    // only in motion.
    const target = (hovered || active ? HOVER_EMISSIVE : 0) + expansion.current * EXPANDED_EMISSIVE;
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

      <mesh ref={meshRef} material={material}>
        <boxGeometry args={[0.085, 0.085, 0.085]} />
      </mesh>

      {/* Invisible, larger hit target — the actual raycast surface. Kept as
          a second mesh rather than scaling the visible one up: the visible
          box's own size is a deliberate visual choice (small enough that the
          node reads as a machine part, not a button), and it still needs to
          hover-scale independently for the "lit up" response. */}
      <mesh
        ref={hitRef}
        visible={false}
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
        <boxGeometry args={[HIT_TARGET_SIZE, HIT_TARGET_SIZE, HIT_TARGET_SIZE]} />
      </mesh>
    </>
  );
}
