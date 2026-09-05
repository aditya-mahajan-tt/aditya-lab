"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Fires once the renderer has actually put pixels on screen. `onCreated`
 * fires when the context exists, which is up to several hundred ms before
 * the first frame — cross-fading on it would flash an empty canvas over the
 * DOM fallback underneath. Shared by every 3D scene root (three/scene/Scene,
 * three/scene/LabEnvironmentScene).
 */
export function FirstFrame({ onReady }: { onReady: () => void }) {
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
