"use client";

import { useMemo, type ComponentType, type RefObject } from "react";
import type { FallbackReason, QualityTier } from "@/lib/quality";
import { stations as allStations, type StationId } from "@/data/stations";
import { AutomationEngine } from "@/three/objects/stations/AutomationEngine";
import { CommunicationTerminal } from "@/three/objects/stations/CommunicationTerminal";
import { ExperimentTable } from "@/three/objects/stations/ExperimentTable";
import { Hub } from "@/three/objects/stations/Hub";
import { NeuralCore } from "@/three/objects/stations/NeuralCore";
import { StrategyWall } from "@/three/objects/stations/StrategyWall";
import { Workstation } from "@/three/objects/stations/Workstation";
import { FirstFrame } from "@/three/systems/FirstFrame";
import { OrbitalCameraController } from "@/three/systems/OrbitalCameraController";
import { PerformanceManager } from "@/three/systems/PerformanceManager";
import { stationAngleDeg } from "@/lib/stationLayout";
import { Environment } from "./Environment";
import { Lighting } from "./Lighting";

const STATION_RING_RADIUS = 2.6;

type StationObjectProps = {
  label: string;
  hovered: boolean;
  focused: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
};

/** Every station now has its own object (PLAN.md Phase 13) — no shared
 * placeholder mesh left; see the removed StationMarkers. */
const STATION_OBJECTS: Record<StationId, ComponentType<StationObjectProps>> = {
  workstation: Workstation,
  "neural-core": NeuralCore,
  "automation-engine": AutomationEngine,
  "strategy-wall": StrategyWall,
  "experiment-table": ExperimentTable,
  "communication-terminal": CommunicationTerminal,
};

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

  return (
    <>
      <Environment />
      <Lighting />
      <OrbitalCameraController progressRef={progressRef} angles={layout.angles} focusedId={focusedId} />
      <PerformanceManager tier={tier} onDowngrade={onDowngrade} onGiveUp={onGiveUp} />

      <Hub tier={tier} />

      {allStations.map((station) => {
        const StationObject = STATION_OBJECTS[station.id];
        return (
          <group
            key={station.id}
            position={layout.positions[station.id]}
            rotation={[0, -((layout.angles[station.id] * Math.PI) / 180), 0]}
          >
            <StationObject
              label={station.label}
              hovered={hoveredId === station.id}
              focused={focusedId === station.id}
              onHoverChange={(h) => onHoverChange(h ? station.id : null)}
              onSelect={() => onSelect(station.id)}
            />
          </group>
        );
      })}

      <FirstFrame onReady={onReady} />
    </>
  );
}
