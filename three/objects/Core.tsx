"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from "three";
import type { PlaneValue } from "@/data/schema";
import type { HeroBody } from "@/data/queries";
import { degToXY, HERO_PLANE_CENTER_DEG, layoutBodyAngles } from "@/lib/heroOrbitalLayout";
import type { QualityTier } from "@/lib/quality";
import { createCoreMaterial } from "@/three/materials/CoreMaterial";
import { createGlassMaterial } from "@/three/materials/GlassMaterial";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";
import { CoreNode } from "./CoreNode";

/**
 * The computational core (PLAN.md Phase 9) — the same object the DOM
 * fallback draws (components/hero/CoreFallback), built as a machine:
 * layered rings carrying modules, a structural frame, one node per hero
 * body on connectors, and a slow-pulsing energy core inside a housing.
 *
 * Since the orbital rewrite the nodes are data, not decoration: they come
 * from `getHeroBodies()` and are placed by `lib/heroOrbitalLayout`, the same
 * angles and rings layers 0 and 1 use, so the cross-fade lands on itself and
 * hovering a body here names it in the same caption row.
 *
 * Deliberately not a glowing sphere, a brain or a crypto cube: every part
 * is a flat facet, a thin ring or a machined block, and the silhouette is
 * built from counter-rotating layers so it reads as a mechanism.
 *
 * Interactions here are a shortcut, never the only route. Hovering a node
 * lights it and names its body in the caption row; clicking it routes to the
 * page its `<a>` in layers 0/1 already points at; clicking the housing
 * expands the assembly. Nothing here is reachable only in 3D, which is what
 * lets the canvas stay `aria-hidden` (CLAUDE.md §3.5).
 *
 * ~5k triangles against a 60k HIGH budget / 20k MEDIUM.
 */

/**
 * The two ring depths, in world units — CoreFallback's 95/155 viewBox radii
 * at 1/100 scale, so both layers read as the same diagram at the same size.
 * The inner ring keeps the 1.05 the single node ring used before the orbital
 * rewrite (a hair outside the SVG's proportional 0.95): closer than that and
 * an inner body starts to overlap the housing once the assembly expands.
 */
const INNER_RADIUS = 1.05;
const OUTER_RADIUS = 1.55;
/** How fast the assembly settles onto the selected mobile plane. */
const FACE_PLANE_DAMPING = 3;

/**
 * Sentinel id for the housing, which accepts a hover/click of its own but is
 * not a body. It is reported upward so the INTERACT cursor still marks the
 * housing as responsive; downstream it matches no body, so the caption row
 * correctly reads as "nothing selected" while the pointer is on it.
 */
const HOUSING_ID = "__core-housing__";

/** Machined blocks riding the outer ring — the "modular" in modular machine. */
const MODULE_COUNT = 12;
const MODULE_RING_RADIUS = 1.9;

const RING_SEGMENTS: Record<Exclude<QualityTier, "low">, number> = { high: 160, medium: 80 };

/** How fast expansion settles. Frame-rate independent via MathUtils.damp. */
const EXPANSION_DAMPING = 4.5;

export function Core({
  tier,
  bodies,
  activeBodyId,
  activePlane,
  onBodyHover,
}: {
  tier: Exclude<QualityTier, "low">;
  bodies: HeroBody[];
  activeBodyId: string | null;
  /** `null` on desktop (every plane faces the camera at once); a plane on mobile. */
  activePlane: PlaneValue | null;
  onBodyHover: (id: string | null) => void;
}) {
  const router = useRouter();
  const tokens = useMemo(readTokens, []);
  const segments = RING_SEGMENTS[tier];

  const materials = useMemo(
    () => ({
      core: createCoreMaterial(tokens),
      glass: createGlassMaterial(tokens, tier),
      metal: createMetalMaterial(tokens),
    }),
    [tokens, tier],
  );

  useEffect(() => {
    return () => {
      materials.core.dispose();
      materials.glass.dispose();
      materials.metal.dispose();
    };
  }, [materials]);

  /**
   * Positions come from the same pure layout module the SVG layer uses
   * (lib/heroOrbitalLayout), so a body's underlying *angle* is identical in
   * both layers — the screen convention's y becomes this group's z.
   *
   * That is a shared-math claim, not a shared-pixels one. The SVG draws its
   * circle face-on; here the same angles lie in the horizontal ground plane,
   * which the camera sees near-edge-on. A body is therefore not at the same
   * on-screen position in the two layers, and it is not meant to be — what
   * carries across the cross-fade is the assembly's size and silhouette, and
   * the fact that both layers order the bodies by one set of angles.
   */
  const nodeLayout = useMemo(() => {
    const angleById = new Map(layoutBodyAngles(bodies).map((a) => [a.id, a]));
    return bodies.flatMap((body) => {
      const angle = angleById.get(body.id);
      if (!angle) return [];
      const { x, y } = degToXY(angle.deg, 1);
      return [
        {
          body,
          radius: body.ring === "inner" ? INNER_RADIUS : OUTER_RADIUS,
          direction: [x, 0, y] as const,
        },
      ];
    });
  }, [bodies]);

  const modules = useMemo(
    () =>
      Array.from({ length: MODULE_COUNT }, (_, i) => {
        const rad = (i / MODULE_COUNT) * Math.PI * 2;
        return {
          position: [Math.cos(rad) * MODULE_RING_RADIUS, 0, Math.sin(rad) * MODULE_RING_RADIUS] as const,
          rotation: [0, -rad, 0] as const,
        };
      }),
    [],
  );

  /**
   * Hover is tracked as a set of ids, not a boolean count: moving between two
   * adjacent nodes fires the new node's `over` before the old one's `out`, so
   * a naive "cleared on pointer-out" would flicker the caption row and the
   * cursor off and on. The most recently entered id wins, and only an empty
   * set reports `null`.
   */
  const hoveredIds = useRef(new Set<string>());
  const handleNodeHover = useCallback(
    (id: string, hovered: boolean) => {
      if (hovered) hoveredIds.current.add(id);
      else hoveredIds.current.delete(id);
      const [mostRecent] = [...hoveredIds.current].slice(-1);
      onBodyHover(mostRecent ?? null);
    },
    [onBodyHover],
  );

  const [expanded, setExpanded] = useState(false);
  const expansion = useRef(0);
  const toggle = useCallback(() => setExpanded((value) => !value), []);

  const rotationRef = useRef<Group>(null);
  const ringScaleRef = useRef<Group>(null);
  const meridianRef = useRef<Group>(null);
  const tiltRef = useRef<Group>(null);
  const frameRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const step = Math.min(delta, 1 / 30);

    expansion.current = MathUtils.damp(expansion.current, expanded ? 1 : 0, EXPANSION_DAMPING, step);
    const e = expansion.current;

    if (rotationRef.current) {
      if (activePlane) {
        // Mobile: rotate the assembly so the selected plane's center angle
        // faces the camera. A node at plane-center angle theta sits at local
        // (cos theta, 0, sin theta); rotating the group by phi around Y moves
        // it to effective angle theta - phi (standard Y-axis rotation). The
        // camera sits at +Z looking at the origin (CameraController), so
        // "facing the camera" means that effective angle should be 90 deg —
        // solving theta - phi = 90 for phi gives phi = theta - 90.
        const targetY = ((HERO_PLANE_CENTER_DEG[activePlane] - 90) * Math.PI) / 180;
        rotationRef.current.rotation.y = MathUtils.damp(rotationRef.current.rotation.y, targetY, FACE_PLANE_DAMPING, step);
      } else {
        // Desktop: the existing idle rotation. Expanded, the machine spins up
        // slightly — the response to a click has to be legible in motion, not
        // only in position.
        rotationRef.current.rotation.y += step * (0.14 + e * 0.16);
      }
      rotationRef.current.rotation.x = Math.sin(t * 0.16) * 0.05;
    }

    if (ringScaleRef.current) ringScaleRef.current.scale.setScalar(1 + e * 0.07);
    if (tiltRef.current) {
      tiltRef.current.rotation.y += step * 0.06;
      tiltRef.current.scale.setScalar(1 + e * 0.1);
    }
    if (meridianRef.current) {
      meridianRef.current.rotation.z -= step * (0.08 + e * 0.1);
      meridianRef.current.scale.setScalar(1 + e * 0.09);
    }
    if (frameRef.current) frameRef.current.scale.setScalar(1 + e * 0.12);

    if (coreRef.current) {
      const material = coreRef.current.material as MeshStandardMaterial;
      // Kept deliberately low: past roughly 2.0 the octahedron stops reading
      // as a faceted machine part and becomes the glowing orb PLAN.md Phase
      // 9 explicitly rules out.
      const pulse = Math.sin(t * 1.6);
      material.emissiveIntensity = 1.1 + pulse * 0.45 + e * 0.45;
      // A size pulse in lockstep with the emissive one is a lot more
      // legible than intensity alone, especially at the hero's small
      // canvas size — the eye catches "growing" far more readily than
      // "brightening" on a shape this small.
      coreRef.current.scale.setScalar(1 + pulse * 0.06 + e * 0.08);
      coreRef.current.rotation.y += step * (0.2 + e * 0.5);
    }
  });

  // The housing is the other place the object accepts a click, so it gets
  // the same hover treatment as a node — an affordance the cursor can read.
  const selectHandlers = {
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      toggle();
    },
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      handleNodeHover(HOUSING_ID, true);
    },
    onPointerOut: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      handleNodeHover(HOUSING_ID, false);
    },
  };

  return (
    // Scaled so the outer ring sits inside the 420px stage at the same
    // proportion the SVG's outer circle does — the two have to be the same
    // object at the same size for the cross-fade to land on itself.
    <group rotation={[0.24, 0, 0.08]} scale={0.72}>
      <group ref={rotationRef}>
        <group ref={ringScaleRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.metal}>
            <torusGeometry args={[1.9, 0.02, 3, segments]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.metal}>
            <torusGeometry args={[1.5, 0.015, 3, Math.round(segments * 0.75)]} />
          </mesh>

          {modules.map((module, i) => (
            <mesh key={i} position={module.position} rotation={module.rotation} material={materials.metal}>
              <boxGeometry args={[0.05, 0.085, 0.13]} />
            </mesh>
          ))}
        </group>

        {nodeLayout.map(({ body, radius, direction }) => (
          <CoreNode
            key={body.id}
            direction={direction}
            radius={radius}
            tokens={tokens}
            expansion={expansion}
            active={activeBodyId === body.id}
            onHoverChange={(hovered) => handleNodeHover(body.id, hovered)}
            onSelect={() => router.push(body.href)}
          />
        ))}
      </group>

      <group ref={meridianRef}>
        <mesh material={materials.metal}>
          <torusGeometry args={[1.72, 0.015, 3, segments]} />
        </mesh>
      </group>

      <group ref={tiltRef} rotation={[0.95, 0, 0.4]}>
        <mesh material={materials.metal}>
          <torusGeometry args={[1.62, 0.012, 3, Math.round(segments * 0.75)]} />
        </mesh>
      </group>

      {/* Structural frame. A detail-0 octahedron's wireframe is exactly its
          twelve edges — no EdgesGeometry, no second geometry to dispose.
          borderStrong + higher opacity than the original border/0.45: at
          hero size a 1px wireframe line in near-black-on-black was reading
          as absent rather than subtle. */}
      <mesh ref={frameRef}>
        <octahedronGeometry args={[1.34, 0]} />
        <meshBasicMaterial color={tokens.borderStrong} wireframe transparent opacity={0.65} toneMapped={false} />
      </mesh>

      {/* The shell is a housing, not a gem: it has to stay small enough that
          the surrounding mechanism still reads as the subject. */}
      <mesh material={materials.glass} {...selectHandlers}>
        <octahedronGeometry args={[0.38, 0]} />
      </mesh>

      <mesh ref={coreRef} material={materials.core} rotation={[0, Math.PI / 4, 0]} {...selectHandlers}>
        <octahedronGeometry args={[0.22, 0]} />
      </mesh>
    </group>
  );
}
