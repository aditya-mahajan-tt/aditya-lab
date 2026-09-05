"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Color, InstancedMesh, MathUtils, Matrix4 } from "three";
import type { StationId } from "@/data/stations";
import { createMetalMaterial } from "@/three/materials/MetalMaterial";
import { readTokens } from "@/three/materials/tokens";

/**
 * Placeholder markers for the five stations that don't have a built object
 * yet (PLAN.md Phase 13 is landing one station at a time — see
 * data/stations.ts `built`). One `InstancedMesh` per part — pole and cap —
 * satisfies the phase's "instancing" requirement honestly: these five really
 * are identical repeated geometry, not a real object cut down to force the
 * technique.
 *
 * Each instance still gets its own hover/focus/click via `event.instanceId`
 * and an `instanceColor`, so clicking an unbuilt station already opens its
 * real detail + route — only the mesh is a stand-in.
 */
const POLE_HEIGHT = 0.4;

type Item = { id: StationId; position: readonly [number, number, number] };

type Props = {
  items: Item[];
  hoveredId: StationId | null;
  focusedId: StationId | null;
  onHoverChange: (id: StationId | null) => void;
  onSelect: (id: StationId) => void;
};

export function StationMarkers({ items, hoveredId, focusedId, onHoverChange, onSelect }: Props) {
  const tokens = useMemo(readTokens, []);
  const metal = useMemo(() => createMetalMaterial(tokens), [tokens]);
  const restColor = useMemo(() => new Color(tokens.borderStrong), [tokens]);
  const activeColor = useMemo(() => new Color(tokens.accentDim), [tokens]);

  useEffect(() => () => metal.dispose(), [metal]);

  const poleRef = useRef<InstancedMesh>(null);
  const capRef = useRef<InstancedMesh>(null);
  const lit = useRef<number[]>(items.map(() => 0));

  useEffect(() => {
    const matrix = new Matrix4();
    items.forEach((item, i) => {
      matrix.makeTranslation(item.position[0], item.position[1] + POLE_HEIGHT / 2, item.position[2]);
      poleRef.current?.setMatrixAt(i, matrix);
      matrix.makeTranslation(item.position[0], item.position[1] + POLE_HEIGHT, item.position[2]);
      capRef.current?.setMatrixAt(i, matrix);
    });
    if (poleRef.current) poleRef.current.instanceMatrix.needsUpdate = true;
    if (capRef.current) capRef.current.instanceMatrix.needsUpdate = true;
  }, [items]);

  useFrame((_, delta) => {
    const step = Math.min(delta, 1 / 30);
    let changed = false;

    items.forEach((item, i) => {
      const target = item.id === hoveredId || item.id === focusedId ? 1 : 0;
      const next = MathUtils.damp(lit.current[i] ?? 0, target, 6, step);
      if (Math.abs(next - (lit.current[i] ?? 0)) > 0.001) changed = true;
      lit.current[i] = next;

      const color = restColor.clone().lerp(activeColor, next);
      poleRef.current?.setColorAt(i, color);
      capRef.current?.setColorAt(i, color);
    });

    if (changed) {
      if (poleRef.current?.instanceColor) poleRef.current.instanceColor.needsUpdate = true;
      if (capRef.current?.instanceColor) capRef.current.instanceColor.needsUpdate = true;
    }
  });

  function handlePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    const item = items[e.instanceId ?? -1];
    if (item) onHoverChange(item.id);
  }

  function handlePointerOut(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    onHoverChange(null);
  }

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    const item = items[e.instanceId ?? -1];
    if (item) onSelect(item.id);
  }

  return (
    <>
      <instancedMesh
        ref={poleRef}
        args={[undefined, undefined, items.length]}
        material={metal}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <cylinderGeometry args={[0.02, 0.02, POLE_HEIGHT, 8]} />
      </instancedMesh>
      <instancedMesh ref={capRef} args={[undefined, undefined, items.length]} material={metal}>
        <octahedronGeometry args={[0.05, 0]} />
      </instancedMesh>
    </>
  );
}
