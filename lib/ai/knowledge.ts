import { about } from "@/data/about";
import { site } from "@/data/site";
import { skillGroups } from "@/data/skills";
import { thinking } from "@/data/thinking";
import { experience } from "@/data/experience";
import { education } from "@/data/education";
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

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * "2025-07" -> "July 2025 (2025-07)". Both forms, deliberately.
 *
 * The corpus used to carry the ISO form alone, and a model asked about a
 * role answered — correctly — "from July 2022 to October 2024". guardrails.
 * ts's isGrounded then looked for "October" in the corpus, didn't find it,
 * and replaced a true answer with the refusal string (live probe,
 * 2026-09-18). Emitting the spoken form is the honest fix: it puts the
 * words an answer will actually use into the grounding text, instead of
 * stoplisting month names, which would let a fabricated "March 2021" pass.
 */
function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value; // education stores year-only precision
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${match[1]} (${value})` : value;
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

function buildExperienceSection(): string | null {
  const entries = [...experience]
    // Entries carrying leadTopics go first. Position in the corpus is a weak
    // signal on its own, but it costs nothing and points the same way as the
    // explicit PRIMARY REFERENCE line rather than fighting it.
    .sort((a, b) => Number(b.leadTopics.length > 0) - Number(a.leadTopics.length > 0))
    .map((e) => {
      const bullets = e.bullets.map((b) => field(b)).filter((b): b is string => !!b);
      const highlights = e.highlights
        .map((h) => field(h.label) && `${h.value} — ${field(h.label)}`)
        .filter((h): h is string => !!h);
      return section(`Experience: ${e.role} at ${e.company}`, [
        `Dates: ${formatDate(e.start)} to ${e.end ? formatDate(e.end) : "Present"}`,
        e.location ? `Location: ${e.location}` : null,
        // Read by system-prompt.ts rule 9. Emitted first so it frames the
        // bullets that follow rather than trailing them.
        e.leadTopics.length > 0
          ? `PRIMARY REFERENCE for questions about: ${e.leadTopics.join(", ")}.`
          : null,
        ...bullets,
        e.tools.length > 0 ? `Tools: ${e.tools.join(", ")}` : null,
        ...highlights,
      ]);
    })
    .filter((e): e is string => !!e);
  return entries.length > 0 ? entries.join("\n\n") : null;
}

function buildEducationSection(): string | null {
  const entries = education
    .map((e) => {
      const highlights = e.highlights
        .map((h) => field(h.label) && `${h.value} — ${field(h.label)}`)
        .filter((h): h is string => !!h);
      return section(`Education: ${e.program} at ${e.institution}`, [
        `Dates: ${formatDate(e.start)} to ${e.end ? formatDate(e.end) : "Present"}`,
        e.location ? `Location: ${e.location}` : null,
        e.note ? `Note: ${e.note}` : null,
        ...highlights,
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
    buildExperienceSection(),
    buildEducationSection(),
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

/**
 * The corpus is sent in full on EVERY question, so its size is not a
 * storage concern — it is a per-request cost, and the binding limit is
 * Groq's tokens-per-minute ceiling, not the model's context window. The
 * models here hold 131,072 tokens; the free tier allows 8,000 per minute.
 * The context window is ~4% used and irrelevant.
 *
 * AI_SPEC.md §2 set the trigger for section retrieval at 20,000 tokens,
 * reasoning about context size. That number is unreachable: a request
 * whose prompt alone exceeds the per-minute allowance fails EVERY time,
 * with no slow degradation to warn anyone first — and it surfaces to the
 * visitor as "AI CORE TEMPORARILY OFFLINE", which points at the API, not
 * at the content change that actually caused it.
 *
 * Note that lib/ai/groq-client.ts's model failover does NOT relax this.
 * Failover spreads separate questions across models with separate budgets;
 * a single question is still served by a single model, so the ceiling on
 * one request is one model's TPM.
 *
 * The budget below is what is left for the corpus after everything else
 * that shares the request. It is deliberately checked against a realistic
 * request rather than an absolute worst case: the history cap (4 turns x
 * 2,000 chars) would reserve 2,000 tokens that a real conversation almost
 * never uses, and budgeting for it would forbid content that works fine.
 */
const TOKENS_PER_MINUTE = Number(process.env.AI_TOKENS_PER_MINUTE ?? 8_000);
const RESERVED_FOR_OUTPUT = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 500);
const RESERVED_FOR_RULES = 400; // the nine system-prompt rules and delimiters
const RESERVED_FOR_QUESTION = 125; // the 500-character input cap
const RESERVED_FOR_HISTORY = 1_000; // two typical prior turns, not the 4x2000 cap

export const CORPUS_TOKEN_BUDGET =
  TOKENS_PER_MINUTE -
  RESERVED_FOR_OUTPUT -
  RESERVED_FOR_RULES -
  RESERVED_FOR_QUESTION -
  RESERVED_FOR_HISTORY;

/** Warn while there is still room to act, rather than at the cliff edge. */
const CORPUS_TOKEN_WARN = Math.floor(CORPUS_TOKEN_BUDGET * 0.85);

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

  if (tokenCount > CORPUS_TOKEN_WARN) {
    // The fix at this point is AI_SPEC.md §2's own fallback: score the
    // corpus sections by keyword overlap with the question and send the
    // best three. Not a vector database — the corpus is far too small for
    // embeddings to earn their infrastructure.
    console.warn(
      `[ask-the-lab] knowledge corpus is ${tokenCount} tokens of a ${CORPUS_TOKEN_BUDGET} budget` +
        `${tokenCount > CORPUS_TOKEN_BUDGET ? " — OVER BUDGET: every request will be rate-limited" : ""}.` +
        " Switch to per-section retrieval before adding more content.",
    );
  }

  cached = { text, tokenCount };
  return cached;
}
