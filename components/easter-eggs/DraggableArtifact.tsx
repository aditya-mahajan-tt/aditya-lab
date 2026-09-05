"use client";

import { useEffect, useRef, useState } from "react";
import { ensureDraggable } from "@/animations/gsap";
import { prefersReducedMotion } from "@/animations/tokens";
import { useLabStore } from "@/lib/store";
import { playTone } from "@/lib/sound";

/**
 * PLAN.md Phase 15 — "Physics only on draggable artifacts, never global."
 * The one physics object on the site: bounded to its own container,
 * thrown with inertia on release. Under reduced motion it's still
 * draggable (repositioning is real interaction, not decoration) but never
 * throws — it just stops where you let go, per DESIGN_SYSTEM.md §5.
 */
export function DraggableArtifact() {
  const boundsRef = useRef<HTMLDivElement>(null);
  const artifactRef = useRef<HTMLDivElement>(null);
  const soundEnabled = useLabStore((s) => s.soundEnabled);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const bounds = boundsRef.current;
    const artifact = artifactRef.current;
    if (!bounds || !artifact) return;

    let instances: ReturnType<typeof import("gsap/Draggable").Draggable.create> | undefined;
    let cancelled = false;

    ensureDraggable().then((Draggable) => {
      if (cancelled) return;
      const reduced = prefersReducedMotion();
      instances = Draggable.create(artifact, {
        type: "x,y",
        bounds,
        inertia: !reduced,
        onPress: () => {
          if (soundEnabledRef.current) playTone("blip");
        },
        onDragEnd: () => {
          if (soundEnabledRef.current) playTone("thud");
        },
      });
      setReady(true);
    });

    return () => {
      cancelled = true;
      instances?.forEach((d) => d.kill());
    };
  }, []);

  return (
    <div
      ref={boundsRef}
      className="relative h-48 w-full rounded-sm border border-border bg-surface md:h-64"
      aria-hidden={!ready}
    >
      <p className="pointer-events-none absolute inset-x-0 top-3 text-center font-mono text-[10px] uppercase tracking-widest text-text-faint">
        Drag it.
      </p>
      <div
        ref={artifactRef}
        role="img"
        aria-label="A draggable artifact. Drag it around this box."
        data-cursor="drag"
        className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border border-accent bg-accent-glow font-mono text-[10px] uppercase tracking-widest text-accent active:cursor-grabbing"
      >
        BOLT
      </div>
    </div>
  );
}
