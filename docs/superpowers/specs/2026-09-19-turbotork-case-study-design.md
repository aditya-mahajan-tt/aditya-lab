# Turbotork case study, corpus retrieval and link ranking — design spec

Date: 2026-09-19
Status: design approved by Aditya (structure, depth, link-ranking approach,
sequencing). LEARNINGS and REFLECTION prose is BLOCKED ON ADITYA — see §8.

Source of truth for all new content: the `aditya-mahajan-tt/studio` repo
(TT Garage Portal), supplied by Aditya on 2026-09-19 and read in full at
`--depth=1`. Nothing in this spec is inferred from the resume alone; every
product claim below is verifiable against a file in that repo.

---

## 1. The defect this spec fixes

Aditya's observation was narrow — "Turbotork comes up first in Ask-the-Lab
content but the link chip still points at Kensara" — but the cause is
structural, and it runs deeper than the ranker.

Turbotork is the only thing Aditya has done that is simultaneously AI,
product and business. It is represented on this site by **six resume
bullets in an experience list**. Kensara, goSTOPS, Adda and LeadIQ — all
smaller in scope — each get a full case-study page.

That inversion is literally what produces the link bug.
`lib/ai/link-suggestions.ts` `suggestLink()` iterates exactly two
collections:

```ts
for (const p of getAllProjects())    { … return `/work/${p.slug}` }
for (const e of getAllExperiments()) { … return `/experiments/${e.slug}` }
return null;
```

Turbotork is neither a project nor an experiment, so it **cannot win a link
chip under any question**. Kensara is a project, so it always does. The
`leadTopics` mechanism added on 2026-09-18 fixed *content* ranking
(`lib/ai/knowledge.ts`) and was never taught to link ranking.

So: patching the ranker alone would paper over the inversion. The fix is to
put Turbotork where its evidence says it belongs, and let the ranker follow.

## 2. What the studio repo actually yields

Verified counts and facts, not impressions:

- **494 TS/TSX files, 121,442 lines, 204 internal markdown docs, ~36
  top-level app routes.**
- **Five roles**, not the three in the v1.0 PRD: `InternalSupervisor`,
  `InternalTechnician`, `InternalManager`, `FleetManager`, `FleetDriver`.
- **It is not "a job-card app."** Distinct product surfaces:
  - **TT Xpress** — vehicle inspection with *versioned* templates in
    Firestore carrying per-measurement thresholds, section weights, scoring
    rules and recommendation mappings; autosave; photo capture
    (`docs/tt-xpress-service.md`).
  - **OBD diagnostics** — a DTC code library keyed by code, health-score
    calculation, readiness monitors, and a **public, unauthenticated,
    shareable** customer report at `/health-report/[uuid]` that renders with
    zero dashboard chrome (`OBD_DIAGNOSTICS_ARCHITECTURE.md`,
    `PUBLIC_HEALTH_REPORT_COMPLETE.md`).
  - **Analytics** — revenue by period and category, TAT, technician
    workload, vehicle/company/fleet-owner aggregation, hourly and daily
    trends (`ANALYTICS_IMPLEMENTATION_SUMMARY.md`).
  - **Billing** — tax invoice, proforma, PMC invoicing, FY-scoped invoice
    counters, web invoice view.
  - Plus inventory/consumables/rate cards, attendance, lead generation,
    customer and fleet portals, PWA offline support.
- **Integrations** (from `package.json` and scripts): Firebase
  Firestore/Storage/Functions, Genkit + Google AI, Twilio, SendGrid,
  googleapis, Surepass RC lookup, Vaahan API, jsPDF client-side and
  `@react-pdf/renderer` server-side.
- **Data-operations maturity** — 12+ named npm scripts for migrations,
  integrity audits (`audit:companyid-integrity`,
  `audit:vehicle-company-jobcards`), exports and production→staging sync.
- **The AI agent system.** `.github/` holds a purpose-built agentic
  development workflow: **4 agents** (planner → implementer → reviewer →
  release) with declared tool postures and explicit typed handoffs,
  **14 domain skills** (qa-regression, firestore-data-integrity,
  prd-writing, incident-debugging, deployment-readiness, …), **6 prompts**,
  **5 path-scoped instruction files**, and an enforced `AI_AGENT_RULES.md`.
  `copilot-instructions.md` additionally *requires every change to be
  explained in PM language* — before/after, why, benefits, risks, remaining
  gaps.

That last item is the evidence behind the "~70% productivity lift from AI
agent workflows" bullet, which currently sits on the site as a bare number
with no stated mechanism.

**Honest gaps.** There is no meaningful automated test suite — Jest and
Testing Library are installed, but the stated gate is manual QA plus
`typecheck` and `lint`. The clone is a single squashed commit, so no
commit-history claims (velocity, duration, commit counts) can be made.

## 3. The binding constraint: the corpus is full

Measured on this branch, before any change:

```
CORPUS TOKENS: 5072 / BUDGET 5975 | warn at 5078
HEADROOM: 903 tokens to budget; 6 to warn
```

The Ask-the-Lab corpus is **6 tokens below its own warning threshold**.

`buildProjectsSection()` (`lib/ai/knowledge.ts`) puts *every* narrative
field of *every* project into the corpus — context, problem, role,
thinking, approach, execution, outcome. Kensara alone contributes roughly
700 tokens. A builder-depth Turbotork case study written at the same
density costs an estimated **700–1,100 tokens against 903 of headroom**, and
crosses the warn line immediately. Trimming the Turbotork experience entry
to a pointer recovers perhaps 120 tokens — not enough.

The budget is not arbitrary. Per the reasoning already recorded at
`lib/ai/knowledge.ts`, the binding limit is Groq's **tokens-per-minute**
ceiling (8,000 on the free tier), not the model's 131,072-token context
window. A prompt that exceeds TPM fails *every* time with no graceful
degradation, and surfaces to the visitor as "AI CORE TEMPORARILY OFFLINE" —
pointing at the API rather than at the content change that caused it.
Model failover does not relax this: failover spreads separate questions
across models with separate budgets, but a single question is still served
by a single model.

The code already names the remedy, at the warn branch in `getKnowledge()`:

> "score the corpus sections by keyword overlap with the question and send
> the best three. Not a vector database — the corpus is far too small for
> embeddings to earn their infrastructure."

That is AI_SPEC.md §2's own specced fallback, deferred until it was needed.
It is needed now. It ships as Phase 0.

## 4. Phase 0 — corpus retrieval

**Goal:** replace "send the whole corpus on every request" with "score
sections against the question, send the best N." No content changes in this
phase; it is independently verifiable.

### 4.1 Shape

`buildKnowledgeText(): string` becomes `buildKnowledgeSections(): Section[]`:

```ts
type Section = {
  id: string;          // "project-turbotork", "experience-accordion"
  text: string;        // the existing `section()` output, unchanged
  topics: string[];    // leadTopics + title + category + tools
  pinned?: boolean;    // always included, never scored
};
```

The critical refactor is granularity. `buildProjectsSection()` and
`buildExperienceSection()` today return **all** projects / **all**
experience joined into one string. Retrieval over two giant blobs buys
nothing. They must emit one `Section` per entry.

### 4.2 Scoring

- `pinned: true` — the `Site`, `About` and `Contact` sections. Always sent.
  Identity and the contact route are never optional; CLAUDE.md §2's
  thirty-second recruiter path depends on them.
- Everything else scored by keyword overlap between the question and the
  section's `topics` + `text`, with a **`leadTopics` boost** — the same
  signal Phase 2 gives the link ranker, so content and links can no longer
  disagree. This is the direct fix for the asymmetry in §1.
- Send pinned sections plus the top-scoring remainder, filling up to a
  `SECTION_BUDGET` derived from `CORPUS_TOKEN_BUDGET`, rather than a fixed
  count of three — a fixed count either wastes headroom or overflows it
  depending on section size.
- Zero-overlap question (e.g. "what is your favourite colour") → pinned
  sections only. The existing grounding check in `guardrails.ts` then
  refuses, which is the correct outcome and already tested.

### 4.3 Risk and mitigation

The real risk is **retrieval misses**: a question whose best section scores
below a section that merely shares common words, producing a grounded-but-
wrong-subject answer. Mitigations:

- Keep `pinned` generous. About + Site cover most identity questions
  without retrieval needing to be right.
- Log the selected section ids via the existing `logQuestion` path so
  misses are diagnosable rather than invisible.
- Cache key must become `question` **+ selected section ids**. Caching on
  the question alone was safe when the corpus was constant; it is not once
  the corpus varies per request.

### 4.4 Exit criteria

- `getKnowledge()`-equivalent path reports per-request token counts under
  `CORPUS_TOKEN_BUDGET` for all six `SUGGESTED_QUESTIONS` plus a
  hand-written adversarial set.
- No regression in `guardrails.ts` grounding behaviour.
- `npm run verify` green.

## 5. Phase 1 — Turbotork as a case study

New entry in `data/projects.ts`, `slug: "turbotork"`. The 2026-09-05
decision to keep Turbotork out of `projects.ts` is **deliberately reversed**
here; that comment block is replaced with a note recording why.

Depth setting: **builder depth** (Aditya's call, 2026-09-19). Name the
product surfaces, the architecture patterns and the agent system.

Mapped onto the existing nine rendered sections
(`app/work/[slug]/page.tsx`) — no heading changes, because the material
fits them:

| Section | Substance |
|---|---|
| CONTEXT | Early-stage fleet-service SaaS, founder's office; garage operations running on paper |
| PROBLEM | No system of record; two engineers; demand scaling against manual throughput |
| ROLE | Founding AI Product Manager — owned product end to end, led two engineers |
| THINKING | Two bets: digitise the system of record *before* layering AI on it; and treat the engineering team's own throughput as a product problem in its own right |
| APPROACH | The platform (strict service layer over Firestore, all mutations through server actions, five roles) **and** the workflow that built it (four agents with typed handoffs, 14 domain skills, PM-language change explanations enforced) |
| EXECUTION | TT Xpress versioned inspection templates · OBD code library and health scoring · public `/health-report/[uuid]` · analytics · billing and FY invoice counters · Twilio / SendGrid / Surepass / Vaahan / Razorpay / GSTN |
| OUTCOME | 40+ clients, 400+ vehicles, ₹30L+ revenue in 5 months, 1,000+ jobs, $250K pre-seed via Antler |
| LEARNINGS | **Blocked on Aditya** — §8 |
| REFLECTION | **Blocked on Aditya** — §8 |

`status: "CASE STUDY"`, `planes: ["ai", "product", "business"]` — the only
entry on the site carrying all three.

### 5.1 Ordering

`order: 1`, taking the /work lead slot. Adda moves to 2. The 2026-09-10
note promoting Adda to lead reasoned that it was "the most complete project
narrative on the site"; once Phase 1 lands, that is no longer true, and the
reason for the promotion expires with it. Link ranking does **not** depend
on this ordering (§6) — the two concerns stay decoupled.

### 5.2 Confidentiality line

Turbotork is a real private company and Aditya no longer works there.

**In scope:** product surfaces and their purpose, architecture patterns,
integration names, role model, the agent workflow, and the outcome metrics
already public on his resume.

**Out of scope:** client names; real invoice, revenue or payment records;
Firestore document shapes reproduced at a level that reads as a data map;
anything from the committed customer CSV/XLSX files.

**The repo is never linked from the site.** See §9.

## 6. Phase 2 — link ranking

Approach C (Aditya's call, 2026-09-19).

1. Move `leadTopics` off `ExperienceEntrySchema` (`data/schema.ts`) onto the
   shared shape so projects and experiments carry it too. Turbotork's
   existing `leadTopics` array moves with the content to the project entry.
2. `suggestLink(answer, question)` — `question` is already in scope at
   `app/api/ask/route.ts` and simply never passed. Ranking:
   - a candidate whose `leadTopics` match the question wins;
   - otherwise, earliest mention of the candidate's title in the answer wins;
   - `null` if nothing matches, unchanged.
3. **Delete** the hardcoded hero special case in `data/queries.ts` — the
   block whose comment reads *"exactly one experience entry is ever selected
   into the hero"*, with its hardcoded `label: "Turbotork"` and its
   `/about#experience-turbotork` href. Turbotork becomes an ordinary project
   body in `outerProjects`, pointing at `/work/turbotork`. This phase is
   net-negative in lines.

Guard against double-counting: Turbotork will exist as **both** a project
and an experience entry (the /about timeline still needs the latter). The
experience entry is trimmed to a pointer (§7) so the corpus does not carry
the same story twice, and `suggestLink` must prefer the `/work/turbotork`
case study over `/about#experience-turbotork`.

## 7. Phase 3 — content edits the repo unlocks

- **`data/systems.ts`** — retarget `AUTOMATION ENGINE`'s `relatedLink` from
  `/about#experience-turbotork` to `/work/turbotork`. Add a second diagram,
  `AGENT PIPELINE`: planner → implementer → reviewer → release. `systems.ts`
  already renders node-based pipelines, so this is a data addition, not a
  component change — and it is a better home for the agent system than a
  paragraph buried inside APPROACH.
- **`data/thinking.ts`** — `workedExample` asserts "~70%" with no mechanism.
  Rewrite to describe the agent system that produced it. Same claim,
  now falsifiable.
- **`data/experience.ts`** — trim the six bullets to a short pointer at the
  case study; keep `highlights` (the /about timeline renders them) and
  remove `leadTopics`, which moves to the project.
- **`data/skills.ts`** — `INTELLIGENCE` lists `AI agents: "working
  knowledge"`. A designed four-agent system with typed handoffs and 14
  domain skills is past working knowledge. Revise that depth and the
  `INTELLIGENCE` description; revise `BUILD`'s description, which
  undersells "a fleet-service SaaS MVP" relative to what the repo shows.
- **`lib/ai/suggested-questions.ts`** — swap *"Tell me about the goSTOPS
  project."* for a Turbotork question. goSTOPS is `status: "IN PROGRESS"`
  with its narrative fields flagged as largely placeholder; one of six
  entry points into Ask the Lab currently points at the thinnest content on
  the site. Regenerate `lib/ai/canned-answers.generated.ts` afterwards.
- **`data/about.ts`** — tighten the Turbotork clause in the long bio and
  point it at the case study.
- **`data/schema.ts`** — `strategy` is declared on `ProjectSchema` and
  rendered nowhere (`app/work/[slug]/page.tsx` omits it from the sections
  array). Delete it, or wire it in as a section. Deleting is preferred;
  nothing populates it.

## 8. Blocked on Aditya

Per CLAUDE.md §8, these are hard stops and will ship as `[X_REQUIRED]`
tokens until supplied:

1. **`[TURBOTORK_LEARNINGS_REQUIRED]`** — what the Turbotork work taught
   him. Must be his own words; the repo cannot supply this.
2. **`[TURBOTORK_REFLECTION_REQUIRED]`** — what he would do differently.
3. **Confirmation of the "~70%" figure's basis** — how it was measured, so
   §7's rewrite states a mechanism rather than restating a number.
4. **Permission check** — confirmation that describing Turbotork's product
   surfaces and architecture publicly is acceptable given his exit terms.

Items 1 and 2 keep `npm run check:placeholders` failing the production
build until answered, which is the intended behaviour.

## 9. Security finding (outside this spec's scope, needs action)

The studio repo has **two Firebase admin SDK service-account JSON key files
committed at its root**:

```
tt-garage-portal-firebase-adminsdk-fbsvc-a17d6492d6.json
tt-xpress-staging-firebase-adminsdk-fbsvc-1da6427b89.json
```

Admin SDK credentials bypass Firestore security rules entirely. Alongside
them sit customer CSV/XLSX exports, real invoice PDFs and a signature image.

These keys should be **rotated in the Google Cloud console**, regardless of
what happens here — a private repo is not a secret store, and the history
retains them even after deletion. This is Turbotork's exposure, not
Aditya's site's, but it is the reason the portfolio must **never link to
this repo**, which is recorded as a constraint in §5.2.

## 10. Verification

Per CLAUDE.md §5, and batched rather than run per-change (per Aditya's
stated preference):

- `npm run verify` — typecheck, lint, build, Playwright smoke, console-error
  check — green at the end of each phase.
- `npm run shot` at the end of Phase 1 and Phase 3; screenshots **read**,
  not assumed, at 375 / 768 / 1280 / 1920.
- Per-request corpus token measurement across all six suggested questions
  plus an adversarial set (Phase 0 exit criterion, §4.4).
- Manual Ask-the-Lab check: the questions in Turbotork's `leadTopics` — AI,
  leadership, founding, fundraising, ownership — must return a Turbotork
  answer **and** a `/work/turbotork` chip. This is the acceptance test for
  Aditya's original report.
- `npm run check:placeholders` expected to FAIL on production until §8
  items 1–2 land. That is the intended gate, not a defect.

## 11. Out of scope

- Rewriting goSTOPS (`IN PROGRESS`, largely placeholder). Noted, not fixed
  here; swapping its suggested-question chip reduces its blast radius in
  the meantime.
- Embeddings or a vector store for retrieval. The corpus is ~5K tokens;
  keyword scoring is proportionate and the existing code says so.
- Any change to the 3D layer, the hero's visual design, or navigation.
- Anything in the studio repo itself. Key rotation (§9) is Aditya's to do
  in Google Cloud, not a code change here.
