"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { FallbackReason, QualityTier } from "@/lib/quality";
import { Bloom } from "@/three/effects/Bloom";
import { ProgressionCore } from "@/three/objects/ProgressionCore";
import { ProgressionCameraController } from "@/three/systems/ProgressionCameraController";
import { PerformanceManager } from "@/three/systems/PerformanceManager";
import { Environment } from "./Environment";
import { Lighting } from "./Lighting";

type Props = {
  tier: Exclude<QualityTier, "low">;
  activeStage: number | null;
  onSelectStage: (index: number) => void;
  onReady: () => void;
  onDowngrade: (tier: QualityTier) => void;
  onGiveUp: (reason: FallbackReason) => void;
  onHoverChange: (hovered: boolean) => void;
};

/** Fires once the renderer has put actual pixels on screen — see three/scene/Scene.tsx's FirstFrame. */
function FirstFrame({ onReady }: { onReady: () => void }) {
  const fired = useRef(false);
  const callback = useRef(onReady);

  useEffect(() => {
    callback.current = onReady;
  }, [onReady]);

  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    callback.current();
  });

  return null;
}

/** Composition root for the /about identity map — mirrors three/scene/Scene.tsx's shape. */
export function ProgressionScene({
  tier,
  activeStage,
  onSelectStage,
  onReady,
  onDowngrade,
  onGiveUp,
  onHoverChange,
}: Props) {
  return (
    <>
      <Environment />
      <Lighting />
      <ProgressionCameraController />
      <PerformanceManager tier={tier} onDowngrade={onDowngrade} onGiveUp={onGiveUp} />
      <ProgressionCore tier={tier} activeStage={activeStage} onSelectStage={onSelectStage} onHoverChange={onHoverChange} />
      <FirstFrame onReady={onReady} />
      {tier === "high" && <Bloom />}
    </>
  );
}
