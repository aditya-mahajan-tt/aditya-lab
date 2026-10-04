import { workflows } from "./workflows";
import type { Workflow } from "./workflowSchema";

/**
 * Workflow queries live apart from data/queries.ts on purpose. queries.ts is
 * imported by client components on the homepage (the orbital hero), and
 * data/workflows.ts is large (49 nodes of copy). Importing it there put about
 * 7 KB gzip on every page's initial JS. Only server code imports this file.
 */
export const getAllWorkflows = (): Workflow[] => [...workflows];

export const getWorkflow = (slug: string): Workflow | undefined =>
  workflows.find((w) => w.slug === slug);
