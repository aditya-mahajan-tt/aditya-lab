"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasBoundary } from "@/components/hero/CanvasBoundary";
import { CoreFallback } from "@/components/hero/CoreFallback";
import { analytics } from "@/lib/analytics/events";
import { detectCapability, resolveTier, type FallbackReason, type QualityTier } from "@/lib/quality";
import { useLabStore } from "@/lib/store";

/**
 * The gate between the DOM core and the 3D core (PLAN.md Phase 8).
 *
 * The DOM core renders first, always, and never leaves the document — it is
 * the accessible representation of the object and the thing every visitor
 * on a declined device, a dead context or reduced motion actually sees. The
 * 3D layer is an overlay that has to earn its place: it fades in only once
 * a real frame is on screen, and it is dropped permanently the moment it
 * misbehaves.
 *
 * `ssr: false` plus a dynamic import is what keeps Three.js out of the
 * initial bundle — enforced by scripts/check-bundle.mjs, not by hope.
 */
const LabCanvas = dynamic(() => import("@/three/LabCanvas"), { ssr: false });

type Phase = "probing" | "dom" | "mounting" | "live";

export function CoreStage() {
  const preference = useLabStore((s) => s.quality);
  const setWebglAvailable = useLabStore((s) => s.setWebglAvailable);

  const [phase, setPhase] = useState<Phase>("probing");
  const [tier, setTier] = useState<Exclude<QualityTier, "low"> | null>(null);
  const [failed, setFailed] = useState(false);
  const [near, setNear] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  /**
   * On a phone the core sits below the fold. Downloading a quarter-megabyte
   * of renderer for something the visitor may never scroll to is exactly the
   * kind of cost QA_AND_PERFORMANCE.md §1 budgets against, so the dynamic
   * import does not even begin until the stage is approaching the viewport.
   */
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }

    const element = stageRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    detectCapability().then((capability) => {
      if (cancelled) return;

      setWebglAvailable(capability.webgl);
      const resolved = resolveTier(capability, preference);

      if (!resolved.tier || resolved.tier === "low") {
        analytics.webglFallback(resolved.reason ?? "no-webgl");
        setPhase("dom");
        return;
      }

      analytics.qualityTier(resolved.tier);
      setFailed(false);
      setTier(resolved.tier);
      setPhase("mounting");
    });

    return () => {
      cancelled = true;
    };
  }, [preference, setWebglAvailable]);

  /**
   * One-way door: whatever went wrong, the 3D layer does not get a second
   * attempt in this session unless the visitor explicitly asks for one via
   * the quality control.
   */
  const abandon = useCallback(
    (reason: FallbackReason) => {
      setPhase("dom");
      setTier(null);
      setFailed(true);
      setWebglAvailable(false);
      analytics.webglFallback(reason);
    },
    [setWebglAvailable],
  );

  const handleBoundaryError = useCallback(
    (message: string) => {
      console.warn("[lab] 3D layer failed, falling back to the DOM core:", message);
      abandon("runtime-error");
    },
    [abandon],
  );

  const live = phase === "live";

  return (
    <div ref={stageRef} className="relative mx-auto w-full max-w-[420px]">
      <CoreFallback suppressed={live} />

      {tier && near && (phase === "mounting" || live) && (
        <CanvasBoundary onError={handleBoundaryError}>
          <div
            className="pointer-events-auto absolute inset-0 opacity-0 transition-opacity duration-[var(--duration-slow)] ease-[var(--ease-out-lab)] data-[ready=true]:opacity-100"
            data-ready={live}
            style={{ zIndex: "var(--z-canvas)" }}
          >
            <LabCanvas
              tier={tier}
              onReady={() => setPhase("live")}
              onFailure={abandon}
              onTierChange={(next) => next !== "low" && setTier(next)}
            />
          </div>
        </CanvasBoundary>
      )}

      {failed && (
        <p role="status" className="label mt-4 text-center text-text-faint">
          3D EXPERIENCE UNAVAILABLE — SWITCHING TO LIGHT MODE
        </p>
      )}
    </div>
  );
}
