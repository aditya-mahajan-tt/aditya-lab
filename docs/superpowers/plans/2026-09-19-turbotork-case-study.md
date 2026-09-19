# Turbotork Case Study, Corpus Retrieval and Link Ranking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote Turbotork from six resume bullets to a full `/work` case study grounded in the studio repo, make Ask-the-Lab link chips rank by the same signal as content, and unblock both by replacing whole-corpus grounding with per-section retrieval.

**Architecture:** Four sequential phases. Phase 0 converts `lib/ai/knowledge.ts` from "one joined corpus string" to "an array of scored, individually selectable sections", which is a prerequisite — the corpus currently sits 6 tokens below its warn threshold and cannot absorb a case study. Phase 1 adds the Turbotork project entry. Phase 2 moves `leadTopics` onto the shared schema and rewrites `suggestLink` to take the question. Phase 3 lands the thinking layer, the systems diagram, and the dead-field cleanup.

**Tech Stack:** Next.js 15 App Router · React 19 · TypeScript 5.7 · Zod 3 · Playwright 1.49. **No new dependencies.**

## Global Constraints

- **No new dependencies.** Adding one requires Aditya's approval (CLAUDE.md §8). Everything here uses Zod, React and Playwright, all already present.
- **Content lives in `/data`,** never hardcoded in a component (CLAUDE.md §4).
- **Placeholder tokens are `[UPPER_SNAKE_REQUIRED]`,** written as literal inline strings. `scripts/check-placeholders.mjs` plain-text-scans `data/*.ts` source, so a token built from a constant is invisible to it (`data/schema.ts` `DRAFT_PATTERN` comment).
- **Draft marker is the literal string `"[AI_DRAFT_REVIEW] "` prefixed inline,** same reason.
- **Green is a signal, not decoration.** `DESIGN_SYSTEM.md` §2: ~5% signal colour; "if a section is tinted green, that is a bug, not a style."
- **`prefers-reduced-motion: reduce` must lose no information** (CLAUDE.md §4).
- **Renders correctly at 375 / 768 / 1280 / 1920px.**
- **Never name Turbotork clients, reproduce invoice/revenue records, or link the studio repo** — it has live Firebase admin credentials committed (spec §5.2, §9).
- **Batch verification.** Do not run full `npm run verify` after every step. Run the targeted Playwright spec per task; run `npm run verify` at each phase boundary (Aditya's stated preference).
- **Commit messages end with:** `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **Branch:** `phase/turbotork-case-study` (already created and checked out).

## Testing note — this repo has no unit-test runner

There is no Jest or Vitest. `e2e/knowledge-budget.spec.ts` establishes the pattern this plan follows: **a Node-run assertion living in the Playwright suite**, taking no `page` argument, because that suite is what `npm run verify` already runs with the project's TS path aliases.

Run a single spec with:

```bash
npx playwright test e2e/<name>.spec.ts --project=desktop
```

`--project=desktop` matters — without it every spec runs twice (desktop + mobile profiles).

Several tasks say "append to" an existing spec file and show an `import` line with the new tests. **Merge those imports into the file's existing top-of-file import block** rather than leaving an `import` in the middle — `eslint-config-next` enforces `import/first` and `npm run lint` will fail otherwise.

---

## File Structure

**Phase 0**
- Modify: `lib/ai/knowledge.ts` — section model, scoring, selection
- Modify: `app/api/ask/route.ts:89` — call `selectKnowledge(question)`
- Modify: `lib/ai/log.ts` — log selected section ids
- Modify: `e2e/knowledge-budget.spec.ts` — assert per-request, not total
- Create: `e2e/knowledge-retrieval.spec.ts`

**Phase 1**
- Modify: `data/projects.ts` — Turbotork entry, Adda reorder

**Phase 2**
- Modify: `data/schema.ts` — `leadTopics` onto `ProjectSchema`/`ExperimentSchema`
- Modify: `lib/ai/knowledge.ts` — emit PRIMARY REFERENCE for projects
- Modify: `lib/ai/link-suggestions.ts` — `suggestLink(answer, question)`
- Modify: `app/api/ask/route.ts:126`
- Modify: `data/queries.ts:99-116` — delete hero special case
- Create: `e2e/link-suggestions.spec.ts`

**Phase 3**
- Modify: `data/schema.ts` — delete `strategy`, `media`, `MediaSchema`; add `evidence` and `moment`
- Modify: `data/systems.ts`, `data/thinking.ts`, `data/experience.ts`, `data/skills.ts`, `data/about.ts`
- Modify: `lib/ai/suggested-questions.ts`
- Modify: `components/thinking/ThinkingFramework.tsx`
- Modify: `app/thinking/page.tsx`

---

# Phase 0 — Corpus retrieval

## Task 1: Emit the corpus as individually selectable sections

Today `buildProjectsSection()` joins **all** projects into one string and `buildExperienceSection()` joins **all** experience into another. Retrieval over two giant blobs buys nothing. This task changes granularity with no behaviour change — the full corpus is still sent.

**Files:**
- Modify: `lib/ai/knowledge.ts`
- Test: `e2e/knowledge-retrieval.spec.ts` (create)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `KnowledgeSection` type, `getKnowledgeSections(): KnowledgeSection[]`, `estimateTokens(text: string): number` (now exported). `getKnowledge(): Knowledge` keeps its existing signature and still returns the full joined corpus.

- [ ] **Step 1: Write the failing test**

Create `e2e/knowledge-retrieval.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import { getKnowledgeSections } from "@/lib/ai/knowledge";

/**
 * Retrieval is only as good as its granularity: if every project lives in
 * one "Projects" section, scoring can never prefer one project over
 * another. These assertions pin the section model itself.
 *
 * Node-run assertions in the Playwright suite, matching the pattern
 * established by e2e/knowledge-budget.spec.ts — no `page` argument, run
 * here because this suite already has the project's TS path aliases.
 */
test("each project and experience entry is its own retrievable section @retrieval", () => {
  const sections = getKnowledgeSections();
  const ids = sections.map((s) => s.id);

  expect(ids).toContain("project-kensara-ai-gtm");
  expect(ids).toContain("project-adda-d2c");
  expect(ids).toContain("experience-accordion");
  expect(ids).toContain("experience-turbotork");

  // No blob sections — the old joined form must be gone.
  expect(ids).not.toContain("projects");
  expect(ids).not.toContain("experience");
});

test("identity and contact sections are pinned @retrieval", () => {
  const pinned = getKnowledgeSections().filter((s) => s.pinned).map((s) => s.id);

  expect(pinned).toContain("site");
  expect(pinned).toContain("about");
  expect(pinned).toContain("contact");
});

test("every section carries topics for scoring @retrieval", () => {
  for (const section of getKnowledgeSections()) {
    expect(section.topics.length, `section ${section.id} has no topics`).toBeGreaterThan(0);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test e2e/knowledge-retrieval.spec.ts --project=desktop
```

Expected: FAIL — `getKnowledgeSections` is not exported from `@/lib/ai/knowledge`.

- [ ] **Step 3: Add the section model**

In `lib/ai/knowledge.ts`, directly above `function buildKnowledgeText()`, add:

```ts
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
```

- [ ] **Step 4: Convert the project and experience builders**

Replace `buildProjectsSection()` (currently at `lib/ai/knowledge.ts:85-109`) with:

```ts
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
```

Replace `buildExperienceSection()` (currently at `lib/ai/knowledge.ts:132-158`) with:

```ts
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
```

Note the deliberate removal of the `.sort()` on `leadTopics`. Position in a joined corpus was a weak ordering signal; with retrieval, `leadTopics` becomes a real scoring boost in Task 2, so the sort is now redundant.

- [ ] **Step 5: Convert the experiments builder**

Replace `buildExperimentsSection()` (currently at `lib/ai/knowledge.ts:111-130`) with:

```ts
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
```

- [ ] **Step 6: Rewrite the assembler**

Replace `buildKnowledgeText()` (currently at `lib/ai/knowledge.ts:196-211`) with:

```ts
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
```

- [ ] **Step 7: Keep `getKnowledge()` working**

`getKnowledge()` currently calls `buildKnowledgeText()`, which no longer exists. Change that one line to rebuild the full corpus from sections:

```ts
  const text = getKnowledgeSections().map((s) => s.text).join("\n\n");
```

Leave the rest of `getKnowledge()` — including the over-budget `console.warn` — exactly as it is for now. Task 3 revisits it.

- [ ] **Step 8: Export the token estimator**

Change `function estimateTokens` (at `lib/ai/knowledge.ts:213`) to `export function estimateTokens`. Task 2 needs it.

- [ ] **Step 9: Run the test to verify it passes**

```bash
npx playwright test e2e/knowledge-retrieval.spec.ts --project=desktop
```

Expected: 3 passed.

- [ ] **Step 10: Confirm no behaviour change**

```bash
npx playwright test e2e/knowledge-budget.spec.ts e2e/ask-the-lab.spec.ts --project=desktop
```

Expected: all passed. The corpus is still assembled from the same content in the same order, so the token count should be unchanged at 5072.

- [ ] **Step 11: Commit**

```bash
git add lib/ai/knowledge.ts e2e/knowledge-retrieval.spec.ts
git commit -m "refactor(ask-the-lab): emit the corpus as per-entry sections

No behaviour change -- the full corpus is still sent. buildProjectsSection
joined every project into one string, which made 'send the best sections'
and 'send everything' the same operation. One section per entry is the
granularity retrieval needs.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Score and select sections against the question

**Files:**
- Modify: `lib/ai/knowledge.ts`
- Test: `e2e/knowledge-retrieval.spec.ts`

**Interfaces:**
- Consumes: `KnowledgeSection`, `getKnowledgeSections()`, `estimateTokens()` from Task 1.
- Produces: `selectKnowledge(question: string): Knowledge` where `Knowledge = { text: string; tokenCount: number }` (the existing exported type), and `selectSectionIds(question: string): string[]` for logging and tests.

- [ ] **Step 1: Write the failing test**

Append to `e2e/knowledge-retrieval.spec.ts`:

```ts
import { CORPUS_TOKEN_BUDGET, estimateTokens, selectKnowledge, selectSectionIds } from "@/lib/ai/knowledge";

test("a question about a named project selects that project's section @retrieval", () => {
  const ids = selectSectionIds("Tell me about the Kensara AI project.");
  expect(ids).toContain("project-kensara-ai-gtm");
});

test("a leadTopics question selects the entry that claims the topic @retrieval", () => {
  // data/experience.ts gives Turbotork leadTopics including "fundraising".
  const ids = selectSectionIds("Has he ever raised funding?");
  expect(ids).toContain("experience-turbotork");
});

test("pinned sections are always selected, even for an unmatched question @retrieval", () => {
  const ids = selectSectionIds("what is your favourite colour");
  expect(ids).toContain("site");
  expect(ids).toContain("about");
  expect(ids).toContain("contact");
});

test("pinned sections alone fit inside the budget @retrieval", () => {
  const pinnedTokens = getKnowledgeSections()
    .filter((s) => s.pinned)
    .reduce((total, s) => total + estimateTokens(s.text), 0);

  expect(
    pinnedTokens,
    `Pinned sections are ${pinnedTokens} tokens against a budget of ${CORPUS_TOKEN_BUDGET}. ` +
      `Pinned content is sent on every request and cannot be dropped, so this must always fit.`,
  ).toBeLessThanOrEqual(CORPUS_TOKEN_BUDGET);
});

test("selection is deterministic for the same question @retrieval", () => {
  const a = selectSectionIds("What has he built?");
  const b = selectSectionIds("What has he built?");
  expect(a).toEqual(b);
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test e2e/knowledge-retrieval.spec.ts --project=desktop
```

Expected: FAIL — `selectKnowledge` / `selectSectionIds` are not exported.

- [ ] **Step 3: Add scoring and selection**

Append to `lib/ai/knowledge.ts`, after `getKnowledgeSections()`:

```ts
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
]);

function retrievalWords(text: string): string[] {
  const matched = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return [...new Set(matched.filter((w) => w.length > 2 && !RETRIEVAL_STOP_WORDS.has(w)))];
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
  let score = 0;
  for (const word of questionWords) {
    if (topics.includes(word)) score += 3;
    else if (body.includes(word)) score += 1;
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
function rankSections(question: string): KnowledgeSection[] {
  const all = getKnowledgeSections();
  const pinned = all.filter((s) => s.pinned);
  const words = retrievalWords(question);

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

/** The section ids a question selects. Exported for logging and tests. */
export function selectSectionIds(question: string): string[] {
  return rankSections(question).map((s) => s.id);
}

/** The grounding text for one question — what actually goes in the prompt. */
export function selectKnowledge(question: string): Knowledge {
  const text = rankSections(question)
    .map((s) => s.text)
    .join("\n\n");
  return { text, tokenCount: estimateTokens(text) };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx playwright test e2e/knowledge-retrieval.spec.ts --project=desktop
```

Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/ai/knowledge.ts e2e/knowledge-retrieval.spec.ts
git commit -m "feat(ask-the-lab): score and select corpus sections per question

Topic matches score 3x body matches, so leadTopics drives retrieval the
same way it already drives content ordering. Fills to a token budget
rather than a fixed top-N, because sections range from ~40 to ~700 tokens.

Not yet wired into the request path.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: Wire retrieval into the request path and retarget the budget guard

`e2e/knowledge-budget.spec.ts` currently asserts the **total** corpus fits one request. After this task that premise is wrong — the whole point is that the total may exceed what any single request sends. Left unchanged, this test turns red the moment Phase 1 adds Turbotork, and it would be reporting a non-problem.

**Files:**
- Modify: `app/api/ask/route.ts:89`, `app/api/ask/route.ts:115`
- Modify: `lib/ai/log.ts`
- Modify: `lib/ai/knowledge.ts` (the warn branch)
- Modify: `e2e/knowledge-budget.spec.ts`

**Interfaces:**
- Consumes: `selectKnowledge`, `selectSectionIds` from Task 2.
- Produces: `logQuestion` accepts an optional `sections?: string[]`.

- [ ] **Step 1: Rewrite the budget guard to assert per-request**

Replace the test body in `e2e/knowledge-budget.spec.ts` (keep the file's existing doc comment, amending its last paragraph as shown):

```ts
import { test, expect } from "@playwright/test";
import { CORPUS_TOKEN_BUDGET, selectKnowledge } from "@/lib/ai/knowledge";
import { SUGGESTED_QUESTIONS } from "@/lib/ai/suggested-questions";

test.describe.configure({ mode: "serial" });

/**
 * Questions chosen to stress retrieval rather than flatter it: the six
 * chips a visitor can click without typing, plus questions that legitimately
 * pull several large sections at once, plus one that matches nothing.
 */
const ADVERSARIAL_QUESTIONS = [
  "Tell me about every project he has worked on in detail.",
  "Compare his work at Turbotork and Accordion and Kensara and Adda.",
  "What AI, product, business, strategy, engineering and growth work has he done?",
  "Describe his experience leading teams, raising funding and building products.",
  "asdfghjkl",
];

for (const question of [...SUGGESTED_QUESTIONS, ...ADVERSARIAL_QUESTIONS]) {
  test(`grounding for "${question}" fits one request's token budget @budget`, () => {
    const { tokenCount } = selectKnowledge(question);

    expect(
      tokenCount,
      `Grounding for "${question}" is ${tokenCount} tokens against a budget of ` +
        `${CORPUS_TOKEN_BUDGET}. This request would exceed Groq's per-minute ` +
        `allowance and fail, surfacing to the visitor as "AI CORE TEMPORARILY ` +
        `OFFLINE". Fix the selection in lib/ai/knowledge.ts rather than raising ` +
        `the budget -- the budget is Groq's, not ours.`,
    ).toBeLessThanOrEqual(CORPUS_TOKEN_BUDGET);
  });
}
```

Then amend the file's closing doc paragraph, which currently reads "If this fails: implement AI_SPEC.md §2's per-section retrieval...", to:

```
 * Per-section retrieval is implemented (lib/ai/knowledge.ts selectKnowledge).
 * If this fails, a single question is now selecting more than one request can
 * spend — tighten selection, do not raise the budget.
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test e2e/knowledge-budget.spec.ts --project=desktop
```

Expected: FAIL — `SUGGESTED_QUESTIONS` import resolves, but `selectKnowledge` is only reachable once Task 2 landed; if Task 2 is complete this should already PASS. **If it passes here, that is correct** — proceed to Step 3. The failing-first cycle for this behaviour was Task 2.

- [ ] **Step 3: Add section logging**

In `lib/ai/log.ts`, add one field to the `logQuestion` parameter type, after `failedOver`:

```ts
  /** Which corpus sections grounded this answer — the diagnostic for a retrieval miss. */
  sections?: string[];
```

and one line to the `JSON.stringify` object, after the `failedOver` spread:

```ts
      ...(entry.sections?.length ? { sections: entry.sections } : {}),
```

- [ ] **Step 4: Wire retrieval into the route**

In `app/api/ask/route.ts`, change the import on line 15's neighbourhood — find the existing `getKnowledge` import from `@/lib/ai/knowledge` and replace it with:

```ts
import { selectKnowledge, selectSectionIds } from "@/lib/ai/knowledge";
```

Replace line 89:

```ts
  const knowledge = getKnowledge();
```

with:

```ts
  // Grounding is now per-question (AI_SPEC.md §2): the whole corpus no
  // longer fits one request's token allowance. isGrounded below checks
  // against these same sections, which is the honest pairing -- the model
  // cannot be asked to source a claim from text it was never shown.
  const knowledge = selectKnowledge(question);
  const sections = selectSectionIds(question);
```

Then in the `logQuestion` call at line 115, add one property after `failedOver`:

```ts
      sections,
```

Leave `getCached` / `setCached` keyed on the question alone. Selection is a pure function of the question over a static corpus, so the same question always selects the same sections and therefore the same grounding — the cache stays correct. (The design spec §4.3 claimed the key needed section ids too; that was over-cautious and is not implemented.)

- [ ] **Step 5: Soften the now-misleading warn in `getKnowledge()`**

`getKnowledge()` still warns when the *total* corpus exceeds budget, which is now expected and not an error. In `lib/ai/knowledge.ts`, replace the `if (tokenCount > CORPUS_TOKEN_WARN) { console.warn(...) }` block with:

```ts
  // No warning on total size any more: since selectKnowledge() sends only
  // the sections a question needs, the total corpus is expected to exceed
  // what any one request spends. The guard that matters is per-request, and
  // it lives in e2e/knowledge-budget.spec.ts where npm run verify runs it.
```

Delete the now-unused `CORPUS_TOKEN_WARN` constant.

- [ ] **Step 6: Run the tests**

```bash
npx playwright test e2e/knowledge-budget.spec.ts e2e/knowledge-retrieval.spec.ts e2e/ask-the-lab.spec.ts --project=desktop
```

Expected: all passed.

- [ ] **Step 7: Run full verification — phase boundary**

```bash
npm run verify
```

Expected: all steps green.

- [ ] **Step 8: Commit**

```bash
git add app/api/ask/route.ts lib/ai/log.ts lib/ai/knowledge.ts e2e/knowledge-budget.spec.ts
git commit -m "feat(ask-the-lab): ground each answer in retrieved sections

Retargets the budget guard from total corpus size to per-request grounding
size, across the six suggested questions plus an adversarial set. The old
assertion would have gone red on the next content addition while reporting
a non-problem.

Logs the selected section ids so a retrieval miss is diagnosable rather
than invisible.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# Phase 1 — Turbotork as a case study

## Task 4: Add the Turbotork project entry

**Files:**
- Modify: `data/projects.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: a project with `slug: "turbotork"`, `order: 1`. Later tasks reference `/work/turbotork` and the section id `project-turbotork`.

- [ ] **Step 1: Write the failing test**

Append to `e2e/knowledge-retrieval.spec.ts`:

```ts
test("Turbotork is a retrievable project section @retrieval", () => {
  expect(getKnowledgeSections().map((s) => s.id)).toContain("project-turbotork");
});

test("AI, leadership and founding questions retrieve Turbotork @retrieval", () => {
  for (const question of [
    "What AI work has he done?",
    "Has he led a team?",
    "Tell me about his founding experience.",
  ]) {
    expect(selectSectionIds(question), `question: ${question}`).toContain("project-turbotork");
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test e2e/knowledge-retrieval.spec.ts --project=desktop
```

Expected: FAIL — `project-turbotork` not found.

- [ ] **Step 3: Update the file's header comment**

In `data/projects.ts`, replace the paragraph reading "Turbotork moved out of this file entirely (2026-09-05) — it's work experience, not a case study; see data/experience.ts." with:

```
 * 2026-09-19: the 2026-09-05 decision to keep Turbotork out of this file is
 * deliberately reversed. It was defensible while the only source material
 * was six resume bullets; once the studio repo (TT Garage Portal) was
 * supplied as source of truth, Turbotork became the deepest-evidenced work
 * on the site and the only entry spanning all three planes. Keeping the
 * deepest evidence on the shallowest surface was also what made it
 * unlinkable by lib/ai/link-suggestions.ts, which only ranks projects and
 * experiments. The /about experience entry remains, trimmed to a pointer.
 *
 * Product surfaces, architecture patterns and integration names are in
 * scope; client names, invoice and revenue records, and any link to the
 * studio repo are not — it has live Firebase admin credentials committed.
 * See docs/superpowers/specs/2026-09-19-turbotork-case-study-design.md §5.2.
```

- [ ] **Step 4: Change Adda's order from 1 to 2**

In the `adda-d2c` entry, replace the comment block above `status: "CASE STUDY"` and the `order` value:

```ts
    // Led the Work list from 2026-09-10 as "the most complete project
    // narrative on the site". Turbotork took that slot on 2026-09-19 — the
    // reason for the promotion expired when a deeper narrative landed.
    status: "CASE STUDY",
    featured: true,
    order: 2,
```

Then change `kensara-ai-gtm`'s `order: 2` to `order: 3`, and `gostops-gtm`'s `order: 3` to `order: 4`, and `leadiq`'s `order: 4` to `order: 5`. Orders must stay unique — `getAllProjects()` sorts on them.

- [ ] **Step 5: Add the Turbotork entry**

Insert as the **first** element of the `raw` array in `data/projects.ts`:

```ts
  {
    id: "005",
    slug: "turbotork",
    planes: ["ai", "product", "business"],
    title: "Turbotork",
    subtitle: "Fleet-Service SaaS, 0→1",
    category: ["Product", "AI", "Automation"],
    year: "2025–2026",
    status: "SHIPPED",
    featured: true,
    order: 1,
    // Ask the Lab grounds AI / leadership / founding questions here first.
    // Moved from the data/experience.ts entry (2026-09-19) along with the
    // content it points at. See lib/ai/system-prompt.ts rule 9.
    leadTopics: [
      "AI",
      "AI product",
      "AI agents and automation",
      "leadership",
      "managing or leading a team",
      "entrepreneurship and founding",
      "startups and 0-to-1 building",
      "fundraising",
      "ownership and end-to-end product",
    ],

    summary:
      "Founding AI Product Manager at an early-stage fleet-service SaaS: owned the product end to end, led two engineers, and built the agent workflow that let a two-person team ship a multi-product platform — inspections, diagnostics, analytics, billing and customer portals — to 40+ clients.",

    context:
      "Turbotork is an early-stage fleet-service business running vehicle servicing for corporate fleets. Aditya joined out of the founder's office as its founding AI Product Manager, with the garage operation running the way most of the category still does: job cards on paper, pricing in spreadsheets, and status updates over phone calls.",
    problem:
      "Nothing was measurable. Without a system of record there was no turnaround time to improve, no cost leakage to find, and no way to tell a fleet customer where their vehicle was. Demand could be scaled by adding people; throughput could not — and the engineering team available to fix that was two people.",
    role: "Founding AI Product Manager, Founder's Office — owned the product end to end, led a two-person engineering team, and helped shape the pitch that closed the pre-seed round.",
    thinking:
      "Two questions decided the sequence. First: what actually binds? Not demand — measurability, which meant the system of record had to exist before anything clever could run on it. Second, applied to the team itself: where does a two-person engineering team's time actually go? Not typing. Planning, rebuilding context, and review. That reframed engineering throughput as a product problem with its own users, and it is what produced the agent workflow — not an interest in agents for their own sake.",
    approach:
      "Two systems, built together. The platform: a strict service layer over Firestore with every mutation routed through server actions, and five distinct roles from technician to fleet driver, so the data model enforced who could do what rather than the UI hiding it. And the workflow that built it: four agents — planner, implementer, reviewer, release — with declared tool postures and explicit handoffs, backed by fourteen domain skill definitions and a short list of architectural rules the agents had to obey. Encoding the rules beat reviewing the output, because review effort scales with volume and a constraint does not.",
    execution:
      "The platform grew from one workflow to five. Digital job cards first, then TT Xpress — structured vehicle inspections driven by versioned templates holding their own thresholds, section weights and scoring rules, so the service standard could change without a deploy. Then OBD diagnostics with a fault-code library and health scoring, surfaced to fleet customers as a public, login-free report page. Then analytics over revenue, turnaround time and technician workload, and billing with GST-compliant invoicing and financial-year invoice counters. Payments, vehicle-registration lookup, WhatsApp and voice were integrated as the operation needed them.",
    outcome:
      "40+ clients and 400+ vehicles, ₹30L+ revenue in five months across 1,000+ jobs, and a $250K pre-seed round closed via Antler on a pitch Aditya helped shape as a founding team member.",
    learnings: [
      "[AI_DRAFT_REVIEW] AI multiplies structure; it cannot create it. The repair-suggestion and summarisation features only worked because the job-card workflow had already turned a paper process into clean, consistent records. Had the AI gone first, it would have had nothing to be good at — the sequencing wasn't project management, it was the bet.",
      "[AI_DRAFT_REVIEW] With AI writing most of the code, reviewing output is the wrong lever. Review effort scales with volume, and volume was suddenly unbounded. What actually held quality was a short list of architectural rules the agents had to obey, because a constraint costs the same whether it governs ten changes or a thousand.",
      "[AI_DRAFT_REVIEW] A two-person team's real bottleneck was never typing speed — it was planning, context-rebuilding and review. Splitting the work into named roles with explicit handoffs bought more than any individual tool did, because it attacked the coordination cost rather than the keystroke cost.",
    ],
    reflection:
      "[AI_DRAFT_REVIEW] I wrote over two hundred internal documents and close to zero meaningful automated tests. At the time that felt like diligence; in hindsight it was the same instinct pointed at the wrong target. Documentation captures what I understood on the day I wrote it and then silently rots. A test captures it and keeps checking. Given how much of the code was AI-generated, tests were exactly the constraint I most needed and least built — I enforced architecture rules on the agents rigorously and left correctness to manual QA. If I ran it again, the agent rules and the test suite would go in together, on day one, because they are the same idea: make the system tell you when it is wrong instead of hoping someone notices.",

    tools: [
      "Next.js", "React", "TypeScript", "Firebase", "Firestore",
      "Google AI / Genkit", "Twilio", "Razorpay", "GSTN", "Exotel",
    ],
    process: [
      { label: "SYSTEM OF RECORD", detail: "Digitise the job-card workflow end to end, so operations produce data instead of paper." },
      { label: "INSPECTION", detail: "Versioned inspection templates carrying their own thresholds and scoring, so the standard changes without a deploy." },
      { label: "DIAGNOSTICS", detail: "Fault-code library and health scoring, surfaced to fleet customers as a login-free report." },
      { label: "INTELLIGENCE", detail: "Analytics and AI workflows layered onto data the earlier steps had already made clean." },
      { label: "LEVERAGE", detail: "Four agent roles with explicit handoffs, so a two-person team's bottleneck was coordination, not keystrokes." },
    ],
    metrics: [
      { label: "clients", value: "40+", note: "400+ vehicles under service" },
      { label: "revenue in 5 months", value: "₹30L+", note: "across 1,000+ jobs" },
      { label: "pre-seed raised", value: "$250K", note: "via Antler" },
    ],
    links: [],
  },
```

Note: no `media` key — Task 9 deletes the field. No repo link, by §5.2.

- [ ] **Step 6: Run the tests**

```bash
npx playwright test e2e/knowledge-retrieval.spec.ts --project=desktop
```

Expected: all passed, including the two new Turbotork assertions.

- [ ] **Step 7: Confirm the placeholder gate behaves as designed**

```bash
node scripts/check-placeholders.mjs
```

Expected: reports the three `[AI_DRAFT_REVIEW]` learnings and the reflection in `data/projects.ts`, and **exits non-zero**. This is correct — the drafts are Aditya's to rewrite (spec §8) and must not ship unreviewed. `npm run verify` will fail at the `placeholders` step until he replaces them.

- [ ] **Step 8: Commit**

```bash
git add data/projects.ts e2e/knowledge-retrieval.spec.ts
git commit -m "feat(work): add Turbotork as a case study

Reverses the 2026-09-05 decision to keep Turbotork in experience only.
Defensible when the source was six resume bullets; not once the studio
repo landed as source of truth. Takes the Work lead slot from Adda, whose
promotion reason -- most complete narrative on the site -- expired.

Learnings and reflection ship behind [AI_DRAFT_REVIEW] for Aditya to
rewrite; check-placeholders fails production until he does, by design.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# Phase 2 — Link ranking

## Task 5: Move `leadTopics` onto the shared schema

**Files:**
- Modify: `data/schema.ts:226` area, `ProjectSchema`, `ExperimentSchema`
- Modify: `lib/ai/knowledge.ts` — emit PRIMARY REFERENCE for projects
- Modify: `data/experience.ts` — drop Turbotork's `leadTopics`

**Interfaces:**
- Consumes: the Turbotork project from Task 4.
- Produces: `leadTopics: string[]` available on `Project`, `Experiment` and `ExperienceEntry`.

- [ ] **Step 1: Write the failing test**

Append to `e2e/knowledge-retrieval.spec.ts`:

```ts
test("a project's leadTopics reach the corpus as a PRIMARY REFERENCE line @retrieval", () => {
  const turbotork = getKnowledgeSections().find((s) => s.id === "project-turbotork");
  expect(turbotork).toBeDefined();
  expect(turbotork!.text).toContain("PRIMARY REFERENCE for questions about:");
  expect(turbotork!.text).toContain("fundraising");
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test e2e/knowledge-retrieval.spec.ts --project=desktop
```

Expected: FAIL — no PRIMARY REFERENCE line in the project section.

- [ ] **Step 3: Add `leadTopics` to the project and experiment schemas**

In `data/schema.ts`, move the `leadTopics` doc comment out of `ExperienceEntrySchema` into a shared constant above `ProjectSchema`:

```ts
/**
 * Topics this entry is the canonical answer for. Ask the Lab surfaces these
 * into the grounding corpus (lib/ai/knowledge.ts), scores retrieval against
 * them, and is instructed by system-prompt.ts rule 9 to ground a matching
 * question here first. lib/ai/link-suggestions.ts ranks link chips on the
 * same signal, so content and links cannot disagree.
 *
 * Ordering preference only — it never licenses a claim the entry does not
 * already make in its own fields.
 */
const LeadTopics = z.array(z.string()).default([]);
```

Add `leadTopics: LeadTopics,` to `ProjectSchema` (after `order`), to `ExperimentSchema`, and replace the existing inline declaration in `ExperienceEntrySchema` with `leadTopics: LeadTopics,`, deleting its now-duplicated doc comment.

- [ ] **Step 4: Emit the line for projects**

In `lib/ai/knowledge.ts`, inside `buildProjectSections()`, insert one line into the `section()` array immediately **before** `field(p.summary) && ...`:

```ts
        p.leadTopics.length > 0
          ? `PRIMARY REFERENCE for questions about: ${p.leadTopics.join(", ")}.`
          : null,
```

and add `...p.leadTopics` to that section's `topics` array:

```ts
        topics: [title, ...p.category, ...p.tools, ...p.leadTopics],
```

Apply the same two changes to `buildExperimentSections()`.

- [ ] **Step 5: Remove Turbotork's experience `leadTopics`**

In `data/experience.ts`, delete the `leadTopics: [...]` array and its comment from the `turbotork` entry. The topics now live on the project (Task 4), and duplicating them would make the experience entry compete with the case study for the same questions.

- [ ] **Step 6: Run the tests**

```bash
npx playwright test e2e/knowledge-retrieval.spec.ts --project=desktop
```

Expected: all passed.

- [ ] **Step 7: Commit**

```bash
git add data/schema.ts lib/ai/knowledge.ts data/experience.ts e2e/knowledge-retrieval.spec.ts
git commit -m "refactor(data): make leadTopics a shared field across entry types

Projects and experiments can now claim canonical topics, not just
experience entries. Turbotork's topics move with its content to the case
study so the two entries stop competing for the same questions.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: Rank link chips by question, not array position

**Files:**
- Modify: `lib/ai/link-suggestions.ts:60-77`
- Modify: `app/api/ask/route.ts:126`
- Test: `e2e/link-suggestions.spec.ts` (create)

**Interfaces:**
- Consumes: `leadTopics` on projects from Task 5.
- Produces: `suggestLink(answer: string, question: string): LinkSuggestion | null`.

- [ ] **Step 1: Write the failing test**

Create `e2e/link-suggestions.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import { suggestLink } from "@/lib/ai/link-suggestions";

/**
 * The defect this pins: suggestLink used to iterate getAllProjects() in
 * array order and return the first title it found in the answer. An answer
 * mentioning both Kensara AI and Turbotork always linked to whichever sat
 * earlier in data/projects.ts, regardless of what was asked.
 */
test("a leadTopics question links to the entry that claims the topic @links", () => {
  const answer =
    "Aditya led GTM strategy for Kensara AI, and at Turbotork he led a two-person " +
    "engineering team as founding AI Product Manager.";

  const link = suggestLink(answer, "Has he ever led an engineering team?");

  expect(link).not.toBeNull();
  expect(link!.href).toBe("/work/turbotork");
});

test("without a topic match, the earliest mention wins @links", () => {
  const answer = "Kensara AI was a national case competition. Turbotork was a fleet-service SaaS.";

  const link = suggestLink(answer, "what did he do in 2026");

  expect(link).not.toBeNull();
  expect(link!.href).toBe("/work/kensara-ai-gtm");
});

test("an answer naming nothing returns no chip @links", () => {
  expect(suggestLink("He enjoys ambiguous problems.", "what does he enjoy")).toBeNull();
});

test("a project named in the answer still links when the question is vague @links", () => {
  const link = suggestLink("Adda is a D2C wellness brand he founded.", "tell me more");
  expect(link).not.toBeNull();
  expect(link!.href).toBe("/work/adda-d2c");
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test e2e/link-suggestions.spec.ts --project=desktop
```

Expected: FAIL — `suggestLink` takes one argument; the first test returns `/work/kensara-ai-gtm`.

- [ ] **Step 3: Rewrite `suggestLink`**

In `lib/ai/link-suggestions.ts`, replace the whole `suggestLink` function (lines 60-77) with:

```ts
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
 * Now: a candidate whose leadTopics match the question wins; otherwise the
 * one mentioned earliest in the answer wins, because that is what the
 * answer actually led with.
 */
export function suggestLink(answer: string, question: string): LinkSuggestion | null {
  const mentioned = linkCandidates()
    .map((c) => ({ candidate: c, at: answer.indexOf(c.title) }))
    .filter((m) => m.at !== -1);

  if (mentioned.length === 0) return null;

  const asked = question.toLowerCase();
  const byTopic = mentioned.filter((m) =>
    m.candidate.leadTopics.some((topic) => asked.includes(topic.toLowerCase())),
  );

  const pool = byTopic.length > 0 ? byTopic : mentioned;
  const best = pool.reduce((a, b) => (a.at <= b.at ? a : b));

  return { label: best.candidate.label, href: best.candidate.href };
}
```

- [ ] **Step 4: Pass the question at the call site**

In `app/api/ask/route.ts`, change line 126 from:

```ts
    const link = grounded ? (suggestLink(answer) ?? undefined) : undefined;
```

to:

```ts
    const link = grounded ? (suggestLink(answer, question) ?? undefined) : undefined;
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx playwright test e2e/link-suggestions.spec.ts --project=desktop
```

Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add lib/ai/link-suggestions.ts app/api/ask/route.ts e2e/link-suggestions.spec.ts
git commit -m "fix(ask-the-lab): rank link chips by question, not array position

suggestLink returned the first project whose title appeared in the answer,
in declaration order, so an answer covering both Kensara AI and Turbotork
always linked to Kensara regardless of what was asked -- and before
Turbotork became a project it could not win a chip at all.

Now leadTopics decide, with earliest mention as the tiebreak: the same
signal that already orders content.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: Delete the hero's hardcoded Turbotork special case

**Files:**
- Modify: `data/queries.ts:99-116`

**Interfaces:**
- Consumes: the Turbotork project from Task 4.
- Produces: `getHeroBodies()` no longer reads `experience`.

- [ ] **Step 1: Write the failing test**

Append to `e2e/link-suggestions.spec.ts`:

```ts
import { getHeroBodies } from "@/data/queries";

test("the hero reaches Turbotork through its case study, not /about @links", () => {
  const bodies = getHeroBodies();
  const turbotork = bodies.filter((b) => b.label === "Turbotork");

  expect(turbotork).toHaveLength(1);
  expect(turbotork[0]!.href).toBe("/work/turbotork");
  expect(bodies.some((b) => b.id.startsWith("experience-"))).toBe(false);
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test e2e/link-suggestions.spec.ts --project=desktop
```

Expected: FAIL — two bodies labelled Turbotork (one from `outerProjects`, one from `outerExperience`).

- [ ] **Step 3: Delete the special case**

In `data/queries.ts`, delete the entire `outerExperience` constant (the block beginning `const outerExperience: HeroBody[] = experience` through its closing `}));`), and remove `...outerExperience` from the return statement, leaving:

```ts
  return [...inner, ...outerProjects, ...outerExperiments];
```

Delete the now-unused `import { experience } from "./experience";` and the `PlaneValue` import if nothing else in the file uses it (check: `HeroBody` still declares `planes: PlaneValue[]`, so **keep** `PlaneValue`).

Then amend the `getHeroBodies` doc comment, replacing the sentence "projects.ts and experiments.ts alone would leave the AI plane almost empty; Turbotork (the only selected experience.ts entry, via its optional `planes` field) is what gives it real weight." with:

```
 * Turbotork carried the AI plane via a hardcoded experience-entry special
 * case until 2026-09-19; it is now an ordinary project (data/projects.ts)
 * and needs none.
```

- [ ] **Step 4: Remove the now-dead `planes` field from the experience entry**

In `data/experience.ts`, delete `planes: ["ai", "product", "business"],` from the `turbotork` entry — nothing reads `ExperienceEntry.planes` any more. Leave the optional field on `ExperienceEntrySchema`; removing it from the schema is a separate concern and no other entry uses it.

- [ ] **Step 5: Run the tests**

```bash
npx playwright test e2e/link-suggestions.spec.ts e2e/smoke.spec.ts --project=desktop
```

Expected: all passed.

- [ ] **Step 6: Run full verification — phase boundary**

```bash
npm run verify
```

Expected: green except the `placeholders` step, which fails on the Task 4 `[AI_DRAFT_REVIEW]` drafts. That failure is expected until Aditya rewrites them.

- [ ] **Step 7: Commit**

```bash
git add data/queries.ts data/experience.ts e2e/link-suggestions.spec.ts
git commit -m "refactor(hero): drop the hardcoded Turbotork experience body

getHeroBodies carried a special case reading one hand-picked experience
entry, with a hardcoded display label and an /about href, because Turbotork
had no case study to point at. It has one now, so the special case and its
experience import are deleted -- Turbotork is an ordinary project body.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# Phase 3 — Content and the thinking layer

## Task 8: Delete the dead `strategy` and `media` fields

**Files:**
- Modify: `data/schema.ts`
- Modify: `data/projects.ts`

**Interfaces:**
- Produces: `ProjectSchema` without `strategy` or `media`; `MediaSchema` removed.

- [ ] **Step 1: Confirm both fields are genuinely unused**

```bash
grep -rn "\.media\|MediaSchema\|\.strategy\|project.strategy" --include="*.tsx" --include="*.ts" app components lib | grep -v node_modules
```

Expected: no output. If anything appears, stop and report — the field is live and must not be deleted.

- [ ] **Step 2: Delete from the schema**

In `data/schema.ts`: delete the `MediaSchema` declaration and the `/* ---- media ---- */` banner above it if it now only covers `LinkSchema` (keep `LinkSchema`). From `ProjectSchema`, delete the lines `strategy: z.string().optional(),` and `media: z.array(MediaSchema).default([]),`. Delete `export type Media = ...` if present.

Add above `ProjectSchema`:

```ts
/**
 * `strategy` and `media` were removed on 2026-09-19: both were declared,
 * both were carried by every project, and neither was read by any
 * component. `media` returns when a real, publishable product image exists
 * to justify it — the asset first, then the surface (CLAUDE.md §3.1).
 */
```

- [ ] **Step 3: Delete from the data**

In `data/projects.ts`, delete every `media: [],` line (one per project entry). No entry uses `strategy`.

- [ ] **Step 4: Verify the types still compile**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add data/schema.ts data/projects.ts
git commit -m "refactor(data): delete the unused strategy and media fields

Both declared on ProjectSchema, both carried by every project, neither read
by any component. media returns when there is a real publishable asset to
justify rendering it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 9: Retarget `AUTOMATION ENGINE` and add `AGENT PIPELINE`

**Files:**
- Modify: `data/systems.ts`

**Interfaces:**
- Consumes: `/work/turbotork` from Task 4.

- [ ] **Step 1: Write the failing test**

Append to `e2e/link-suggestions.spec.ts`:

```ts
import { systemDiagrams } from "@/data/systems";

test("system diagrams point at the Turbotork case study @links", () => {
  const automation = systemDiagrams.find((d) => d.id === "automation-engine");
  expect(automation?.relatedProjectSlug).toBe("turbotork");
  expect(automation?.relatedLink).toBeUndefined();

  const agents = systemDiagrams.find((d) => d.id === "agent-pipeline");
  expect(agents).toBeDefined();
  expect(agents!.nodes.length).toBeGreaterThanOrEqual(4);
  expect(agents!.relatedProjectSlug).toBe("turbotork");
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test e2e/link-suggestions.spec.ts --project=desktop
```

Expected: FAIL — `agent-pipeline` is undefined.

- [ ] **Step 3: Retarget `AUTOMATION ENGINE`**

In `data/systems.ts`, replace the two comment lines and the `relatedLink` on the `automation-engine` entry with:

```ts
    relatedProjectSlug: "turbotork",
```

- [ ] **Step 4: Add the `AGENT PIPELINE` diagram**

Insert as the second element of the `raw` array in `data/systems.ts`:

```ts
  {
    id: "agent-pipeline",
    title: "AGENT PIPELINE",
    description:
      "How a two-person engineering team's work was split so the bottleneck stopped being coordination.",
    nodes: [
      { label: "PLAN", detail: "Turn a request into an implementation-ready plan. Reads the codebase; writes nothing." },
      { label: "IMPLEMENT", detail: "Make the smallest safe change against the approved plan." },
      { label: "REVIEW", detail: "Findings first, summary second — correctness, regression risk, architecture compliance, test gaps." },
      { label: "RELEASE", detail: "Deployment readiness and the regression coverage that has to pass before it ships." },
      { label: "RULES", detail: "A short list of architectural constraints every stage obeys — cheaper than reviewing every diff." },
    ],
    relatedProjectSlug: "turbotork",
  },
```

- [ ] **Step 5: Run the tests**

```bash
npx playwright test e2e/link-suggestions.spec.ts --project=desktop
```

Expected: all passed.

- [ ] **Step 6: Commit**

```bash
git add data/systems.ts e2e/link-suggestions.spec.ts
git commit -m "feat(systems): add the AGENT PIPELINE diagram, retarget AUTOMATION ENGINE

systems.ts already renders node pipelines, which is a better home for the
four-agent workflow than a paragraph inside the case study's APPROACH.
AUTOMATION ENGINE's relatedLink pointed at /about because Turbotork had no
case study; it now uses relatedProjectSlug like every other diagram.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 10: Fill `thinking.principles[]` with the four root principles

**Files:**
- Modify: `data/schema.ts` — `evidence` on the principle object
- Modify: `data/thinking.ts`
- Modify: `app/thinking/page.tsx`

**Interfaces:**
- Produces: `thinking.principles` non-empty, each with `evidence: { label, url }[]`.

- [ ] **Step 1: Write the failing test**

Create `e2e/thinking.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import { thinking } from "@/data/thinking";

test("every principle cites at least two pieces of real work @thinking", () => {
  expect(thinking.principles.length).toBeGreaterThanOrEqual(4);
  for (const principle of thinking.principles) {
    expect(principle.evidence.length, `principle "${principle.title}" cites too little`)
      .toBeGreaterThanOrEqual(2);
  }
});

test("the principles render on /thinking @thinking", async ({ page }) => {
  await page.goto("/thinking");
  for (const principle of thinking.principles) {
    await expect(page.getByText(principle.title, { exact: false }).first()).toBeVisible();
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test e2e/thinking.spec.ts --project=desktop
```

Expected: FAIL — `principles` is empty and has no `evidence` property.

- [ ] **Step 3: Add `evidence` to the schema**

In `data/schema.ts`, replace the `principles` line in `ThinkingSchema` with:

```ts
  /**
   * What Aditya believes about systems, as distinct from `steps`, which is
   * how he attacks a problem. Each principle cites the work it comes from —
   * a principle naming three projects is categorically more credible than
   * one stated as belief.
   */
  principles: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
        evidence: z.array(LinkSchema).default([]),
      }),
    )
    .default([]),
```

- [ ] **Step 4: Write the principles**

In `data/thinking.ts`, replace `principles: [],` with:

```ts
  principles: [
    {
      title: "Measure the thing that decides, not the thing that's easy to measure",
      body: "Demographics are easy to collect and don't predict who books an offsite; site polish is easy to score and doesn't predict who'll buy. The variable worth measuring is usually the one that takes work to define, which is why I define it before collecting anything.",
      evidence: [
        { label: "goSTOPS — 12 behavioural variables, defined first", url: "/work/gostops-gtm" },
        { label: "LeadIQ — scoring opportunity, not polish", url: "/work/leadiq" },
        { label: "Kensara AI — selling the trigger, not the category", url: "/work/kensara-ai-gtm" },
      ],
    },
    {
      title: "Structure before leverage — you cannot multiply what isn't there",
      body: "AI, automation and analytics are all multipliers, and a multiplier applied to an unstructured process returns the process. So the system of record comes first, every time, even when it's the least interesting part of the work.",
      evidence: [
        { label: "Turbotork — digitise the record, then run AI on it", url: "/work/turbotork" },
        { label: "Adda — store, payments and brand before selling", url: "/work/adda-d2c" },
        { label: "This site — a parsed data layer before the 3D layer", url: "/build" },
      ],
    },
    {
      title: "Pay for a check once, not forever",
      body: "Vigilance is a recurring cost and it degrades; an encoded check costs the same whether it runs ten times or ten thousand. Most of what looks like discipline in my work is really just refusing to rely on remembering.",
      evidence: [
        { label: "Turbotork — integrity audits and architecture rules", url: "/work/turbotork" },
        { label: "This site — a build that fails on unverified content", url: "/build" },
      ],
    },
    {
      title: "The risk is rarely where the interesting work is",
      body: "The scoring engine is the fun part; the plumbing is what breaks. I've learned to go looking for the boring failure specifically, because nothing about it announces itself — and the one time I didn't, it cost me.",
      evidence: [
        { label: "LeadIQ — the risk was SSRF and open redirect, not the logic", url: "/work/leadiq" },
        { label: "Turbotork — rules governed architecture, nothing governed correctness", url: "/work/turbotork" },
      ],
    },
  ],
```

- [ ] **Step 5: Rewrite `workedExample` to state the mechanism**

Still in `data/thinking.ts`, replace `workedExample` with:

```ts
  workedExample:
    "At Turbotork the product developed hand-in-hand with operations, slightly ahead of them, as the fleet-service business scaled to 40+ clients and 400+ vehicles. The part I'd point at isn't the platform — it's what I did after noticing where a two-person engineering team's time actually went. Not typing: planning, rebuilding context, and review. So I split the work into four explicit roles with handoffs between them — plan, implement, review, release — and encoded the architectural rules they had to obey rather than reviewing every change against them. The leverage came from attacking coordination cost, not keystroke cost.",
```

- [ ] **Step 6: Render the principles**

In `app/thinking/page.tsx`, add a section after the existing worked-example block (match the file's existing `section` / `container-lab` / `RevealText` pattern):

```tsx
      {thinking.principles.length > 0 && (
        <section className="section">
          <div className="container-lab">
            <RevealText>
              <p className="label mb-4">PRINCIPLES</p>
              <h2 className="text-[length:var(--text-2xl)]">What I believe about systems.</h2>
            </RevealText>
            <ul className="mt-12 grid gap-10 md:grid-cols-2">
              {thinking.principles.map((principle) => (
                <li key={principle.title} className="border-t border-border pt-6">
                  <h3 className="text-[length:var(--text-lg)]">{principle.title}</h3>
                  <p className="prose-lab mt-3 text-text-muted">{principle.body}</p>
                  {principle.evidence.length > 0 && (
                    <ul className="mt-4 flex flex-col gap-2">
                      {principle.evidence.map((e) => (
                        <li key={e.url}>
                          <Link href={e.url} className="label text-accent hover:underline">
                            {e.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
```

Add `import Link from "next/link";` if the file does not already import it.

- [ ] **Step 7: Run the tests**

```bash
npx playwright test e2e/thinking.spec.ts --project=desktop
```

Expected: 2 passed.

- [ ] **Step 8: Commit**

```bash
git add data/schema.ts data/thinking.ts app/thinking/page.tsx e2e/thinking.spec.ts
git commit -m "feat(thinking): fill principles[] with four evidenced root principles

principles[] was declared and empty since it was written. These four are
domain-independent -- an earlier AI-specific set was rejected as too niche
-- and each cites two or more projects, so the agent workflow reads as an
output of the thinking rather than a credential.

workedExample now states the mechanism behind the productivity claim
instead of just the number.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 11: Give the framework loop one traveling pulse and nodes that carry content

**Files:**
- Modify: `data/schema.ts` — `moment` on `ThinkingStepSchema`
- Modify: `data/thinking.ts` — a moment per step
- Modify: `components/thinking/ThinkingFramework.tsx`

**Interfaces:**
- Consumes: `/work/turbotork` from Task 4.
- Produces: `ThinkingStep.moment?: { body: string; link?: { label, url } }`.

- [ ] **Step 1: Write the failing test**

Append to `e2e/thinking.spec.ts`:

```ts
test("every framework step carries a real moment @thinking", () => {
  for (const step of thinking.steps) {
    expect(step.moment, `step ${step.label} has no moment`).toBeDefined();
    expect(step.moment!.body.length).toBeGreaterThan(20);
  }
});

test("the framework diagram is reachable on mobile @thinking", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/thinking");
  await expect(page.getByRole("button", { name: /OBSERVE/i }).first()).toBeVisible();
});

test("the traveling pulse stops under reduced motion @thinking", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/thinking");
  // The pulse element stays in the DOM and is hidden by CSS, so assert on
  // visibility -- NOT toHaveCount(0), which would always fail.
  await expect(page.locator("[data-framework-pulse]")).toBeHidden();
  // The loop and all its text stay: reduced motion loses no information.
  await expect(page.getByRole("button", { name: /ITERATE/i }).first()).toBeVisible();
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test e2e/thinking.spec.ts --project=desktop
```

Expected: FAIL — `moment` is undefined on every step.

- [ ] **Step 3: Add `moment` to the schema and export the step type**

`data/schema.ts` exports `Thinking` but **not** `ThinkingStep`, which Task 11's component imports. Add it alongside the other type exports near line 304:

```ts
export type ThinkingStep = z.infer<typeof ThinkingStepSchema>;
```

Then replace `ThinkingStepSchema` with:

```ts
export const ThinkingStepSchema = z.object({
  label: z.string(),
  body: Fillable,
  /**
   * Where this step actually happened, in real work. The diagram is a trace
   * of a project through the loop, not an illustration of one — a step with
   * no moment is a step Aditya has not yet evidenced.
   */
  moment: z
    .object({ body: Fillable, link: LinkSchema.optional() })
    .optional(),
});
```

- [ ] **Step 4: Add a moment to each of the eight steps**

In `data/thinking.ts`, add a `moment` to each step. Use exactly these:

```ts
// OBSERVE
      moment: {
        body: "Watched where a two-person engineering team's time actually went before proposing anything. It wasn't typing — it was planning, rebuilding context and review.",
        link: { label: "Turbotork", url: "/work/turbotork" },
      },
// QUESTION
      moment: {
        body: "Asked why a garage still ran on paper before assuming it shouldn't. The answer — nothing downstream depended on the record being digital yet — was the actual constraint to attack.",
        link: { label: "Turbotork", url: "/work/turbotork" },
      },
// UNDERSTAND
      moment: {
        body: "Defined twelve behavioural variables, each tied to a hypothesis about what drives an offsite booking, before writing a single survey question.",
        link: { label: "goSTOPS", url: "/work/gostops-gtm" },
      },
// FRAME
      moment: {
        body: "Reframed a compliance product's go-to-market as a bet on a regulatory deadline rather than a software category — a claim that could be tested against real practitioners inside a month.",
        link: { label: "Kensara AI", url: "/work/kensara-ai-gtm" },
      },
// BUILD
      moment: {
        body: "Shipped digital job cards first, not the AI features. The inspection, diagnostic and analytics layers only worked later because this one made the data clean.",
        link: { label: "Turbotork", url: "/work/turbotork" },
      },
// TEST
      moment: {
        body: "Put the GTM strategy in front of practitioner communities as a live voice-of-customer channel, rather than trusting the deck's own logic about what buyers cared about.",
        link: { label: "Kensara AI", url: "/work/kensara-ai-gtm" },
      },
// LEARN
      moment: {
        body: "The lead scorer worked; the plumbing didn't. An open redirect and an SSRF hole said nothing about the scoring idea and everything about where I hadn't looked.",
        link: { label: "LeadIQ", url: "/work/leadiq" },
      },
// ITERATE
      moment: {
        body: "Chose a payment gateway on cash-on-delivery reconciliation rather than checkout speed, after the unit-economics model showed a 10% return-to-origin rate was the variable that actually moved.",
        link: { label: "Adda", url: "/work/adda-d2c" },
      },
```

- [ ] **Step 5: Make the diagram interactive and give it a mobile form**

Rewrite `components/thinking/ThinkingFramework.tsx`.

**This is an edit, not a from-scratch rewrite.** Everything marked "unchanged" in the sketch below already exists in the file and must be carried across verbatim — losing any of it breaks the diagram:

- the `NODE_W`, `NODE_H`, `COLS`, `COL_SPACING`, `ROW_SPACING` constants
- the `Position` type, `layout()` and `edgePoints()`
- the `minX` / `maxX` / `minY` / `maxY` / `first` / `last` / `loopPath` calculations
- the `<defs>` block with both `<marker>` elements (`tf-arrow`, `tf-arrow-accent`)
- the `positions.slice(1).map(...)` connector `<line>` elements
- the `{loopPath && <path .../>}` feedback arrow
- both `<text>` elements inside each node `<g>` (the zero-padded index and the label)

The changes are: add `"use client"` and the two imports, add `useState`, widen the prop type, add `pulsePath`, add the pulse `<circle>`, make each node `<g>` interactive, add the mobile `<ul>`, and replace the `<figcaption>`. Change the component to:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { ThinkingStep } from "@/data/schema";

// ... NODE_W / layout() / edgePoints() unchanged above ...

/**
 * The framework as a loop (PLAN.md Phase 4) — the last step feeds back into
 * the first. Two changes on 2026-09-19:
 *
 * 1. Nodes carry content. They used to be labels, with the worked example a
 *    paragraph below; selecting one now shows that step's body and a real
 *    moment from real work, which makes the diagram a trace of a project
 *    through the loop rather than an illustration of one.
 * 2. One traveling pulse, not many. Aditya's brief was a brain with many
 *    pulsing green neurons. The colour is right — DESIGN_SYSTEM.md §2
 *    already defines green as "activates, connects, is online" — but the
 *    same section caps signal colour at ~5% and says a green-tinted section
 *    is a bug. One moving signal says "this cycle runs continuously", which
 *    is the one thing a static diagram cannot; sixty twinkling nodes say
 *    nothing and tint the section.
 *
 * Because nodes now carry unique information, the diagram is no longer
 * desktop-only: below `md` the same steps render as a tappable stack.
 */
export function ThinkingFramework({ steps }: { steps: ThinkingStep[] }) {
  const [active, setActive] = useState(0);
  if (steps.length < 2) return null;

  const positions = layout(steps.length);
  // ... minX / maxX / minY / maxY / first / last / loopPath unchanged ...

  const activeStep = steps[active];

  return (
    <figure>
      {/* Diagram: md and up */}
      <svg
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        role="img"
        aria-label={`The framework as a loop: ${steps.map((s) => s.label).join(" → ")} → back to ${steps[0]?.label ?? ""}.`}
        className="hidden w-full md:block"
      >
        {/* defs, connector lines and loopPath unchanged */}

        {/* One signal, travelling the whole loop. Suppressed under
            prefers-reduced-motion by the CSS in globals.css. */}
        <circle data-framework-pulse r={4} fill="var(--color-accent)" className="framework-pulse">
          <animateMotion dur="12s" repeatCount="indefinite" path={pulsePath} />
        </circle>

        {positions.map((pos, i) => {
          const step = steps[i];
          if (!step) return null;
          const isActive = i === active;
          return (
            <g
              key={step.label}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActive(i);
                } else if (e.key === "ArrowRight") {
                  setActive((i + 1) % steps.length);
                } else if (e.key === "ArrowLeft") {
                  setActive((i - 1 + steps.length) % steps.length);
                }
              }}
              className="cursor-pointer focus-visible:outline-none"
            >
              <rect
                x={pos.x - NODE_W / 2}
                y={pos.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={4}
                fill="var(--color-surface)"
                stroke={isActive ? "var(--color-accent)" : "var(--color-border)"}
              />
              {/* the two <text> elements are unchanged */}
            </g>
          );
        })}
      </svg>

      {/* Stack: below md */}
      <ul className="flex flex-col gap-2 md:hidden">
        {steps.map((step, i) => (
          <li key={step.label}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className="w-full border border-border bg-surface px-4 py-3 text-left font-mono uppercase tracking-[0.08em] aria-pressed:border-accent"
            >
              <span className="label mr-3 text-text-faint">{String(i + 1).padStart(2, "0")}</span>
              {step.label}
            </button>
          </li>
        ))}
      </ul>

      {activeStep && (
        <figcaption className="mt-6 border-t border-border pt-6">
          <p className="label">{activeStep.label}</p>
          <p className="prose-lab mt-3">{activeStep.body}</p>
          {activeStep.moment && (
            <div className="mt-4 border-l-2 border-accent pl-4">
              <p className="prose-lab text-text-muted">{activeStep.moment.body}</p>
              {activeStep.moment.link && (
                <Link href={activeStep.moment.link.url} className="label mt-2 inline-block text-accent hover:underline">
                  {activeStep.moment.link.label} →
                </Link>
              )}
            </div>
          )}
        </figcaption>
      )}
    </figure>
  );
}
```

Define `pulsePath` above the return, as the concatenation of every connector segment plus `loopPath`, so one `<animateMotion>` traverses the whole cycle:

```tsx
  const pulsePath =
    positions
      .slice(1)
      .map((pos, i) => {
        const from = positions[i];
        if (!from) return "";
        const { x1, y1, x2, y2 } = edgePoints(from, pos);
        return `M ${x1},${y1} L ${x2},${y2}`;
      })
      .join(" ") + ` ${loopPath}`;
```

- [ ] **Step 6: Suppress the pulse under reduced motion**

In `app/globals.css`, inside the existing `@media (prefers-reduced-motion: reduce)` block, add:

```css
  .framework-pulse {
    display: none;
  }
```

If no such block exists, create one at the end of the file.

- [ ] **Step 7: Update the call site**

`app/thinking/page.tsx` passes `steps={thinking.steps}`. The prop type widened from `Array<{ label: string }>` to `ThinkingStep[]`, which `thinking.steps` already satisfies. Confirm with:

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 8: Run the tests**

```bash
npx playwright test e2e/thinking.spec.ts --project=desktop
```

Expected: 5 passed.

- [ ] **Step 9: Commit**

```bash
git add data/schema.ts data/thinking.ts components/thinking/ThinkingFramework.tsx app/globals.css e2e/thinking.spec.ts
git commit -m "feat(thinking): nodes carry real moments, one signal travels the loop

The diagram was static, label-only and desktop-only. Nodes now carry each
step's body plus where it actually happened, which makes it a trace of real
work rather than an illustration -- and that unique content is why it now
renders below md too.

One traveling pulse instead of the proposed field of pulsing neurons:
green already means activation in DESIGN_SYSTEM.md, but the same section
caps signal colour at ~5% and calls a green-tinted section a bug. One
moving signal carries the information a static diagram can't.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 12: Trim the experience entry, revise skills, retarget the question chips

**Files:**
- Modify: `data/experience.ts`, `data/skills.ts`, `data/about.ts`
- Modify: `lib/ai/suggested-questions.ts`
- Regenerate: `lib/ai/canned-answers.generated.ts`

- [ ] **Step 1: Write the failing test**

Append to `e2e/link-suggestions.spec.ts`:

```ts
import { SUGGESTED_QUESTIONS } from "@/lib/ai/suggested-questions";

test("the question chips don't point at placeholder content @links", () => {
  // goSTOPS is status IN PROGRESS with largely placeholder narrative fields.
  expect(SUGGESTED_QUESTIONS.some((q) => q.includes("goSTOPS"))).toBe(false);
  expect(SUGGESTED_QUESTIONS.some((q) => q.includes("Turbotork"))).toBe(true);
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test e2e/link-suggestions.spec.ts --project=desktop
```

Expected: FAIL — the goSTOPS chip is still present.

- [ ] **Step 3: Swap the chip**

In `lib/ai/suggested-questions.ts`, replace `"Tell me about the goSTOPS project."` with `"Tell me about Turbotork."` and add a one-line comment above the array:

```ts
/**
 * AI_SPEC.md §6 — the six chips shown when the input is empty.
 *
 * These are entry points, so they must point at the site's strongest
 * content. The goSTOPS chip was replaced on 2026-09-19: that project is
 * status IN PROGRESS with largely placeholder narrative, so one chip in six
 * opened onto the thinnest thing on the site.
 */
```

- [ ] **Step 4: Trim the Turbotork experience entry**

In `data/experience.ts`, replace the `turbotork` entry's six `bullets` with two, keeping `highlights`, `tools`, `company`, `role`, `location`, `start` and `end` untouched:

```ts
    // Trimmed 2026-09-19: the full narrative moved to /work/turbotork. Two
    // bullets and the highlights are what the /about timeline needs; the
    // corpus should not carry the same story twice.
    bullets: [
      "Founding AI Product Manager out of the founder's office — owned the product end to end and led a two-person engineering team.",
      "Scaled the platform to 40+ clients and ₹30L+ revenue in 5 months, and helped close a $250K pre-seed via Antler. Full case study at /work/turbotork.",
    ],
```

- [ ] **Step 5: Revise the two understated skill groups**

In `data/skills.ts`, in the `INTELLIGENCE` group, change `{ name: "AI agents", depth: "working knowledge" }` to `{ name: "AI agents", depth: "comfortable" }` and replace the description with:

```ts
      "Designing agent workflows that earn their place — where the constraint is coordination rather than typing, and encoded rules beat reviewing output.",
```

In the `BUILD` group, replace the description with:

```ts
      "Shipping working products with a small team — a multi-product fleet-service platform and a D2C storefront, built rather than just specified.",
```

- [ ] **Step 6: Point the bio at the case study**

In `data/about.ts`, in `longBio`, find this exact substring:

```
while layering in AI agent workflows that lifted team productivity by roughly 70%.
```

and replace it with:

```
while layering in AI agent workflows that lifted team productivity by roughly 70% — the full case study is at /work/turbotork.
```

That is the only edit to this file. Every fact in the paragraph stays as written; `lib/ai/link-suggestions.ts` `stripUnknownInternalPaths` will leave `/work/turbotork` intact because it is now a real route.

- [ ] **Step 7: Regenerate the canned answers**

The six cached answers were generated against the old chip set and the old corpus.

```bash
npm run ai:generate-canned-answers
```

Expected: `lib/ai/canned-answers.generated.ts` rewritten with six entries, including one for "Tell me about Turbotork." If the script requires `AI_PROVIDER_API_KEY` and it is unset, stop and report — this step needs Aditya's key and must not be faked.

- [ ] **Step 8: Run the tests**

```bash
npx playwright test e2e/link-suggestions.spec.ts e2e/knowledge-retrieval.spec.ts e2e/ask-the-lab.spec.ts --project=desktop
```

Expected: all passed.

- [ ] **Step 9: Full verification and screenshots — final phase boundary**

```bash
npm run verify
npm run shot
```

`verify` is expected to fail only at the `placeholders` step, on the Task 4 `[AI_DRAFT_REVIEW]` drafts, until Aditya rewrites them.

**Then read the screenshots with the Read tool** — `.screenshots/` at 375, 768, 1280 and 1920. Do not describe a UI you have not looked at (CLAUDE.md §5). Check specifically: the new `/work/turbotork` page at 375px, `/thinking` with the principles grid and the framework stack at 375px, and `/systems` with two diagrams.

- [ ] **Step 10: Commit**

```bash
git add data/experience.ts data/skills.ts data/about.ts lib/ai/suggested-questions.ts lib/ai/canned-answers.generated.ts e2e/link-suggestions.spec.ts
git commit -m "feat(content): trim the experience entry, retarget the question chips

The Turbotork experience entry drops to a pointer now that the case study
carries the narrative -- the corpus should not hold the same story twice.
The goSTOPS question chip is replaced: that project is IN PROGRESS with
placeholder narrative, so one entry point in six opened onto the thinnest
content on the site.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Acceptance test for the original report

After Task 12, with `AI_PROVIDER_API_KEY` set and `npm run dev` running, ask Ask the Lab each of:

- "What AI work has he done?"
- "Has he led a team?"
- "Tell me about his founding experience."
- "Has he raised funding?"

Each must return a Turbotork-led answer **and** a link chip reading "Turbotork case study" pointing at `/work/turbotork`. That is the acceptance criterion for Aditya's original observation — content and links now rank on the same signal.

## Still blocked on Aditya (spec §8)

1. Rewrite the three `[AI_DRAFT_REVIEW]` learnings and the reflection in `data/projects.ts`. Until then `npm run verify` fails at `placeholders`, by design, and production cannot build.
2. Confirm the basis for the "~70%" productivity figure, or the claim stays out of `workedExample` (Task 10 already states the mechanism rather than the number).
3. Confirm that describing Turbotork's product surfaces publicly is acceptable given his exit terms.
4. **Rotate the two Firebase admin service-account keys committed in the studio repo** (spec §9). Independent of this plan.
