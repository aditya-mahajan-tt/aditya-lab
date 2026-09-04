import { Color, MeshPhysicalMaterial, MeshStandardMaterial, type Material } from "three";
import type { QualityTier } from "@/lib/quality";
import type { LabTokens } from "./tokens";

/**
 * The shell around the core. Real transmission costs an extra render pass of
 * the whole scene per frame, so it is a HIGH-tier-only luxury; MEDIUM gets a
 * plain alpha-blended approximation that reads almost identically at this
 * size and costs nothing.
 */
export function createGlassMaterial(tokens: LabTokens, tier: QualityTier): Material {
  if (tier === "high") {
    return new MeshPhysicalMaterial({
      color: new Color(tokens.text),
      transmission: 0.92,
      thickness: 0.5,
      ior: 1.35,
      roughness: 0.12,
      metalness: 0,
      transparent: true,
    });
  }

  return new MeshStandardMaterial({
    color: new Color(tokens.text),
    transparent: true,
    opacity: 0.14,
    roughness: 0.2,
    metalness: 0.2,
  });
}
