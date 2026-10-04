import { getSystemDiagram } from "@/data/systems";
import { SystemDiagramCard } from "./SystemDiagramCard";

/** Audit fix 3: the agent-pipeline diagram existed in data and tests but no page rendered it. */
export function AgentPipeline() {
  const diagram = getSystemDiagram("agent-pipeline");
  if (!diagram) return null;
  return <SystemDiagramCard diagram={diagram} />;
}
