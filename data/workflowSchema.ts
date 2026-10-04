import { z } from "zod";
import { ExperimentStatus, Fillable, LeadTopics, Plane } from "./schema";

/**
 * Workflow schemas (spec section 4). They live apart from data/schema.ts on
 * purpose: schema.ts is imported by client components, and Zod schemas cannot
 * be tree-shaken, so keeping these there added about 1 KB gzip to the
 * homepage's initial JS. Only data/workflows.ts and server code import the
 * runtime schema; components import the types, which are erased at build.
 */

/* ------------------------------------------------------------ workflows */

export const WorkflowLaneSchema = z.object({ id: z.string(), label: z.string() });

export const WorkflowPhaseSchema = z.object({
  id: z.string(),
  label: z.string(),
  summary: Fillable,
  /** Where the phase caption sits on the swimlane grid. */
  lane: z.string(),
  row: z.number().int().min(1),
});

export const WorkflowNodeKind = z.enum([
  "trigger", // a schedule starts a run
  "step",    // something an agent run does
  "gate",    // a rule that can stop or reroute the flow
  "human",   // a decision only Aditya makes
  "surface", // the dashboard
  "store",   // a file, feed or record that is read or written
  "end",     // a terminal outcome
]);

export const WorkflowNodeSchema = z.object({
  id: z.string(),
  phase: z.string(),
  lane: z.string(),
  row: z.number().int().min(1),
  kind: WorkflowNodeKind,
  /** One or two lines, already broken. Each line at most 18 characters. */
  label: z.array(z.string().max(18)).min(1).max(2),
  detail: Fillable,
});

export const WorkflowEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  /** flow = control passes on. data = something is read or written. */
  kind: z.enum(["flow", "data"]),
  label: z.string().optional(),
  /** "vh" = leave vertically, then enter horizontally. Default is the reverse. */
  route: z.enum(["vh"]).optional(),
});

export const WorkflowSchema = z
  .object({
    id: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: Fillable,
    subtitle: z.string().optional(),
    year: z.string(),
    status: ExperimentStatus,
    planes: z.array(Plane).min(1),
    leadTopics: LeadTopics,
    summary: Fillable,
    why: Fillable,
    principles: z.array(z.object({ title: z.string(), body: Fillable })).min(1),
    checks: z.array(z.object({ rule: z.string(), prevents: Fillable })).min(1),
    integrations: z
      .array(z.object({ name: z.string(), access: z.enum(["reads", "writes", "reads + writes", "runs on"]), note: Fillable }))
      .min(1),
    limits: z.array(Fillable).min(1),
    reflection: z.string().optional(),
    lanes: z.array(WorkflowLaneSchema).min(2),
    phases: z.array(WorkflowPhaseSchema).min(1),
    /** Array order is reading order: it drives tab order and the stacked list. */
    nodes: z.array(WorkflowNodeSchema).min(2),
    edges: z.array(WorkflowEdgeSchema).min(1),
  })
  .superRefine((w, ctx) => {
    const ids = new Set<string>();
    const cells = new Set<string>();
    const lanes = new Set(w.lanes.map((l) => l.id));
    const phases = new Set(w.phases.map((p) => p.id));
    for (const n of w.nodes) {
      if (ids.has(n.id)) ctx.addIssue({ code: "custom", message: `duplicate node id ${n.id}` });
      ids.add(n.id);
      const cell = `${n.lane}:${n.row}`;
      if (cells.has(cell)) ctx.addIssue({ code: "custom", message: `two nodes in cell ${cell}` });
      cells.add(cell);
      if (!lanes.has(n.lane)) ctx.addIssue({ code: "custom", message: `unknown lane on ${n.id}` });
      if (!phases.has(n.phase)) ctx.addIssue({ code: "custom", message: `unknown phase on ${n.id}` });
    }
    const linked = new Set<string>();
    for (const e of w.edges) {
      if (!ids.has(e.from) || !ids.has(e.to))
        ctx.addIssue({ code: "custom", message: `edge ${e.from} -> ${e.to} names a missing node` });
      linked.add(e.from);
      linked.add(e.to);
    }
    for (const id of ids)
      if (!linked.has(id)) ctx.addIssue({ code: "custom", message: `node ${id} has no edge` });
  });

export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;
