import { Color, MeshStandardMaterial } from "three";
import type { LabTokens } from "./tokens";

/**
 * Brushed structural metal for rings and nodes. Reads entirely from the
 * environment map (three/scene/Environment) — there are only two lights in
 * the whole scene, so reflection is doing most of the work here.
 */
export function createMetalMaterial(tokens: LabTokens): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: new Color(tokens.borderStrong),
    metalness: 1,
    // Tight enough to throw a moving highlight along a ring as it rotates —
    // that travelling glint is what separates this from the flat SVG.
    roughness: 0.26,
    envMapIntensity: 1.6,
  });
}
