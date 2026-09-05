"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { stations, type StationId } from "@/data/stations";
import { CanvasBoundary } from "@/components/hero/CanvasBoundary";
import { StationsFallback } from "@/components/lab/StationsFallback";
import { analytics } from "@/lib/analytics/events";
import { detectCapability, resolveTier, type FallbackReason, type QualityTier } from "@/lib/quality";
import { stationProgress } from "@/lib/stationLayout";
import { useLabStore } from "@/lib/store";
import { useWheelOrbitProgress } from "@/lib/utils/useWheelOrbitProgress";

const LabEnvironmentCanvas = dynamic(() => import("@/three/LabEnvironmentCanvas"), { ssr: false });

/**
 * PLAN.md Phase 13. The stage keeps its own scroll (lib/utils/
 * useWheelOrbitProgress), captured only while the pointer is over it — the
 * orbit used to ride the page's own scroll through a tall sticky wrapper,
 * which Aditya asked to split apart in favour of a dedicated widget scroll
 * plus explicit prev/next controls, so the stage sits at a fixed height
 * like any other section instead of reserving several screens of page
 * length for itself.
 *
 * Gating still mirrors components/hero/CoreStage: the DOM fallback (
 * StationsFallback) is what every visitor gets first and always keeps, the
 * 3D layer only mounts once the stage is near the viewport and the device
 * can afford it, and any runtime failure drops back to the fallback for the
 * rest of the session.
 */
type Phase = "probing" | "dom" | "mounting" | "live";

const STATION_COUNT = stations.length;

export function LabEnvironmentStage() {
  const preference = useLabStore((s) => s.quality);
  const setWebglAvailable = useLabStore((s) => s.setWebglAvailable);

  const [phase, setPhase] = useState<Phase>("probing");
  const [tier, setTier] = useState<Exclude<QualityTier, "low"> | null>(null);
  const [failed, setFailed] = useState(false);
  const [near, setNear] = useState(false);
  const [hoveredId, setHoveredId] = useState<StationId | null>(null);
  const [focusedId, setFocusedId] = useState<StationId | null>(null);

  // `rootRef` always exists (used to detect "near the viewport" before the
  // 3D layer is even a candidate to mount); `canvasBoxRef` only exists once
  // `use3D` is true (used for the stage's own wheel capture).
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasBoxRef = useRef<HTMLDivElement>(null);

  const live = phase === "live";
  const use3D = tier !== null && near && (phase === "mounting" || live);

  const clearFocus = useCallback(() => setFocusedId(null), []);
  const progressRef = useWheelOrbitProgress(canvasBoxRef, use3D, clearFocus);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const element = rootRef.current;
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

  /** Where "prev/next" step from: the focused station if there is one, else
   * whichever station the free-orbiting camera is currently nearest to. */
  const currentOrder = useCallback(() => {
    if (focusedId) {
      const found = stations.find((s) => s.id === focusedId);
      if (found) return found.order;
    }
    return Math.round(progressRef.current * (STATION_COUNT - 1));
  }, [focusedId, progressRef]);

  const step = useCallback(
    (delta: 1 | -1) => {
      const nextOrder = Math.min(STATION_COUNT - 1, Math.max(0, currentOrder() + delta));
      const target = stations.find((s) => s.order === nextOrder);
      if (!target) return;
      progressRef.current = stationProgress(target.order, STATION_COUNT);
      setFocusedId(target.id);
    },
    [currentOrder, progressRef],
  );

  const focusedStation = focusedId ? stations.find((s) => s.id === focusedId) : null;
  const highlightedId = focusedId ?? hoveredId;
  const order = use3D ? currentOrder() : 0;

  return (
    <div ref={rootRef}>
      <div className="container-lab">
        <p className="label mb-4">00 — THE LAB</p>
        <h2 id="lab-env-heading" className="text-[length:var(--text-2xl)]">
          Walk through the lab
        </h2>
        <p className="prose-lab mt-2 max-w-[60ch] text-text-muted">
          {use3D
            ? "Scroll over the stage, use the arrows, or click a station to focus it. Every station is also its own page."
            : "Six stations, each also its own page."}
        </p>
      </div>

      {use3D && (
        <div className="container-lab mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={order === 0}
            data-cursor="interact"
            aria-label="Previous station"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-sm border border-accent text-accent transition-colors duration-[var(--duration-fast)] hover:bg-accent hover:text-bg disabled:cursor-not-allowed disabled:border-border-strong disabled:text-text-faint disabled:hover:bg-transparent disabled:hover:text-text-faint"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2 4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div
            ref={canvasBoxRef}
            className="relative h-[52vh] w-full overflow-hidden border border-border bg-surface"
          >
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

          <button
            type="button"
            onClick={() => step(1)}
            disabled={order === STATION_COUNT - 1}
            data-cursor="interact"
            aria-label="Next station"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-sm border border-accent text-accent transition-colors duration-[var(--duration-fast)] hover:bg-accent hover:text-bg disabled:cursor-not-allowed disabled:border-border-strong disabled:text-text-faint disabled:hover:bg-transparent disabled:hover:text-text-faint"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5 2 10 7l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {!use3D && failed && (
        <p role="status" className="label mt-4 text-center text-text-faint">
          3D LAB UNAVAILABLE — SWITCHING TO LIGHT MODE
        </p>
      )}

      <div className="container-lab mt-10">
        <StationsFallback highlightedId={highlightedId} />
      </div>
    </div>
  );
}
