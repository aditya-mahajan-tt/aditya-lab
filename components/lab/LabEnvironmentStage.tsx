"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { stations, type StationId } from "@/data/stations";
import { CanvasBoundary } from "@/components/hero/CanvasBoundary";
import { StationsFallback } from "@/components/lab/StationsFallback";
import { analytics } from "@/lib/analytics/events";
import { detectCapability, resolveTier, type FallbackReason, type QualityTier } from "@/lib/quality";
import { useLabStore } from "@/lib/store";
import { useSectionScrollProgress } from "@/lib/utils/useSectionScrollProgress";

const LabEnvironmentCanvas = dynamic(() => import("@/three/LabEnvironmentCanvas"), { ssr: false });

/**
 * PLAN.md Phase 13. A tall (280vh) wrapper with a sticky 100vh inner stage:
 * scrolling through the wrapper's own excess height is what drives the
 * camera's orbit (three/systems/OrbitalCameraController) without pinning or
 * capturing the wheel — native scroll the whole way, same contract as the
 * hero's dolly (CLAUDE.md §9).
 *
 * Gating mirrors components/hero/CoreStage: the DOM fallback (
 * StationsFallback) is what every visitor gets first and always keeps, the
 * 3D layer only mounts once the stage is near the viewport and the device
 * can afford it, and any runtime failure drops back to the fallback for the
 * rest of the session.
 */
type Phase = "probing" | "dom" | "mounting" | "live";

const SCROLL_HEIGHT_VH = 280;

export function LabEnvironmentStage() {
  const preference = useLabStore((s) => s.quality);
  const setWebglAvailable = useLabStore((s) => s.setWebglAvailable);

  const [phase, setPhase] = useState<Phase>("probing");
  const [tier, setTier] = useState<Exclude<QualityTier, "low"> | null>(null);
  const [failed, setFailed] = useState(false);
  const [near, setNear] = useState(false);
  const [hoveredId, setHoveredId] = useState<StationId | null>(null);
  const [focusedId, setFocusedId] = useState<StationId | null>(null);

  const sectionRef = useRef<HTMLDivElement>(null);
  const progressRef = useSectionScrollProgress(sectionRef);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const element = sectionRef.current;
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
        setPhase("dom");
        return;
      }

      setFailed(false);
      setTier(resolved.tier);
      setPhase("mounting");
    });

    return () => {
      cancelled = true;
    };
  }, [preference, setWebglAvailable]);

  const abandon = useCallback((reason: FallbackReason) => {
    setPhase("dom");
    setTier(null);
    setFailed(true);
    setFocusedId(null);
    analytics.webglFallback(reason);
  }, []);

  // "Until the visitor scrolls again" (PLAN.md Phase 13) — any scroll while
  // a station is focused hands the camera back to the scroll-driven orbit.
  useEffect(() => {
    if (!focusedId) return;
    const clear = () => setFocusedId(null);
    window.addEventListener("scroll", clear, { passive: true });
    return () => window.removeEventListener("scroll", clear);
  }, [focusedId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFocusedId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSelect = useCallback((id: StationId) => {
    setFocusedId((current) => (current === id ? null : id));
  }, []);

  const live = phase === "live";
  const use3D = tier !== null && near && (phase === "mounting" || live);
  const focusedStation = focusedId ? stations.find((s) => s.id === focusedId) : null;

  const intro = (
    <div className="container-lab">
      <p className="label mb-4">00 — THE LAB</p>
      <h2 id="lab-env-heading" className="text-[length:var(--text-2xl)]">
        Walk through the lab
      </h2>
      <p className="prose-lab mt-2 max-w-[60ch] text-text-muted">
        {use3D
          ? "Scroll to orbit the six stations, or click one to focus it. Every station is also its own page — the list below always works."
          : "Six stations, each also its own page."}
      </p>
    </div>
  );

  // Whether or not the 3D layer ends up mounting, the heading and the rest
  // of this tree stay the same elements throughout — only the wrapper's
  // height and a couple of classes change. Branching into two separate JSX
  // trees here unmounted and remounted #lab-env-heading the moment `use3D`
  // resolved from false to true shortly after first paint, which is a real
  // flash for a visitor, not just a test artifact (it showed up as
  // Playwright losing the heading mid-scroll).
  return (
    <div ref={sectionRef} className="relative" style={use3D ? { height: `${SCROLL_HEIGHT_VH}vh` } : undefined}>
      <div className={use3D ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden" : undefined}>
        {intro}

        {use3D && (
          <div className="relative mx-auto mt-6 h-[46vh] w-full max-w-[880px]">
            <CanvasBoundary onError={() => abandon("runtime-error")}>
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-[var(--duration-slow)] ease-[var(--ease-out-lab)] data-[ready=true]:opacity-100"
                data-ready={live}
              >
                <LabEnvironmentCanvas
                  tier={tier}
                  progressRef={progressRef}
                  hoveredId={hoveredId}
                  focusedId={focusedId}
                  onHoverChange={setHoveredId}
                  onSelect={handleSelect}
                  onReady={() => setPhase("live")}
                  onFailure={abandon}
                  onTierChange={(next) => next !== "low" && setTier(next)}
                />
              </div>
            </CanvasBoundary>

            {focusedStation && (
              <div className="absolute bottom-4 left-1/2 w-[min(360px,90%)] -translate-x-1/2 border border-border-strong bg-surface p-4">
                <p className="label text-accent">{focusedStation.label}</p>
                <p className="mt-2 text-[length:var(--text-sm)] text-text-muted">{focusedStation.description}</p>
                <a
                  href={focusedStation.route}
                  data-cursor="interact"
                  className="mt-3 inline-block font-mono text-xs uppercase tracking-widest text-accent hover:underline"
                >
                  Open {focusedStation.label} →
                </a>
              </div>
            )}
          </div>
        )}

        {!use3D && failed && (
          <p role="status" className="label mt-4 text-center text-text-faint">
            3D LAB UNAVAILABLE — SWITCHING TO LIGHT MODE
          </p>
        )}

        {!use3D && (
          <div className="container-lab mt-8">
            <StationsFallback />
          </div>
        )}
      </div>

      {/* Below the sticky viewport, in normal flow at the bottom of the tall
          wrapper — reached once the scroll-driven orbit finishes. */}
      {use3D && (
        <div className="container-lab absolute bottom-0 left-0 right-0 pb-16">
          <StationsFallback />
        </div>
      )}
    </div>
  );
}
