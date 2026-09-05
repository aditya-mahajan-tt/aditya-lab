"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { dprFor, type FallbackReason, type QualityTier } from "@/lib/quality";
import type { StationId } from "@/data/stations";
import { LabEnvironmentScene } from "./scene/LabEnvironmentScene";

/**
 * The Lab environment's entry point into `three/` (ARCHITECTURE.md §2),
 * mirroring three/LabCanvas — a second, independent Canvas rather than a
 * second scene bolted onto the hero's, since the two mount at different
 * scroll positions and must be free to fail independently (a dead hero
 * context should not take the Lab stations down with it, and vice versa).
 */
type Props = {
  tier: Exclude<QualityTier, "low">;
  progressRef: RefObject<number>;
  hoveredId: StationId | null;
  focusedId: StationId | null;
  onHoverChange: (id: StationId | null) => void;
  onSelect: (id: StationId) => void;
  onReady: () => void;
  onFailure: (reason: FallbackReason) => void;
  onTierChange?: (tier: QualityTier) => void;
};

export default function LabEnvironmentCanvas({
  tier: initialTier,
  progressRef,
  hoveredId,
  focusedId,
  onHoverChange,
  onSelect,
  onReady,
  onFailure,
  onTierChange,
}: Props) {
  const [tier, setTier] = useState<Exclude<QualityTier, "low">>(initialTier);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setTier(initialTier);
  }, [initialTier]);

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
    <div ref={containerRef} className="h-full w-full" aria-hidden="true" data-cursor={hoveredId ? "interact" : undefined}>
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={dprFor(tier)}
        camera={{ position: [0, 1.5, 5.4], fov: 45, near: 0.1, far: 30 }}
        gl={{
          alpha: true,
          antialias: tier === "high",
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
          gl.domElement.addEventListener("webglcontextlost", handleContextLost);
        }}
      >
        <LabEnvironmentScene
          tier={tier}
          progressRef={progressRef}
          hoveredId={hoveredId}
          focusedId={focusedId}
          onHoverChange={onHoverChange}
          onSelect={onSelect}
          onReady={onReady}
          onDowngrade={handleDowngrade}
          onGiveUp={onFailure}
        />
      </Canvas>
    </div>
  );
}
