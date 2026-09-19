import { getAllProjects, getAllExperiments } from "@/data/queries";
import { isPlaceholder } from "@/data/schema";
import { retrievalWords } from "@/lib/ai/knowledge";

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

type Candidate = LinkSuggestion & { title: string; leadTopics: string[] };

function linkCandidates(): Candidate[] {
  return [
    ...getAllProjects()
      .filter((p) => !isPlaceholder(p.title))
      .map((p) => ({
        title: p.title,
        leadTopics: p.leadTopics,
        label: `${p.title} case study`,
        href: `/work/${p.slug}`,
      })),
    ...getAllExperiments()
      .filter((e) => !isPlaceholder(e.title))
      .map((e) => ({
        title: e.title,
        leadTopics: e.leadTopics,
        label: `${e.title} experiment`,
        href: `/experiments/${e.slug}`,
      })),
  ];
}

/**
 * Deterministic, not model-generated: AI_SPEC.md §4 requires internal links
 * come only from an allowlist of the site's own routes, never a URL the
 * model produces.
 *
 * Ranking uses the same signal as content ranking. Previously this returned
 * the first project whose title appeared in the answer, in data/projects.ts
 * array order — so an answer covering both Kensara AI and Turbotork linked
 * to whichever was declared first, no matter what was asked. Turbotork
 * could not win at all before it became a project (2026-09-19), because
 * only projects and experiments were ever candidates.
 *
 * Now the pool is chosen in three tiers, and the candidate mentioned
 * earliest in the answer wins within it (that is what the answer actually
 * led with):
 *   1. candidates whose own title appears in the question - a visitor who
 *      names a project ("Tell me about Kensara AI") wants that project, not
 *      one that merely claims the word "AI" as a leadTopic;
 *   2. else candidates whose leadTopics share a word with the question;
 *   3. else every candidate the answer mentions.
 * Topic matching is whole-word, on the same tokenizer retrieval uses
 * (retrievalWords): "team" in the question matches the topic "managing or
 * leading a team", while "AI" matches only the word "ai" and never the
 * substring inside "explain" or "detail".
 */
export function suggestLink(answer: string, question: string): LinkSuggestion | null {
  const mentioned = linkCandidates()
    .map((c) => ({ candidate: c, at: answer.indexOf(c.title) }))
    .filter((m) => m.at !== -1);

  if (mentioned.length === 0) return null;

  const named = mentioned.filter((m) =>
    question.toLowerCase().includes(m.candidate.title.toLowerCase()),
  );

  const asked = new Set(retrievalWords(question));
  const byTopic = mentioned.filter((m) =>
    retrievalWords(m.candidate.leadTopics.join(" ")).some((word) => asked.has(word)),
  );

  const pool = named.length > 0 ? named : byTopic.length > 0 ? byTopic : mentioned;
  const best = pool.reduce((a, b) => (a.at <= b.at ? a : b));

  return { label: best.candidate.label, href: best.candidate.href };
}
