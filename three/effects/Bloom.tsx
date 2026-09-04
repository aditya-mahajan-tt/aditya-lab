"use client";

import { Bloom as BloomEffect, EffectComposer } from "@react-three/postprocessing";

/**
 * The one post-processing pass this project is allowed (PLAN.md Phase 9:
 * "One bloom pass maximum"), and only on the HIGH tier — a composer means a
 * second full-screen render target every frame, which is exactly the cost
 * MEDIUM cannot afford.
 *
 * `luminanceThreshold` is set above the metal's brightest specular so only
 * the emissive core blooms. Bloom on the structure would turn a machine
 * into a haze, which is the failure mode this object is designed against.
 *
 * `multisampling={0}`: the composer's MSAA is the single most expensive
 * knob here and the object is built from thin rings that bloom does not
 * touch, so it buys nothing visible.
 */
export function Bloom() {
  return (
    <EffectComposer multisampling={0}>
      <BloomEffect intensity={0.35} luminanceThreshold={0.9} luminanceSmoothing={0.25} mipmapBlur radius={0.4} />
    </EffectComposer>
  );
}
