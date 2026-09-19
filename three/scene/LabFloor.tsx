"use client";

import { useEffect, useMemo } from "react";
import { Color, ShaderMaterial } from "three";
import { readTokens } from "@/three/materials/tokens";

/**
 * The Lab environment's floor: a fading grid with rings at the hub and the
 * station orbit, drawn by one shader on one plane. Nothing is textured or
 * lit — the canvas is transparent and the page shows through, so the floor
 * only has to contribute lines and let distance fade them out, the same
 * depth cue the scene fog gives the stations.
 *
 * Rings sit at the hub (1.3), the station ring (STATION_RING_RADIUS in
 * LabEnvironmentScene, 2.6) and just outside it (4.0). Line widths use
 * fwidth so they stay one pixel wide at any orbit distance.
 */
const PLANE_SIZE = 24;
const FLOOR_Y = -0.03;

const vertexShader = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uGridOpacity;
  uniform float uRingOpacity;
  varying vec2 vPos;

  const float CELL = 0.5;
  const float TAU = 6.2831853;

  float ring(float radius, float dist, float dashed) {
    float d = abs(dist - radius) / max(fwidth(dist), 1e-5);
    float line = 1.0 - min(d, 1.0);
    float dash = mix(1.0, step(0.5, fract(atan(vPos.y, vPos.x) * 16.0 / TAU)), dashed);
    return line * dash;
  }

  void main() {
    vec2 cell = vPos / CELL;
    vec2 g = abs(fract(cell - 0.5) - 0.5) / max(fwidth(cell), vec2(1e-5));
    float grid = 1.0 - min(min(g.x, g.y), 1.0);

    float dist = length(vPos);
    float rings = max(max(ring(1.3, dist, 1.0), ring(2.6, dist, 0.0)), ring(4.0, dist, 1.0));

    float fade = 1.0 - smoothstep(3.5, 9.0, dist);
    float alpha = (grid * uGridOpacity + rings * uRingOpacity) * fade;

    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

export function LabFloor() {
  const material = useMemo(() => {
    const tokens = readTokens();
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new Color(tokens.accentDim) },
        uGridOpacity: { value: 0.3 },
        uRingOpacity: { value: 0.55 },
      },
      transparent: true,
      depthWrite: false,
    });
  }, []);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, FLOOR_Y, 0]}
      renderOrder={-1}
      material={material}
      raycast={() => null}
    >
      <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
    </mesh>
  );
}
