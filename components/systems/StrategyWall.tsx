import { getSystemDiagram } from "@/data/systems";
import { SystemDiagramCard } from "./SystemDiagramCard";

/** PLAN.md Phase 11 — the GTM/segmentation framework, grounded in goSTOPS. */
export function StrategyWall() {
  const diagram = getSystemDiagram("strategy-wall");
  if (!diagram) return null;
  return <SystemDiagramCard diagram={diagram} />;
}
