"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { dprFor, type FallbackReason, type QualityTier } from "@/lib/quality";
import { Scene } from "./scene/Scene";

/**
 * The only entry point into `three/` (ARCHITECTURE.md §2). Nothing outside
 * this file may import Three.js, directly or transitively — everything in
 * this chunk exists behind the dynamic import in
 * components/hero/CoreStage.
 *
 * The canvas is `aria-hidden` and holds no unique content: everything it
 * draws is also drawn by components/hero/CoreFallback, which stays in the
 * DOM underneath it (CLAUDE.md §3.5, PLAN.md Phase 8).
 */

type Props = {
  tier: Exclude<QualityTier, "low">;
  /** First frame is on screen — the caller cross-fades the DOM core out. */
  onReady: () => void;
  /** 3D is over; swap back to the DOM core permanently. */
  onFailure: (reason: FallbackReason) => void;
  /** The runtime tier changed under us, for the quality readout. */
  onTierChange?: (tier: QualityTier) => void;
};

export default function LabCanvas({ tier: initialTier, onReady, onFailure, onTierChange }: Props) {
  const [tier, setTier] = useState<Exclude<QualityTier, "low">>(initialTier);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setTier(initialTier);
  }, [initialTier]);

  /**
   * A hero that has scrolled away must not keep a render loop warm. R3F's
   * "never" frameloop stops rAF entirely; flipping back to "always" resumes
   * and renders immediately.
   */
  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setVisible(entry.isIntersecting);
      },
      { rootMargin: "120px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleContextLost = useCallback(
    (event: Event) => {
      // preventDefault() asks the browser for a restore; we do not want one.
      // The component unmounts on the next render and the DOM core returns,
      // which is a more honest recovery than a black canvas that may or may
      // not come back.
      event.preventDefault();
      onFailure("context-lost");
    },
    [onFailure],
  );

  useEffect(() => {
    return () => {
      canvasRef.current?.removeEventListener("webglcontextlost", handleContextLost);
    };
  }, [handleContextLost]);

  const handleDowngrade = useCallback(
    (next: QualityTier) => {
      if (next === "low") return;
      setTier(next);
      onTierChange?.(next);
    },
    [onTierChange],
  );

  return (
    <div ref={containerRef} className="h-full w-full" aria-hidden="true">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={dprFor(tier)}
        camera={{ position: [0, 0, 5.2], fov: 38, near: 0.1, far: 20 }}
        gl={{
          alpha: true,
          antialias: tier === "high",
          powerPreference: "high-performance",
          // A "yes, but slowly" context is still better than no hero visual
          // once we have decided to render — lib/quality already declined
          // software renderers on the auto path.
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
          gl.domElement.addEventListener("webglcontextlost", handleContextLost);
        }}
      >
        <Scene tier={tier} onReady={onReady} onDowngrade={handleDowngrade} onGiveUp={onFailure} />
      </Canvas>
    </div>
  );
}
