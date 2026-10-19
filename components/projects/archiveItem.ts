import type { Project } from "@/data/schema";
import { projectHref } from "@/data/queries";

/**
 * One row on /projects. Projects and server-built entries (ORBIT, from the
 * workflow data) share this shape so the client archive never imports
 * data/workflows.ts, which the repo keeps out of client bundles on purpose.
 */
export type ArchiveItem = {
  slug: string;
  /** The mono tag above the title, e.g. PROJECT_001 or WORKFLOW_001. */
  label: string;
  href: string;
  title: string;
  subtitle?: string;
  summary: string;
  category: string[];
  status: string;
  kind: Project["kind"];
  order: number;
};

export const projectToArchiveItem = (p: Project): ArchiveItem => ({
  slug: p.slug,
  label: `PROJECT_${p.id}`,
  href: projectHref(p),
  title: p.title,
  subtitle: p.subtitle,
  summary: p.summary,
  category: p.category,
  status: p.status,
  kind: p.kind,
  order: p.order,
});
