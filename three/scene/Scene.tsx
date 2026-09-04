"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { FallbackReason, QualityTier } from "@/lib/quality";
import { Bloom } from "@/three/effects/Bloom";
import { Core } from "@/three/objects/Core";
import { CameraController } from "@/three/systems/CameraController";
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

/**
 * Fires once the renderer has actually put pixels on screen. `onCreated`
 * fires when the context exists, which is up to several hundred ms before
 * the first frame — cross-fading on it would flash an empty canvas over the
 * DOM core.
 */
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
