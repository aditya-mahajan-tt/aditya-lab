import { getAllWorkflows } from "@/data/workflowQueries";
import { isPlaceholder } from "@/data/schema";
import type { CommandItem } from "@/lib/search";

/**
 * Command-palette entries for workflows. Computed on the server (the root
 * layout) and passed to the palette as a prop, so the client bundle never
 * carries the workflow data itself.
 */
export function workflowCommandItems(): CommandItem[] {
  return getAllWorkflows().map((w) => ({
    id: `workflow-${w.slug}`,
    group: "Systems",
    label: isPlaceholder(w.title) ? `WORKFLOW_${w.id}` : w.title,
    detail: w.subtitle,
    href: `/systems/${w.slug}`,
  }));
}
