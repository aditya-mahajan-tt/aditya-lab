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

/**
 * One independently retrievable unit of the corpus.
 *
 * Granularity is the whole point: buildProjectsSection() used to join every
 * project into a single string, which made "send the best sections" and
 * "send everything" the same operation. One section per entry is what lets
 * scoring prefer Turbotork over Kensara for a question about leadership.
 */
export type KnowledgeSection = {
  id: string;
  text: string;
  /** Title, category, tools and leadTopics — weighted above body text when scoring. */
  topics: string[];
  /** Identity and contact. Always sent, never scored. */
  pinned: boolean;
};

function buildProjectSections(): KnowledgeSection[] {
  return getAllProjects()
    .filter((p) => !p.confidential)
    .map((p): KnowledgeSection | null => {
      const title = field(p.title);
      if (!title) return null; // an unnamed project is worse than useless as grounding
      const text = section(`Project: ${title}${p.subtitle ? ` — ${p.subtitle}` : ""}`, [
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
      if (!text) return null;
      return {
        id: `project-${p.slug}`,
        text,
        topics: [title, ...p.category, ...p.tools],
        pinned: false,
      };
    })
    .filter((s): s is KnowledgeSection => s !== null);
}

function buildExperimentSections(): KnowledgeSection[] {
  return getAllExperiments()
    .map((e): KnowledgeSection | null => {
      const title = field(e.title);
      if (!title) return null;
      const text = section(`Experiment: ${title}`, [
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
      if (!text) return null;
      return {
        id: `experiment-${e.slug}`,
        text,
        topics: [title, e.type, ...e.tools],
        pinned: false,
      };
    })
    .filter((s): s is KnowledgeSection => s !== null);
}

function buildExperienceSections(): KnowledgeSection[] {
  return [...experience]
    .map((e): KnowledgeSection | null => {
      const bullets = e.bullets.map((b) => field(b)).filter((b): b is string => !!b);
      const highlights = e.highlights
        .map((h) => field(h.label) && `${h.value} — ${field(h.label)}`)
        .filter((h): h is string => !!h);
      const text = section(`Experience: ${e.role} at ${e.company}`, [
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
      if (!text) return null;
      return {
        id: `experience-${e.id}`,
        text,
        topics: [e.company, e.role, ...e.tools, ...e.leadTopics],
        pinned: false,
      };
    })
    .filter((s): s is KnowledgeSection => s !== null);
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

function buildKnowledgeSections(): KnowledgeSection[] {
  const single = (
    id: string,
    text: string | null,
    topics: string[],
    pinned = false,
  ): KnowledgeSection[] => (text ? [{ id, text, topics, pinned }] : []);

  return [
    ...single(
      "site",
      section("Site", [
        `Name: ${site.name}`,
        `Title: ${site.title}`,
        `Description: ${site.description}`,
      ]),
      [site.name, site.title],
      true,
    ),
    ...single("about", buildAboutSection(), ["about", "background", "bio", "aditya"], true),
    ...single("skills", buildSkillsSection(), skillGroups.map((g) => g.id)),
    ...buildExperienceSections(),
    ...single("education", buildEducationSection(), ["education", "degree", "university"]),
    ...buildProjectSections(),
    ...buildExperimentSections(),
    ...single("thinking", buildThinkingSection(), ["thinking", "process", "framework"]),
    ...single("contact", buildContactSection(), ["contact", "email", "resume", "hire"], true),
  ];
}

let cachedSections: KnowledgeSection[] | null = null;

/** Built once per server lifetime, same reasoning as getKnowledge() below. */
export function getKnowledgeSections(): KnowledgeSection[] {
  if (!cachedSections) cachedSections = buildKnowledgeSections();
  return cachedSections;
}

/**
 * Words too common to carry retrieval signal. Deliberately short: this is a
 * ~5,000-token corpus of one person's work, not a web index, so almost every
 * content word is discriminating. Over-stoplisting is the bigger risk —
 * dropping "AI" or "team" would break exactly the questions this exists for.
 */
const RETRIEVAL_STOP_WORDS = new Set([
  "the", "and", "for", "with", "you", "your", "his", "her", "their", "was",
  "are", "were", "has", "have", "had", "did", "does", "doing", "this", "that",
  "what", "when", "where", "which", "who", "why", "how", "about", "tell",
  "can", "could", "would", "should", "from", "into", "over", "than", "then",
  "any", "all", "some", "more", "most", "much", "many", "him", "she", "they",
  // Two-letter function words. Two-letter tokens are kept (see retrievalWords),
  // so the noise has to be stoplisted here rather than dropped by length.
  "is", "he", "of", "to", "in", "on", "do", "it", "me", "my", "we", "be",
  "an", "at", "by", "as", "or", "if", "so", "up", "us", "am", "no",
]);

/**
 * Two-letter tokens are kept: "AI", "PM" and "ML" are the corpus's most
 * discriminating words, and a length filter would silently drop them.
 */
function retrievalWords(text: string): string[] {
  const matched = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return [...new Set(matched.filter((w) => w.length >= 2 && !RETRIEVAL_STOP_WORDS.has(w)))];
}

function wordSet(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

/**
 * Topic matches score 3x a body match. Topics are the title, category,
 * tools and leadTopics — the same leadTopics signal system-prompt.ts rule 9
 * uses to order content, so a question that makes Turbotork the primary
 * reference for content also makes it the top-scoring section, and
 * link-suggestions.ts (Phase 2) ranks it first too. One signal, three
 * consumers, no disagreement.
 */
function scoreSection(candidate: KnowledgeSection, questionWords: string[]): number {
  const topics = candidate.topics.join(" ").toLowerCase();
  const body = candidate.text.toLowerCase();
  const topicWords = wordSet(topics);
  const bodyWords = wordSet(body);
  // Short words match whole words only: as a substring, "ai" would hit
  // "maintain" and "detail" and select nearly every section.
  const hit = (haystack: string, words: Set<string>, word: string) =>
    word.length <= 3 ? words.has(word) : haystack.includes(word);
  let score = 0;
  for (const word of questionWords) {
    if (hit(topics, topicWords, word)) score += 3;
    else if (hit(body, bodyWords, word)) score += 1;
  }
  return score;
}

/**
 * Pinned sections plus the best-scoring remainder that fits the budget.
 *
 * Fills to a token budget rather than taking a fixed top-N: sections vary
 * from ~40 tokens (education) to ~700 (a full case study), so "the best
 * three" either wastes most of the allowance or blows straight past it
 * depending on which three.
 */
function rankSections(question: string, context: string[]): KnowledgeSection[] {
  const all = getKnowledgeSections();
  const pinned = all.filter((s) => s.pinned);
  // A follow-up ("tell me more about that") names nothing itself; the entity
  // is in the prior turn. Scoring the question alone would ground it in
  // pinned sections only, and isGrounded would then refuse a correct answer.
  const words = retrievalWords([question, ...context].join(" "));

  const scored = all
    .filter((s) => !s.pinned)
    .map((s) => ({ section: s, score: scoreSection(s, words) }))
    .filter((r) => r.score > 0)
    // Tiebreak on id so selection is deterministic, which the answer cache
    // and these tests both rely on.
    .sort((a, b) => b.score - a.score || a.section.id.localeCompare(b.section.id));

  const chosen = [...pinned];
  let remaining =
    CORPUS_TOKEN_BUDGET - pinned.reduce((total, s) => total + estimateTokens(s.text), 0);

  for (const { section: candidate } of scored) {
    const cost = estimateTokens(candidate.text) + 1; // +1 for the joining newlines
    if (cost > remaining) continue; // skip, don't stop — a smaller section may still fit
    chosen.push(candidate);
    remaining -= cost;
  }

  return chosen;
}

/**
 * The section ids a question selects. Exported for logging and tests.
 * `context` is recent conversation text (prior turns) used as extra
 * retrieval signal; the budget bounds the result regardless of its length.
 */
export function selectSectionIds(question: string, context: string[] = []): string[] {
  return rankSections(question, context).map((s) => s.id);
}

/** The grounding text for one question — what actually goes in the prompt. */
export function selectKnowledge(question: string, context: string[] = []): Knowledge {
  const text = rankSections(question, context)
    .map((s) => s.text)
    .join("\n\n");
  return { text, tokenCount: estimateTokens(text) };
}

/** ~4 characters per token is a standard rough estimate for English text. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Each request sends the pinned sections plus the best-scoring sections
 * for that question (selectKnowledge), so grounding size is a per-request
 * cost, not a storage concern — and the binding limit is Groq's
 * tokens-per-minute ceiling, not the model's context window. The
 * models here hold 131,072 tokens; the free tier allows 8,000 per minute.
 * The context window is ~4% used and irrelevant.
 *
 * AI_SPEC.md §2 set the trigger for section retrieval at 20,000 tokens,
 * reasoning about context size. That number was unreachable: a request
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

  const text = getKnowledgeSections().map((s) => s.text).join("\n\n");
  const tokenCount = estimateTokens(text);

  // No warning on total size any more: since selectKnowledge() sends only
  // the sections a question needs, the total corpus is expected to exceed
  // what any one request spends. The guard that matters is per-request, and
  // it lives in e2e/knowledge-budget.spec.ts where npm run verify runs it.

  cached = { text, tokenCount };
  return cached;
}
