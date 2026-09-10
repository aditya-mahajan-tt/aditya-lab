import { Color, MeshStandardMaterial } from "three";
import type { LabTokens } from "./tokens";

/**
 * Brushed structural metal for rings and nodes. Reads mostly from the
 * environment map (three/scene/Environment) — there are only two lights in
 * the whole scene, so reflection is doing most of the work here.
 *
 * `color` defaults to the neutral steel every non-hero consumer (the Lab
 * stations' desks, hubs and pole markers) still wants. The hero Core passes
 * `tokens.accentDim` explicitly for its rings/modules — at `metalness: 1`
 * the base colour tints every reflection, so a neutral base on a near-black
 * background with only two lights reads as invisible except for a passing
 * highlight, which is what made the hero's outer structure fade into the
 * background entirely.
 */
export function createMetalMaterial(tokens: LabTokens, color: string = tokens.borderStrong): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: new Color(color),
    metalness: 0.92,
    // Tight enough to throw a moving highlight along a ring as it rotates —
    // that travelling glint is what separates this from the flat SVG. Just
    // short of fully metallic so the base colour still contributes a faint
    // diffuse response away from the highlight, instead of relying on
    // reflection alone for any colour to show at all.
    roughness: 0.26,
    envMapIntensity: 1.6,
  });
}
