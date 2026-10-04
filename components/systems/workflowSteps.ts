import type { Workflow, WorkflowNode } from "@/data/workflowSchema";

/** The tag printed above each node and in the list. Shape carries meaning; this names it. */
export const KIND_TAG: Record<WorkflowNode["kind"], string> = {
  trigger: "TRIGGER",
  step: "AGENT",
  gate: "CHECK",
  human: "YOU",
  surface: "DASHBOARD",
  store: "DATA",
  end: "END",
};

export const nodeLabel = (n: WorkflowNode) => n.label.join(" ");

const isRecord = (n: WorkflowNode) => n.kind === "store" || n.kind === "surface";

/**
 * READS / WRITES come from data edges to or from a store or surface; a gate
 * lists one "YES → TARGET" line per labelled outgoing edge (spec 6.4).
 */
export function stepChips(w: Workflow, node: WorkflowNode) {
  const byId = new Map(w.nodes.map((n) => [n.id, n]));
  const reads: string[] = [];
  const writes: string[] = [];
  const branches: string[] = [];

  for (const e of w.edges) {
    if (e.kind === "data") {
      if (e.to === node.id) {
        const from = byId.get(e.from);
        if (from && isRecord(from)) reads.push(nodeLabel(from));
      } else if (e.from === node.id) {
        const to = byId.get(e.to);
        if (to && isRecord(to)) writes.push(nodeLabel(to));
      }
    } else if (node.kind === "gate" && e.from === node.id && e.label) {
      const to = byId.get(e.to);
      if (to) branches.push(`${e.label} → ${nodeLabel(to)}`);
    }
  }
  return { reads, writes, branches };
}

/** A phase's nodes in reading order, without the data stores (they appear as chips). */
export const phaseSteps = (w: Workflow, phaseId: string): WorkflowNode[] =>
  w.nodes.filter((n) => n.phase === phaseId && n.kind !== "store");
