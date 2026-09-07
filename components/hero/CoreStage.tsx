"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasBoundary } from "@/components/hero/CanvasBoundary";
import { CoreFallback } from "@/components/hero/CoreFallback";
import { OrbitalTabs } from "@/components/hero/OrbitalTabs";
import { Fill } from "@/components/ui/Placeholder";
import type { PlaneValue } from "@/data/schema";
import { getHeroBodies } from "@/data/queries";
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
  const [activeBodyId, setActiveBodyId] = useState<string | null>(null);
  const [activePlane, setActivePlane] = useState<PlaneValue>("ai");
  const stageRef = useRef<HTMLDivElement>(null);

  const bodies = useMemo(() => getHeroBodies(), []);
  const activeBody = useMemo(() => bodies.find((b) => b.id === activeBodyId) ?? null, [bodies, activeBodyId]);

  /**
   * The plane tabs are `md:hidden` (components/hero/OrbitalTabs), so above
   * `md` there is no way to change `activePlane` and it keeps its "ai"
   * default forever — a selection nobody made. Both consumers therefore get
   * `null` on desktop rather than the raw value:
   *
   * - the 3D layer, because "face the selected plane at the camera" would
   *   pin the assembly at the AI angle and stop the idle rotation outright;
   * - CoreFallback, because its per-body `dimmed` drives the *visual*
   *   dimming (CSS-gated by `md:opacity-100`, so harmless) but also
   *   `tabIndex`, which is a real prop and not gated by anything — passing
   *   the raw value left 6 of the 11 fully visible desktop bodies at
   *   `tabindex="-1"`.
   */
  const [planeGated, setPlaneGated] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(min-width: 768px)");
    const sync = () => setPlaneGated(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

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
    <div ref={stageRef} className="mx-auto w-full max-w-[420px]">
      {/* Lifted above the 3D layer explicitly: the canvas overlay takes
          pointer events, so any stacking accident that put it over the tabs
          would swallow every tap meant for them — which is exactly when the
          tabs matter most, since they also drive the 3D layer's "face the
          selected plane" rotation. */}
      <div className="relative" style={{ zIndex: "var(--z-content)" }}>
        <OrbitalTabs active={activePlane} onChange={setActivePlane} />
      </div>

      {/* The positioning parent for the canvas overlay is this wrapper, not
          the stage: it holds the SVG core and nothing else, so `inset-0`
          resolves to exactly the SVG's box. three/objects/Core depends on
          that — the 3D core is the same object at the same size as the SVG,
          and CameraController frames it with a fixed vertical FOV, so a
          taller box (the tabs above, the caption below) would silently
          render the 3D core larger than the SVG it cross-fades with. */}
      <div className="relative">
        <CoreFallback
          suppressed={live}
          bodies={bodies}
          activePlane={planeGated ? activePlane : null}
          activeBodyId={activeBodyId}
          onBodyHover={setActiveBodyId}
        />

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
                bodies={bodies}
                activeBodyId={activeBodyId}
                activePlane={planeGated ? activePlane : null}
                onBodyHover={setActiveBodyId}
              />
            </div>
          </CanvasBoundary>
        )}
      </div>

      {failed && (
        <p role="status" className="label mt-4 text-center text-text-faint">
          3D EXPERIENCE UNAVAILABLE — SWITCHING TO LIGHT MODE
        </p>
      )}

      <p className="label mt-4 min-h-[2.5em] text-center text-text-faint">
        {activeBody ? (
          <>
            {activeBody.label} — <Fill value={activeBody.detail} />
          </>
        ) : (
          "Hover a body for detail — tap to open."
        )}
      </p>
    </div>
  );
}
