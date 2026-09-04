# CONTENT_INTAKE.md — What Aditya must supply

> The bottleneck on this project is written content, not code. Everything below is something Claude Code **cannot** invent (see `CLAUDE.md` §4, §8).
>
> Priority key: **P0** = blocks the V1 launch · **P1** = blocks Release 2 · **P2** = nice to have, Release 3.
>
> Tick items as you supply them. Claude Code regenerates `CONTENT_TODO.md` from what's still missing.

---

## A. Identity & links — **P0** (blocks Phase 2, 4, 7)

| # | Item | Notes |
|---|---|---|
| A1 | Full name as it should appear | e.g. "Aditya Mahajan" |
| A2 | One-line title | e.g. "Product Manager · builds at the intersection of AI, product and business" |
| A3 | Contact email for the site | Consider an alias rather than your personal address |
| A4 | LinkedIn URL | |
| A5 | GitHub URL | Say so if you'd rather not link it |
| A6 | X / Twitter, Substack, or any other public profile | Optional |
| A7 | Resume PDF | Final version, named `Aditya-Mahajan-Resume.pdf` |
| A8 | Domain name | Bought or shortlisted — needed at Phase 7 |
| A9 | Location line | e.g. "India · open to remote" — or omit entirely |
| A10 | Photo of you | Optional but recommended for the About page. High-res, one is enough |

---

## B. Positioning & bio — **P0** (blocks Phase 4)

| # | Item | Length |
|---|---|---|
| B1 | Hero headline — confirm or replace `I BUILD THINGS AT THE INTERSECTION OF AI × PRODUCT × BUSINESS.` | ≤ 12 words |
| B2 | Hero subline | ≤ 15 words |
| B3 | Short bio (About page opener) | 60–80 words |
| B4 | Long bio (About page body) | 200–300 words. Where you came from, what you actually do, what you're chasing now |
| B5 | The six-step progression — confirm or replace `CURIOUS → BUILDER → MARKETER → PRODUCT THINKER → AI EXPLORER → STILL EXPERIMENTING` | one word each |
| B6 | One line each explaining those six steps | ≤ 20 words each |
| B7 | "What kind of problems do you enjoy?" | 40–60 words — used on About and by the AI assistant |
| B8 | Anything you explicitly **do not** want on the site | Employers, projects under NDA, topics to avoid |

---

## C. Projects — **P0** for 3 of them (blocks Phase 2, 4)

**Ship V1 with three excellent case studies rather than seven thin ones.** Nominate three; the rest can land later.

For **each** project, supply:

| Field | Length | Notes |
|---|---|---|
| Title + subtitle | short | e.g. "goSTOPS — GTM Strategy" |
| Categories | 1–3 tags | Strategy / Product / AI / Automation / Marketing |
| Year & status | | CASE STUDY / LIVE / SHIPPED / IN PROGRESS / ARCHIVED |
| **Summary** | 1 sentence, ≤ 25 words | Appears on cards and in link previews |
| **Context** | 60–100 words | What the situation was |
| **Problem** | 60–100 words | What was actually broken, and for whom |
| **Your role** | 30–50 words | Be precise. "I did X and Y; the team did Z" |
| **Thinking** | 100–150 words | *The most important section.* How you framed it, what you rejected, why |
| **Approach** | 80–120 words | The method you chose |
| **Execution** | 100–150 words | What you actually did and built |
| **Outcome** | 60–100 words *or omit* | Real numbers only. Caveat honestly ("internal estimate", "self-reported"). If there's no outcome yet, leave it out — an omitted outcome is credible, an invented one is fatal |
| **Learnings** | 3–5 bullets | Including what you'd do differently |
| Tools used | list | |
| Process steps | 4–7 labels | For the animated diagram, e.g. PROBLEM → RESEARCH → SEGMENTATION → STRATEGY → EXECUTION |
| Media | images/video | Screenshots, decks, prototypes, diagrams. **With a caption and alt text for each.** Say if a project has none |
| External links | | Live site, deck, repo, write-up |
| Confidential? | yes/no | If yes, which specifics must be hidden or generalised |

**Candidate projects to consider** (confirm which three lead):
- goSTOPS GTM strategy
- Data integration work at Turbotork (unified dashboards from siloed sources)
- Cricket mobile game — founder / creative director
- The segmentation framework
- The AI lead-generation / creator-economy automation work
- ADITYA LAB itself (this becomes the strongest one once Build Mode ships)

---

## D. Experiments — **P1** (blocks Phase 4 partial, Phase 14)

Three to six, each much shorter than a project:

| Field | Length |
|---|---|
| Title | short |
| Type | AI / AUTOMATION / PRODUCT / GROWTH / TECHNICAL / CREATIVE |
| Status | IDEA / PROTOTYPE / BUILDING / WORKING / LIVE / ARCHIVED / **FAILED** |
| Hypothesis | 1–2 sentences — what you thought would happen |
| Build | 2–3 sentences — what you made |
| Result | 2–3 sentences — what actually happened |
| Learning | 1–2 sentences |
| Interactive? | Can a visitor try it, and how? |

> **Include at least one `FAILED`.** It is the single most credible thing on the site and it is what makes the Lab concept true rather than decorative.

---

## E. Thinking — **P0** (blocks Phase 4)

| # | Item | Length |
|---|---|---|
| E1 | Confirm or replace the framework: `OBSERVE → QUESTION → UNDERSTAND → FRAME → BUILD → TEST → LEARN → ITERATE` | |
| E2 | One paragraph per step, in your voice | 40–60 words each |
| E3 | A worked example: one real decision run through the framework | 150–200 words |
| E4 | 2–3 principles or beliefs you hold about building products | 1–2 sentences each |

---

## F. Skills — **P0** (blocks Phase 4)

Confirm or edit the five capability groups, and mark honest depth for each item (`working knowledge` / `comfortable` / `strong`). Do not inflate — a technical reviewer will test the strongest claim.

| Group | Your items |
|---|---|
| **THINK** | strategy, research, segmentation, problem framing, … |
| **BUILD** | websites, apps, UI/UX, product, … |
| **AUTOMATE** | Make, APIs, webhooks, workflows, … |
| **INTELLIGENCE** | LLMs, agents, AI interfaces, RAG, … |
| **GROW** | marketing, GTM, growth, content, … |

Also: which 3 would you most want to be hired for? Those get visual weight.

---

## G. Lab Log — **P1** (blocks Phase 12)

8–15 dated entries, one or two lines each, written by you. Backdate honestly from real activity.

```
04 SEP 2026  Interactive portfolio architecture defined.
02 SEP 2026  goSTOPS JAS GTM strategy developed.
31 AUG 2026  Segmentation framework experiment.
```

---

## H. AI assistant — **P1** (blocks Phase 10)

| # | Item |
|---|---|
| H1 | Decision: third-person "Ask the Lab" *(recommended)* or first-person "Ask Aditya" — see `AI_SPEC.md` §1 |
| H2 | Your written answers to the six suggested questions (these become the zero-cost cached answers) |
| H3 | Topics the assistant must refuse (salary, availability, anything personal) |
| H4 | Which model/provider account to use, and a monthly spend cap in ₹ or $ |

---

## I. Build Mode — **P1** (blocks Phase 12)

| # | Item | Length |
|---|---|---|
| I1 | Why the Lab concept exists — in your words | 100–150 words |
| I2 | Three things that went wrong during this build, honestly | 2–3 sentences each |
| I3 | What you learned building it | 100 words |

*(Write I2 as you go. It is the material that turns this site into its strongest case study — and it can only be captured while it's happening.)*

---

## J. Operational — **P0/P1**

| # | Item | Priority |
|---|---|---|
| J1 | Vercel account (free tier is fine) | P0 |
| J2 | Domain purchased and DNS access | P0 |
| J3 | Analytics preference — Vercel Analytics or Plausible | P0 |
| J4 | Error monitoring account (Sentry free tier) | P1 |
| J5 | AI provider API key + billing cap | P1 |
| J6 | Any brand assets you already have — mark, colours, fonts you're licensed for | P0 if they exist |

---

## Suggested order of supply

1. **Today:** Section A + B1–B3 + J1–J3 → unblocks Phases 0–1 immediately.
2. **This week:** Section C for your three lead projects + E + F → unblocks Phases 2–4, which is the whole V1 site.
3. **Before launch:** B4–B8, A7 resume, A10 photo, remaining media.
4. **After V1 is live:** D, G, H, I.

---

## The honesty rule

Every number on this site should survive a follow-up question in an interview. Where an outcome is uncertain, say what you observed rather than what you'd like it to mean. `[PROJECT_OUTCOME_REQUIRED]` staying empty is better than a figure you cannot defend — and a case study that ends at "here's what I learned" reads as more senior, not less.
