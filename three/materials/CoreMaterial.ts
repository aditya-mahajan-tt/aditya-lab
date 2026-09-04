import { Color, MeshStandardMaterial } from "three";
import type { LabTokens } from "./tokens";

/**
 * The energy core: near-black body, accent emission. `toneMapped: false`
 * keeps the emissive colour at exactly the token value — ACES tone mapping
 * would otherwise desaturate the accent into a pale mint and quietly break
 * the palette.
 *
 * Emissive intensity is animated by the caller (three/objects/Core).
 */
export function createCoreMaterial(tokens: LabTokens): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: new Color(tokens.bg),
    emissive: new Color(tokens.accent),
    emissiveIntensity: 1.4,
    roughness: 0.4,
    metalness: 0.1,
    toneMapped: false,
  });
}
