import { getAllProjects, getAllExperiments } from "@/data/queries";
import { isPlaceholder } from "@/data/schema";

/** Static routes that exist in /app. Kept beside the dynamic slugs below. */
const STATIC_ROUTES = [
  "/",
  "/about",
  "/build",
  "/contact",
  "/experiments",
  "/log",
  "/resume",
  "/systems",
  "/thinking",
  "/work",
];

let routeCache: Set<string> | null = null;

function knownRoutes(): Set<string> {
  if (routeCache) return routeCache;
  routeCache = new Set([
    ...STATIC_ROUTES,
    ...getAllProjects().map((p) => `/work/${p.slug}`),
    ...getAllExperiments().map((e) => `/experiments/${e.slug}`),
  ]);
  return routeCache;
}

/**
 * Deletes site-relative paths the model made up. guardrails.ts's
 * sanitizeAnswer strips absolute URLs, but a relative path slipped straight
 * through: asked about leadership on 2026-09-18, gpt-oss-120b closed with
 * "(see /work/turbotork)" — a dead link, because Turbotork is an experience
 * entry and has no case-study page. A 404 handed to a recruiter by the
 * feature that is supposed to demonstrate AI judgement is a bad trade for a
 * link the visitor did not need; the real link arrives as a chip from
 * suggestLink below, which can only emit routes that exist.
 *
 * Paths that DO exist are left alone — they are correct and useful.
 */
export function stripUnknownInternalPaths(answer: string): string {
  const routes = knownRoutes();
  return answer
    .replace(/\/[a-z0-9][a-z0-9/-]*/gi, (path) => {
      const clean = path.replace(/\/+$/, "") || "/";
      return routes.has(clean) ? path : "";
    })
    // Tidy the punctuation a removed path leaves behind: "(see )", "at ,".
    .replace(/\(\s*(?:see|at|via|visit)?\s*[,;:]?\s*\)/gi, "")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/(?:\b(?:see|at|via|visit)\s+)?(?:and\s+)?[:,]?\s*\.(?=\s|$)/gi, ".")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

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
