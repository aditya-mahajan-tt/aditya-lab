"use client";

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
  /** True while the pointer is over something the object responds to. */
  onHoverChange: (hovered: boolean) => void;
};

/** Composition root for the 3D layer. Holds no content of its own. */
export function Scene({ tier, onReady, onDowngrade, onGiveUp, onHoverChange }: Props) {
  return (
    <>
      <Environment />
      <Lighting />
      <CameraController />
      <PerformanceManager tier={tier} onDowngrade={onDowngrade} onGiveUp={onGiveUp} />
      <Core tier={tier} onHoverChange={onHoverChange} />
      <FirstFrame onReady={onReady} />
      {tier === "high" && <Bloom />}
    </>
  );
}
