"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import {
  Color,
  DataTexture,
  EquirectangularReflectionMapping,
  Fog,
  LinearFilter,
  PMREMGenerator,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from "three";
import { readTokens, type LabTokens } from "@/three/materials/tokens";

const WIDTH = 8;
const HEIGHT = 32;

/**
 * A studio environment generated from the design tokens instead of loaded.
 *
 * drei's `<Environment preset>` fetches an HDR from a CDN — a third-party
 * request, several hundred KB, and a hard dependency on someone else's
 * uptime for the hero to look right. Three's own RoomEnvironment is local
 * but is a bright white room, which lights a near-black lab like a showroom.
 *
 * So: a 8×32 vertical gradient, dark at the horizon, lifting to a faint
 * accent-tinted band overhead. A few hundred bytes of code, on-palette, and
 * it is the only thing the metal and glass materials have to reflect.
 */
function gradientTexture(tokens: LabTokens): DataTexture {
  // This map is never seen directly — it exists only to be reflected. At
  // literal token brightness it reflects near-black into near-black and the
  // metal structure disappears, so the two upper stops are lifted toward
  // --color-text. The tokens stay the source; the lift is exposure.
  const low = new Color(tokens.bg);
  const mid = new Color(tokens.surfaceRaised).lerp(new Color(tokens.text), 0.42);
  const high = new Color(tokens.accentDim).lerp(new Color(tokens.text), 0.3);

  const data = new Uint8Array(WIDTH * HEIGHT * 4);
  const sample = new Color();

  for (let y = 0; y < HEIGHT; y++) {
    // Row 0 is the top of an equirectangular map.
    const t = 1 - y / (HEIGHT - 1);

    if (t > 0.72) {
      sample.copy(mid).lerp(high, (t - 0.72) / 0.28);
    } else {
      sample.copy(low).lerp(mid, t / 0.72);
    }

    for (let x = 0; x < WIDTH; x++) {
      const i = (y * WIDTH + x) * 4;
      data[i] = Math.round(sample.r * 255);
      data[i + 1] = Math.round(sample.g * 255);
      data[i + 2] = Math.round(sample.b * 255);
      data[i + 3] = 255;
    }
  }

  const texture = new DataTexture(data, WIDTH, HEIGHT, RGBAFormat, UnsignedByteType);
  texture.mapping = EquirectangularReflectionMapping;
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function Environment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const tokens = readTokens();
    const pmrem = new PMREMGenerator(gl);
    const source = gradientTexture(tokens);
    const target = pmrem.fromEquirectangular(source);

    scene.environment = target.texture;
    // Depth cue only — the canvas itself stays transparent so the page
    // background shows through and the DOM core can cross-fade underneath.
    scene.fog = new Fog(new Color(tokens.bg), 5.5, 13);

    return () => {
      scene.environment = null;
      scene.fog = null;
      target.dispose();
      source.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return null;
}
