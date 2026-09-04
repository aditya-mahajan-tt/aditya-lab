"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { dprFor, type FallbackReason, type QualityTier } from "@/lib/quality";

/**
 * Runtime half of the quality system (PLAN.md Phase 8). `lib/quality`
 * decides what to load before the chunk exists; this decides whether that
 * decision survived contact with the actual device.
 *
 * Rules: sample frame time in one-second windows, and only act on a run of
 * consecutive bad windows. A single bad window means nothing — the first
 * second after mount is shader compilation, and any second can be stolen by
 * a GC pause or another tab.
 *
 * HIGH → MEDIUM is a resolution drop. MEDIUM → out: there is no LOW 3D tier
 * (PLAN.md Phase 9 defines LOW as the static fallback), so a device that
 * cannot hold MEDIUM gets the DOM core back rather than a slideshow.
 */
const WINDOW_MS = 1000;
const WARMUP_MS = 2000;
const BAD_WINDOWS_TO_ACT = 3;

const FPS_FLOOR: Record<Exclude<QualityTier, "low">, number> = {
  high: 40,
  medium: 28,
};

type Props = {
  tier: Exclude<QualityTier, "low">;
  onDowngrade: (tier: QualityTier) => void;
  onGiveUp: (reason: FallbackReason) => void;
};

export function PerformanceManager({ tier, onDowngrade, onGiveUp }: Props) {
  const setDpr = useThree((state) => state.setDpr);

  const frames = useRef(0);
  const windowStart = useRef(0);
  const mountedAt = useRef(0);
  const badWindows = useRef(0);
  const settled = useRef(false);

  useEffect(() => {
    const now = performance.now();
    mountedAt.current = now;
    windowStart.current = now;
    frames.current = 0;
    badWindows.current = 0;
    settled.current = false;
  }, [tier]);

  useEffect(() => {
    setDpr(dprFor(tier));
  }, [tier, setDpr]);

  useFrame(() => {
    if (settled.current) return;

    const now = performance.now();
    frames.current += 1;

    if (now - mountedAt.current < WARMUP_MS) {
      windowStart.current = now;
      frames.current = 0;
      return;
    }

    const elapsed = now - windowStart.current;
    if (elapsed < WINDOW_MS) return;

    const fps = (frames.current * 1000) / elapsed;
    frames.current = 0;
    windowStart.current = now;

    // A hidden tab throttles rAF to ~1fps by design. Not a signal.
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

    if (fps >= FPS_FLOOR[tier]) {
      badWindows.current = 0;
      return;
    }

    badWindows.current += 1;
    if (badWindows.current < BAD_WINDOWS_TO_ACT) return;

    settled.current = true;
    if (tier === "high") {
      onDowngrade("medium");
    } else {
      onGiveUp("sustained-low-fps");
    }
  });

  return null;
}
