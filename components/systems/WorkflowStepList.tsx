import { Fill } from "@/components/ui/Placeholder";
import type { Workflow } from "@/data/workflowSchema";
import { KIND_TAG, nodeLabel, phaseSteps, stepChips } from "./workflowSteps";

const chip =
  "rounded-sm border px-2 py-0.5 font-mono text-xs uppercase tracking-[0.08em]";

/**
 * The same workflow as plain text: the route to every node detail with
 * JavaScript off, and the whole diagram below 1280px (spec 6.4). Server-safe:
 * no state, no ids (it is rendered twice on the page, see WorkflowDiagram).
 * Phase headings are h3 because the parent page supplies the h2.
 */
export function WorkflowStepList({ workflow }: { workflow: Workflow }) {
  const laneLabel = new Map(workflow.lanes.map((l) => [l.id, l.label]));

  return (
    <div className="space-y-12">
      {workflow.phases.map((phase) => (
        <section key={phase.id}>
          <h3 className="font-mono text-sm uppercase tracking-[0.08em] text-accent">
            {phase.id} · {phase.label}
          </h3>
          <p className="prose-lab mt-3 text-text-muted">
            <Fill value={phase.summary} />
          </p>

          <ol className="mt-6 space-y-6">
            {phaseSteps(workflow, phase.id).map((node) => {
              const { reads, writes, branches } = stepChips(workflow, node);
              return (
                <li key={node.id} className="border-l border-border pl-4">
                  <p className="label">
                    {KIND_TAG[node.kind]} · {laneLabel.get(node.lane)}
                  </p>
                  <p className="mt-1 font-mono text-sm uppercase tracking-[0.08em] text-text">
                    {nodeLabel(node)}
                  </p>
                  <p className="prose-lab mt-2 text-text-muted">{node.detail}</p>
                  {(reads.length > 0 || writes.length > 0 || branches.length > 0) && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {reads.map((r) => (
                        <li key={`r-${r}`} className={`${chip} border-border text-text-muted`}>
                          READS {r}
                        </li>
                      ))}
                      {writes.map((x) => (
                        <li key={`w-${x}`} className={`${chip} border-border text-text-muted`}>
                          WRITES {x}
                        </li>
                      ))}
                      {branches.map((b) => (
                        <li key={`b-${b}`} className={`${chip} border-border-strong text-text`}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
