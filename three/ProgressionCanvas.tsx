"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { dprFor, type FallbackReason, type QualityTier } from "@/lib/quality";
import { ProgressionScene } from "./scene/ProgressionScene";

/**
 * The second (and only other) consumer of three/, alongside three/LabCanvas
 * — the dynamic-import entry point for the /about identity map. Same
 * aria-hidden / no-unique-content contract: everything drawn here is also
 * drawn by components/about/ProgressionFallback, which stays in the DOM
 * as the real control surface regardless of whether this ever mounts.
 */
type Props = {
  tier: Exclude<QualityTier, "low">;
  activeStage: number | null;
  onSelectStage: (index: number) => void;
  onReady: () => void;
  onFailure: (reason: FallbackReason) => void;
  onTierChange?: (tier: QualityTier) => void;
};

export default function ProgressionCanvas({
  tier: initialTier,
  activeStage,
  onSelectStage,
  onReady,
  onFailure,
  onTierChange,
}: Props) {
  const [tier, setTier] = useState<Exclude<QualityTier, "low">>(initialTier);
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
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
    <div ref={containerRef} className="h-full w-full" aria-hidden="true" data-cursor={hovered ? "interact" : undefined}>
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={dprFor(tier)}
        camera={{ position: [0, 0, 5.2], fov: 38, near: 0.1, far: 20 }}
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
        <ProgressionScene
          tier={tier}
          activeStage={activeStage}
          onSelectStage={onSelectStage}
          onReady={onReady}
          onDowngrade={handleDowngrade}
          onGiveUp={onFailure}
          onHoverChange={setHovered}
        />
      </Canvas>
    </div>
  );
}
