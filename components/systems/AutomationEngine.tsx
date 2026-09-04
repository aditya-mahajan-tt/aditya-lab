import { getSystemDiagram } from "@/data/systems";
import { SystemDiagramCard } from "./SystemDiagramCard";

/** PLAN.md Phase 11 — INPUT → DATA → ENRICH → AI → DECISION → OUTPUT, grounded in Turbotork. */
export function AutomationEngine() {
  const diagram = getSystemDiagram("automation-engine");
  if (!diagram) return null;
  return <SystemDiagramCard diagram={diagram} animated />;
}
