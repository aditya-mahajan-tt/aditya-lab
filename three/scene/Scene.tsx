"use client";

import type { PlaneValue } from "@/data/schema";
import type { HeroBody } from "@/data/queries";
import type { FallbackReason, QualityTier } from "@/lib/quality";
import { Bloom } from "@/three/effects/Bloom";
import { Core } from "@/three/objects/Core";
import { CameraController } from "@/three/systems/CameraController";
import { FirstFrame } from "@/three/systems/FirstFrame";
import { PerformanceManager } from "@/three/systems/PerformanceManager";
import { Environment } from "./Environment";
import { Lighting } from "./Lighting";

type Props = {
  tier: Exclude<QualityTier, "low">;
  onReady: () => void;
  onDowngrade: (tier: QualityTier) => void;
  onGiveUp: (reason: FallbackReason) => void;
  /** The hero bodies, from `getHeroBodies()` — the same list layers 0 and 1 draw. */
  bodies: HeroBody[];
  activeBodyId: string | null;
  /** `null` on desktop; the mobile tabs' selected plane otherwise. */
  activePlane: PlaneValue | null;
  /** The body under the pointer, or `null` when nothing responsive is. */
  onBodyHover: (id: string | null) => void;
};

/** Composition root for the 3D layer. Holds no content of its own. */
export function Scene({ tier, onReady, onDowngrade, onGiveUp, bodies, activeBodyId, activePlane, onBodyHover }: Props) {
  return (
    <>
      <Environment />
      <Lighting />
      <CameraController />
      <PerformanceManager tier={tier} onDowngrade={onDowngrade} onGiveUp={onGiveUp} />
      <Core tier={tier} bodies={bodies} activeBodyId={activeBodyId} activePlane={activePlane} onBodyHover={onBodyHover} />
      <FirstFrame onReady={onReady} />
      {tier === "high" && <Bloom />}
    </>
  );
}
