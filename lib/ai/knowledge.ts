import { about } from "@/data/about";
import { site } from "@/data/site";
import { skillGroups } from "@/data/skills";
import { thinking } from "@/data/thinking";
import { getAllProjects, getAllExperiments } from "@/data/queries";
import { isPlaceholder, isDraft } from "@/data/schema";

/**
 * The entire grounding corpus for "Ask the Lab" (AI_SPEC.md §2), derived
 * live from /data on every server start — not a checked-in generated file.
 * Next already compiles /data once for the whole app, so re-deriving here
 * costs nothing extra and can never drift out of sync with the site, which
 * is the actual property AI_SPEC.md's "generated file" step exists to buy.
 *
 * A field is included only if it is present AND neither an [X_REQUIRED]
 * placeholder nor an unreviewed [AI_DRAFT_REVIEW] draft (CLAUDE.md §7 treats
 * the latter with the same severity as missing content — it must never be
 * presented as settled fact, and an AI assistant asserting it in a
 * conversation is a worse exposure than a static page with an amber
 * outline). Projects marked `confidential` are skipped entirely.
 */

/** Returns the value if it's real, reviewed content — otherwise null. */
function field(value: string | undefined | null): string | null {
  if (!value) return null;
  if (isPlaceholder(value) || isDraft(value)) return null;
  return value;
}

function section(heading: string, lines: (string | null)[]): string | null {
  const body = lines.filter((l): l is string => l !== null);
  if (body.length === 0) return null;
  return [`## ${heading}`, ...body].join("\n");
}

function buildAboutSection(): string | null {
  return section("About", [
    field(about.heroHeadline),
    field(about.heroSubline),
    field(about.shortBio),
    field(about.longBio),
    field(about.problemsIEnjoy) && `Problems he enjoys: ${field(about.problemsIEnjoy)}`,
    ...about.progression
      .map((p) => field(p.body) && `${p.label}: ${field(p.body)}`)
      .filter((l): l is string => !!l),
  ]);
}

function buildSkillsSection(): string | null {
  const groups = skillGroups
    .map((g) => {
      const items = g.items.map((i) => `${i.name} (${i.depth})`).join(", ");
      const desc = field(g.description);
      return [`### ${g.id}`, desc, `Items: ${items}`].filter(Boolean).join("\n");
    })
    .join("\n\n");
  return groups ? `## Skills\n\n${groups}` : null;
}

function buildProjectsSection(): string | null {
  const entries = getAllProjects()
    .filter((p) => !p.confidential)
    .map((p) => {
      const title = field(p.title);
      if (!title) return null; // an unnamed project is worse than useless as grounding
      return section(`Project: ${title}${p.subtitle ? ` — ${p.subtitle}` : ""}`, [
        `Category: ${p.category.join(", ")}`,
        `Year: ${p.year}`,
        `Status: ${p.status}`,
        field(p.summary) && `Summary: ${field(p.summary)}`,
        field(p.context) && `Context: ${field(p.context)}`,
        field(p.problem) && `Problem: ${field(p.problem)}`,
        field(p.role) && `Role: ${field(p.role)}`,
        field(p.thinking) && `Thinking: ${field(p.thinking)}`,
        field(p.approach) && `Approach: ${field(p.approach)}`,
        field(p.execution) && `Execution: ${field(p.execution)}`,
        field(p.outcome) && `Outcome: ${field(p.outcome)}`,
        p.tools.length > 0 ? `Tools: ${p.tools.join(", ")}` : null,
        `Case study page: /work/${p.slug}`,
      ]);
    })
    .filter((e): e is string => !!e);
  return entries.length > 0 ? entries.join("\n\n") : null;
}

function buildExperimentsSection(): string | null {
  const entries = getAllExperiments()
    .map((e) => {
      const title = field(e.title);
      if (!title) return null;
      return section(`Experiment: ${title}`, [
        `Type: ${e.type}`,
        `Status: ${e.status}`,
        `Year: ${e.year}`,
        field(e.summary) && `Summary: ${field(e.summary)}`,
        field(e.hypothesis) && `Hypothesis: ${field(e.hypothesis)}`,
        field(e.result) && `Result: ${field(e.result)}`,
        field(e.learning) && `Learning: ${field(e.learning)}`,
        e.tools.length > 0 ? `Tools: ${e.tools.join(", ")}` : null,
        `Experiment page: /experiments/${e.slug}`,
      ]);
    })
    .filter((e): e is string => !!e);
  return entries.length > 0 ? entries.join("\n\n") : null;
}

function buildThinkingSection(): string | null {
  const steps = thinking.steps
    .map((s) => field(s.body) && `${s.label}: ${field(s.body)}`)
    .filter((l): l is string => !!l);
  return section("How he thinks", [
    field(thinking.intro),
    ...steps,
    field(thinking.workedExample) && `Worked example: ${field(thinking.workedExample)}`,
  ]);
}

function buildContactSection(): string | null {
  return section("Contact", [
    field(site.email) && `Email: ${field(site.email)}`,
    ...site.social.map((s) => field(s.url) && `${s.label}: ${s.url}`),
    field(site.resumePath) && `Resume: ${site.url}${site.resumePath}`,
  ]);
}

function buildKnowledgeText(): string {
  const sections = [
    section("Site", [`Name: ${site.name}`, `Title: ${site.title}`, `Description: ${site.description}`]),
    buildAboutSection(),
    buildSkillsSection(),
    buildProjectsSection(),
    buildExperimentsSection(),
    buildThinkingSection(),
    buildContactSection(),
  ].filter((s): s is string => s !== null);

  return sections.join("\n\n");
}

/** ~4 characters per token is a standard rough estimate for English text. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const TOKEN_WARN_THRESHOLD = 20_000;

export type Knowledge = {
  text: string;
  tokenCount: number;
};

let cached: Knowledge | null = null;

/**
 * Built once per server lifetime and memoized — the corpus is static
 * build-time content, same reasoning as lib/search.ts's command index.
 */
export function getKnowledge(): Knowledge {
  if (cached) return cached;

  const text = buildKnowledgeText();
  const tokenCount = estimateTokens(text);

  if (tokenCount > TOKEN_WARN_THRESHOLD) {
    // AI_SPEC.md §2: at this size, switch to per-section retrieval by
    // keyword score — not a vector DB. Not yet implemented; this is the
    // trigger to come back and do it.
    console.warn(
      `[ask-the-lab] knowledge corpus is ${tokenCount} tokens, over the ${TOKEN_WARN_THRESHOLD} warn threshold.`,
    );
  }

  cached = { text, tokenCount };
  return cached;
}
