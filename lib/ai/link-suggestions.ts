import { getAllProjects, getAllExperiments } from "@/data/queries";
import { isPlaceholder } from "@/data/schema";

export type LinkSuggestion = { label: string; href: string };

/**
 * Deterministic, not model-generated: AI_SPEC.md §4 requires internal links
 * come only from an allowlist of the site's own routes, never a URL the
 * model produces. If the grounded answer text mentions a real project or
 * experiment title, offer one link chip to that page.
 */
export function suggestLink(answer: string): LinkSuggestion | null {
  for (const p of getAllProjects()) {
    if (!isPlaceholder(p.title) && answer.includes(p.title)) {
      return { label: `${p.title} case study`, href: `/work/${p.slug}` };
    }
  }
  for (const e of getAllExperiments()) {
    if (!isPlaceholder(e.title) && answer.includes(e.title)) {
      return { label: `${e.title} experiment`, href: `/experiments/${e.slug}` };
    }
  }
  return null;
}
