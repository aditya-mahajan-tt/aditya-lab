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

/**
 * Structural material for the Lab stations' desks, walls, pedestals and
 * arms. createMetalMaterial's 0.92 metalness leaves almost no diffuse
 * response, so on this scene's near-black environment a neutral steel base
 * renders as a black cutout whatever the lights do (the hero avoids that by
 * tinting its metal accent-green; the stations want to stay neutral). Half
 * metal, lighter base: the two scene lights now shade the form, and the
 * environment still adds a soft sheen.
 */
export function createStationMaterial(tokens: LabTokens, color?: string): MeshStandardMaterial {
  const base = color ? new Color(color) : new Color(tokens.borderStrong).lerp(new Color(tokens.text), 0.35);

  return new MeshStandardMaterial({
    color: base,
    metalness: 0.5,
    roughness: 0.42,
    envMapIntensity: 1.6,
  });
}
