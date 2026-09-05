"use client";

import { useMemo, type RefObject } from "react";
import type { FallbackReason, QualityTier } from "@/lib/quality";
import { stations as allStations, type StationId } from "@/data/stations";
import { Hub } from "@/three/objects/stations/Hub";
import { StationMarkers } from "@/three/objects/stations/StationMarkers";
import { Workstation } from "@/three/objects/stations/Workstation";
import { FirstFrame } from "@/three/systems/FirstFrame";
import { OrbitalCameraController, stationAngleDeg } from "@/three/systems/OrbitalCameraController";
import { PerformanceManager } from "@/three/systems/PerformanceManager";
import { Environment } from "./Environment";
import { Lighting } from "./Lighting";

const STATION_RING_RADIUS = 2.6;

type Props = {
  tier: Exclude<QualityTier, "low">;
  progressRef: RefObject<number>;
  hoveredId: StationId | null;
  focusedId: StationId | null;
  onHoverChange: (id: StationId | null) => void;
  onSelect: (id: StationId) => void;
  onReady: () => void;
  onDowngrade: (tier: QualityTier) => void;
  onGiveUp: (reason: FallbackReason) => void;
};

/** Composition root for the Lab environment (PLAN.md Phase 13). */
export function LabEnvironmentScene({
  tier,
  progressRef,
  hoveredId,
  focusedId,
  onHoverChange,
  onSelect,
  onReady,
  onDowngrade,
  onGiveUp,
}: Props) {
  const layout = useMemo(() => {
    const count = allStations.length;
    const angles = {} as Record<StationId, number>;
    const positions = {} as Record<StationId, readonly [number, number, number]>;

    for (const station of allStations) {
      const deg = stationAngleDeg(station.order, count);
      angles[station.id] = deg;
      const rad = (deg * Math.PI) / 180;
      positions[station.id] = [Math.cos(rad) * STATION_RING_RADIUS, 0, Math.sin(rad) * STATION_RING_RADIUS];
    }

    return { angles, positions };
  }, []);

  const workstation = allStations.find((s) => s.id === "workstation")!;
  const unbuilt = allStations.filter((s) => s.id !== "workstation");

  return (
    <>
      <Environment />
      <Lighting />
      <OrbitalCameraController progressRef={progressRef} angles={layout.angles} focusedId={focusedId} />
      <PerformanceManager tier={tier} onDowngrade={onDowngrade} onGiveUp={onGiveUp} />

      <Hub tier={tier} />

      <group position={layout.positions[workstation.id]} rotation={[0, -((layout.angles[workstation.id] * Math.PI) / 180), 0]}>
        <Workstation
          hovered={hoveredId === workstation.id}
          focused={focusedId === workstation.id}
          onHoverChange={(h) => onHoverChange(h ? workstation.id : null)}
          onSelect={() => onSelect(workstation.id)}
        />
      </group>

      <StationMarkers
        items={unbuilt.map((s) => ({ id: s.id, position: layout.positions[s.id] }))}
        hoveredId={hoveredId}
        focusedId={focusedId}
        onHoverChange={onHoverChange}
        onSelect={onSelect}
      />

      <FirstFrame onReady={onReady} />
    </>
  );
}
