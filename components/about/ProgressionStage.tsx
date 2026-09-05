"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasBoundary } from "@/components/hero/CanvasBoundary";
import { ProgressionFallback } from "@/components/about/ProgressionFallback";
import { analytics } from "@/lib/analytics/events";
import { detectCapability, resolveTier, type FallbackReason, type QualityTier } from "@/lib/quality";
import { useLabStore } from "@/lib/store";

const ProgressionCanvas = dynamic(() => import("@/three/ProgressionCanvas"), { ssr: false });

type Phase = "probing" | "dom" | "mounting" | "live";

/**
 * Orchestrates the identity progression map (design spec §3.2). Deliberately
 * NOT a crossfade the way components/hero/CoreStage is:
 * components/about/ProgressionFallback is the permanent, fully-functional
 * control surface — its <details> are what a keyboard/screen-reader user
 * actually operates — not a decorative lookalike that goes inert once 3D
 * loads. It never dims or hides; it just gains a 3D companion visual above
 * it when one successfully mounts.
 */
export function ProgressionStage() {
  const preference = useLabStore((s) => s.quality);
  const setWebglAvailable = useLabStore((s) => s.setWebglAvailable);

  const [phase, setPhase] = useState<Phase>("probing");
  const [tier, setTier] = useState<Exclude<QualityTier, "low"> | null>(null);
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [near, setNear] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

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
      setTier(resolved.tier);
      setPhase("mounting");
    });
    return () => {
      cancelled = true;
    };
  }, [preference, setWebglAvailable]);

  const abandon = useCallback(
    (reason: FallbackReason) => {
      setPhase("dom");
      setTier(null);
      setWebglAvailable(false);
      analytics.webglFallback(reason);
    },
    [setWebglAvailable],
  );

  // Read the *latest* activeStage via the functional updater, not the
  // `index` captured at closure-creation time: ProgressionFallback's own
  // effect sometimes sets a <details> element's `.open` to false
  // programmatically (e.g. in response to a 3D node click elsewhere), and
  // that programmatic write fires a native `toggle` event too — reaching
  // this handler as a "close" for a stage that isn't the active one
  // anymore. Comparing against the freshest `current` makes that echoed
  // event a no-op instead of clobbering the real selection.
  const handleToggle = useCallback((index: number, open: boolean) => {
    setActiveStage((current) => (open ? index : current === index ? null : current));
  }, []);

  const live = phase === "live";

  return (
    <div ref={stageRef}>
      {tier && near && (phase === "mounting" || live) && (
        <CanvasBoundary
          onError={(message) => {
            console.warn("[lab] progression map failed, falling back to the DOM list:", message);
            abandon("runtime-error");
          }}
        >
          <div
            className="relative mx-auto mb-8 aspect-square w-full max-w-[320px] opacity-0 transition-opacity duration-[var(--duration-slow)] ease-[var(--ease-out-lab)] data-[ready=true]:opacity-100"
            data-ready={live}
          >
            <ProgressionCanvas
              tier={tier}
              activeStage={activeStage}
              onSelectStage={(i) => setActiveStage((current) => (current === i ? null : i))}
              onReady={() => setPhase("live")}
              onFailure={abandon}
              onTierChange={(next) => next !== "low" && setTier(next)}
            />
          </div>
        </CanvasBoundary>
      )}

      <ProgressionFallback activeStage={activeStage} onToggle={handleToggle} />
    </div>
  );
}
