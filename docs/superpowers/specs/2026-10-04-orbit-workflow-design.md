# ORBIT workflow page and site audit fixes: design spec and handoff

Date: 2026-10-04
Repo: `aditya-mahajan-tt/aditya-lab` (audited at commit `477c4f6`, 22 Sep 2026)
Live site audited: https://aditya-lab.vercel.app
Save this file as: `docs/superpowers/specs/2026-10-04-orbit-workflow-design.md`
Reference render: `orbit-flowchart-reference.png` (supplied alongside this file)

Status: structure, placement, diagram form and level of public detail are
decided by Aditya (section 1). Copy is drafted and needs his review before it
ships (section 11). Nothing else blocks implementation.

---

## 0. Kickoff prompt for Claude Code

Paste this into a Claude Code session opened in the `aditya-lab` repo:

```text
Read CLAUDE.md, DESIGN_SYSTEM.md, ARCHITECTURE.md and
docs/superpowers/specs/2026-10-04-orbit-workflow-design.md in full before
doing anything.

Task: add ORBIT to the site as the first "workflow", with one combined
swimlane flowchart, a Workflows section on /systems and a write-up page at
/systems/orbit. Then apply the audit fixes in section 9 of the spec.

How to work:
1. Use the Superpowers writing-plans skill to turn the spec into
   docs/superpowers/plans/2026-10-04-orbit-workflow.md. Show me the plan and
   wait for my yes.
2. Branch: feature/orbit-workflow. Small commits, one per green slice.
3. Order: schema and data first (with tests), then the diagram component,
   then the pages, then wiring (search, sitemap, Ask the Lab), then the
   audit fixes.
4. The data in section 5 is already validated: the lane and row grid was
   rendered and checked. Use it as written. Do not re-lay-out the diagram,
   rename nodes or rewrite node details without asking me.
5. Draft copy carries [AI_DRAFT_REVIEW]. `npm run build` fails on it by
   design. While the markers exist, verify with
   `ALLOW_PLACEHOLDERS_IN_PROD=1 npm run verify`. Never set that variable
   in Vercel.
6. After every UI slice run `npm run shot` and read the screenshots at 375,
   768, 1280 and 1920 before telling me it works.
7. Stop at the three checkpoints in section 10 and report in the CLAUDE.md
   checkpoint format. Do not merge or deploy until I have removed the draft
   markers myself.

Hard stops (CLAUDE.md section 8) apply: do not invent facts, metrics, links
or a status. Section 11 lists everything that needs me.
```

---

## 1. Decisions already made

Aditya chose these on 4 Oct 2026. They are not open questions.

| Question | Decision |
|---|---|
| Where it lives | A new Workflows section on `/systems` with the diagram, plus a full write-up at `/systems/orbit`. A new `workflow` content type. |
| Diagram form | One combined swimlane flowchart covering ORBIT and the Reels automation. |
| Public detail | Structure only: stages, checks and integrations. No counts, no names of third-party tools the pipeline evaluated, no verdicts on them. |
| ORBIT's personal side | Mechanics only: the three-project cap, intake questions, default commitment, escalation by postponement count, override log. No pattern names and no personal data. |

Consequences for implementation:

- No number appears anywhere in the copy except rule thresholds (three
  projects, 48 hours, 25 and 90 minutes, two and three postponements, every
  three days, hourly).
- The security scanner is called "a skill security scanner", not by name.
- Instagram access is described as "through Aditya's own logged-in browser
  session". No endpoint, header or collection detail.
- The words "avoidance", "procrastination", "perfectionism" and the pattern
  list do not appear.
- No link to the Command Centre: it is a private page.

---

## 2. Audit findings

Checked against the live site and the repo. "In scope" means section 9 of
this spec fixes it.

| # | Finding | Evidence | Fix | In scope |
|---|---|---|---|---|
| 1 | Canonical URL, sitemap and Open Graph image all point at a per-deployment host, not the real domain. Search engines and link previews are being sent to `aditya-i428nz16b-aditya-mahajan-tt.vercel.app`. | `<link rel="canonical">` on the live homepage; every `<loc>` in `/sitemap.xml`. Cause: `NEXT_PUBLIC_SITE_URL` is unset in Vercel, so `data/site.ts` falls back to `VERCEL_URL`. | Aditya sets `NEXT_PUBLIC_SITE_URL` in Vercel (production). Code: prefer `VERCEL_PROJECT_PRODUCTION_URL` over `VERCEL_URL` in the fallback. | Yes |
| 2 | LeadIQ "Live App" link is dead. | `https://leadiq-o2qtusay3-aditya-mahajan-tt.vercel.app` returns HTTP 410. It is a preview URL in `data/projects.ts`. | Swap in the production URL. Needs the URL from Aditya. | Yes, once supplied |
| 3 | The `agent-pipeline` diagram exists in data and is tested, but no page renders it. | `data/systems.ts` defines it; only `e2e/link-suggestions.spec.ts` references it. The Turbotork spec (line 276) intended it as a visible diagram. | Render it on `/systems` under Automation Engine. | Yes |
| 4 | Station copy describes diagrams that do not match what is built. | `data/stations.ts`: Automation Engine lists seven stages including "automation"; the diagram has six. Strategy Wall promises "customer-journey work"; the diagram has none. | Align the two descriptions with the real nodes. | Yes |
| 5 | The flagship case study and the only experiment page are missing from the smoke suite and from screenshots. | `ROUTES` in `e2e/smoke.spec.ts` and `scripts/screenshots.mjs` omit `/work/turbotork` and `/experiments/ai-lead-generation-engine`. | Add both, plus `/systems/orbit`. | Yes |
| 6 | Ask the Lab, the command palette and link chips know nothing about `/systems` content. | `lib/ai/knowledge.ts`, `lib/search.ts` and `lib/ai/link-suggestions.ts` read projects and experiments only. | Workflows join all three (section 7). | Yes |
| 7 | The Lab Log has one entry, dated 4 Sep 2026, on a page that promises a running record. | `data/timeline.ts`. | Aditya writes entries. The repo rule is that log entries are never generated. | Needs Aditya |
| 8 | One experiment, and no FAILED one. | `data/experiments.ts`; `PLAN.md` Phase 14 asks for at least one honest failure. | Content from Aditya. | No |
| 9 | Contact email is the programme address, which expires with the degree. | Comment in `data/site.ts`. | Aditya's call. | No |
| 10 | `/systems` has no entry in the orbital hero or the homepage beyond the station cards. | `data/queries.ts` `getHeroBodies`. | Leave as is for this change (section 12). | No |

Not audited here: Lighthouse performance, a real-device pass and a full
accessibility scan. The repo's own `npm run verify` covers axe and bundle
budgets and must stay green.

---

## 3. What to build

1. A `workflow` content type: schema in `data/schema.ts`, content in a new
   `data/workflows.ts`, queries in `data/queries.ts`.
2. A `WorkflowDiagram` component: a swimlane flowchart at wide viewports and
   a stacked step list below them, both from the same data.
3. A Workflows section on `/systems`.
4. A write-up page at `/systems/[slug]`, with `/systems/orbit` as the first
   entry.
5. Wiring: sitemap, command palette, Ask the Lab corpus, link suggestions.
6. Tests.
7. The audit fixes marked in scope.

No new dependency. No new colour, size, duration or z-index: every value is
an existing token.

---

## 4. Content model

Add to `data/schema.ts`. Zod stays the source of truth; types are inferred.

```ts
/* ------------------------------------------------------------ workflows */

export const WorkflowLaneSchema = z.object({ id: z.string(), label: z.string() });

export const WorkflowPhaseSchema = z.object({
  id: z.string(),
  label: z.string(),
  summary: Fillable,
  /** Where the phase caption sits on the swimlane grid. */
  lane: z.string(),
  row: z.number().int().min(1),
});

export const WorkflowNodeKind = z.enum([
  "trigger", // a schedule starts a run
  "step",    // something an agent run does
  "gate",    // a rule that can stop or reroute the flow
  "human",   // a decision only Aditya makes
  "surface", // the dashboard
  "store",   // a file, feed or record that is read or written
  "end",     // a terminal outcome
]);

export const WorkflowNodeSchema = z.object({
  id: z.string(),
  phase: z.string(),
  lane: z.string(),
  row: z.number().int().min(1),
  kind: WorkflowNodeKind,
  /** One or two lines, already broken. Each line at most 18 characters. */
  label: z.array(z.string().max(18)).min(1).max(2),
  detail: Fillable,
});

export const WorkflowEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  /** flow = control passes on. data = something is read or written. */
  kind: z.enum(["flow", "data"]),
  label: z.string().optional(),
  /** "vh" = leave vertically, then enter horizontally. Default is the reverse. */
  route: z.enum(["vh"]).optional(),
});

export const WorkflowSchema = z
  .object({
    id: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: Fillable,
    subtitle: z.string().optional(),
    year: z.string(),
    status: ExperimentStatus,
    planes: z.array(Plane).min(1),
    leadTopics: LeadTopics,
    summary: Fillable,
    why: Fillable,
    principles: z.array(z.object({ title: z.string(), body: Fillable })).min(1),
    checks: z.array(z.object({ rule: z.string(), prevents: Fillable })).min(1),
    integrations: z
      .array(z.object({ name: z.string(), access: z.enum(["reads", "writes", "reads + writes", "runs on"]), note: Fillable }))
      .min(1),
    limits: z.array(Fillable).min(1),
    reflection: z.string().optional(),
    lanes: z.array(WorkflowLaneSchema).min(2),
    phases: z.array(WorkflowPhaseSchema).min(1),
    /** Array order is reading order: it drives tab order and the stacked list. */
    nodes: z.array(WorkflowNodeSchema).min(2),
    edges: z.array(WorkflowEdgeSchema).min(1),
  })
  .superRefine((w, ctx) => {
    const ids = new Set<string>();
    const cells = new Set<string>();
    const lanes = new Set(w.lanes.map((l) => l.id));
    const phases = new Set(w.phases.map((p) => p.id));
    for (const n of w.nodes) {
      if (ids.has(n.id)) ctx.addIssue({ code: "custom", message: `duplicate node id ${n.id}` });
      ids.add(n.id);
      const cell = `${n.lane}:${n.row}`;
      if (cells.has(cell)) ctx.addIssue({ code: "custom", message: `two nodes in cell ${cell}` });
      cells.add(cell);
      if (!lanes.has(n.lane)) ctx.addIssue({ code: "custom", message: `unknown lane on ${n.id}` });
      if (!phases.has(n.phase)) ctx.addIssue({ code: "custom", message: `unknown phase on ${n.id}` });
    }
    const linked = new Set<string>();
    for (const e of w.edges) {
      if (!ids.has(e.from) || !ids.has(e.to))
        ctx.addIssue({ code: "custom", message: `edge ${e.from} -> ${e.to} names a missing node` });
      linked.add(e.from);
      linked.add(e.to);
    }
    for (const id of ids)
      if (!linked.has(id)) ctx.addIssue({ code: "custom", message: `node ${id} has no edge` });
  });

export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;
```

Add to `data/queries.ts`: `getAllWorkflows()` and `getWorkflow(slug)`.

---

## 5. Content: `data/workflows.ts`

### 5.1 Which copy is marked as a draft

The repo treats two kinds of text differently, and this file has both.

- **Narrative fields** (`summary`, `why`, `principles`, `checks`, `limits`,
  phase summaries) are prose about Aditya's own work, drafted for him. They
  carry `[AI_DRAFT_REVIEW]` and block the production build until he reviews
  them. The marker must be a literal inline string, as `data/schema.ts`
  requires.
- **Node labels and details** describe the system at a structural level and
  are checkable against the rule files listed in the appendix. They follow
  the precedent in `data/systems.ts` and are written without a marker.
  Aditya still reads all of them at Checkpoint C.

If Aditya would rather have every node detail marked too, ask him before
adding 49 markers.

### 5.2 The file

```ts
import { z } from "zod";
import { WorkflowSchema } from "./schema";

/**
 * Workflows: systems Aditya runs for himself, shown as flowcharts.
 *
 * Narrative fields below were drafted on 2026-10-04 from ORBIT's own rule
 * files and the Reels pipeline procedures (see the spec's appendix) and
 * carry the draft marker until Aditya approves them. Node labels and details
 * are structural descriptions of those same files and follow the precedent
 * in data/systems.ts.
 *
 * Public-detail rule (Aditya, 2026-10-04): structure only. No counts, no
 * names of evaluated third-party tools, no verdicts on them, and ORBIT's
 * mechanics without any personal data.
 */
const raw = [
  {
    id: "001",
    slug: "orbit",
    title: "ORBIT",
    subtitle: "A control layer for finishing things",
    year: "2026",
    status: "WORKING", // Aditya to confirm: see spec section 11
    planes: ["ai", "product"], // Aditya to confirm: see spec section 11
    leadTopics: [
      "workflow",
      "personal operating system",
      "scheduled agents",
      "human in the loop",
      "guardrails",
      "personal automation",
      "tool vetting",
    ],

    summary:
      "[AI_DRAFT_REVIEW] A personal operating system built on scheduled agent runs. It proposes one commitment a day, caps active projects at three, and turns saved Reels about AI tools into a verified, security-scanned shortlist, with a human approval gate before anything is installed.",

    why: "[AI_DRAFT_REVIEW] Two problems had the same shape. Too many projects were open at once, and every new tracker became one more thing to maintain. Separately, a growing list of saved Reels recommended AI tools with no way of telling which claims were real. ORBIT treats both as an operations problem: one state file, a small set of rules, and agents that do the reading and checking so that the only thing left for a person is the decision.",

    principles: [
      {
        title: "One state file",
        body: "[AI_DRAFT_REVIEW] The system writes to exactly one file. The dashboard is a view of it and a queue of taps, never a second record to reconcile.",
      },
      {
        title: "Read sources where they live",
        body: "[AI_DRAFT_REVIEW] Calendar, mail, git history and project files are read in place. Nothing is copied into a new tracker.",
      },
      {
        title: "Friction, not control",
        body: "[AI_DRAFT_REVIEW] The system can ask, flag and escalate. Only Aditya changes a project's state, and he can override any rule as long as the override is logged with a review date.",
      },
      {
        title: "A claim is not a fact",
        body: "[AI_DRAFT_REVIEW] A Reel naming a tool is treated as a claim. Nothing is recommended until an independent record confirms it exists and what it is.",
      },
      {
        title: "The finder never installs",
        body: "[AI_DRAFT_REVIEW] The run that discovers a tool cannot install it, and the run that installs cannot choose what to install. A person sits between the two.",
      },
      {
        title: "Hold and explain",
        body: "[AI_DRAFT_REVIEW] A failed check stops the flow and says why in plain language. It is never a silent skip and never a silent pass.",
      },
      {
        title: "Evidence, not scores",
        body: "[AI_DRAFT_REVIEW] Reviews count what happened and cite dated evidence. There are no ratings and no rankings.",
      },
    ],

    checks: [
      { rule: "Chat wins over taps", prevents: "[AI_DRAFT_REVIEW] A stale tap on the dashboard overwriting something already agreed in conversation." },
      { rule: "Deadlines outrank projects", prevents: "[AI_DRAFT_REVIEW] A project commitment being proposed on a day when a real deadline falls inside 48 hours." },
      { rule: "Escalate by count", prevents: "[AI_DRAFT_REVIEW] A commitment being quietly rescheduled forever. The second slip is named; the third stops rescheduling until a decision is made." },
      { rule: "Three active projects", prevents: "[AI_DRAFT_REVIEW] The active set growing silently. A fourth needs a trade or a logged override." },
      { rule: "No reply, no invention", prevents: "[AI_DRAFT_REVIEW] A review filling in answers that were never given. It records what it observed and marks the rest as unanswered." },
      { rule: "Read-only on project repos", prevents: "[AI_DRAFT_REVIEW] A scheduled run committing, staging or leaving a lock behind in a working repository." },
      { rule: "Nothing new, nothing done", prevents: "[AI_DRAFT_REVIEW] Unchanged data being reprocessed for no reason." },
      { rule: "Verify before recommending", prevents: "[AI_DRAFT_REVIEW] A tool being shortlisted on the strength of a caption alone." },
      { rule: "Disambiguate by data", prevents: "[AI_DRAFT_REVIEW] The wrong project being picked when several share a name. A real trade-off goes to Aditya instead of being guessed." },
      { rule: "Sweep never installs", prevents: "[AI_DRAFT_REVIEW] Discovery and installation happening in one unattended step." },
      { rule: "Scan before copy", prevents: "[AI_DRAFT_REVIEW] Unreviewed code reaching the machine. A flagged candidate is held with an explanation." },
      { rule: "Sandbox only", prevents: "[AI_DRAFT_REVIEW] A trial tool reaching global configuration. Only the skill folder is copied, its scripts are never run, and the source and commit are recorded." },
      { rule: "Unreachable means stop", prevents: "[AI_DRAFT_REVIEW] A run guessing at data when the laptop or browser cannot be reached." },
    ],

    integrations: [
      { name: "Claude scheduled tasks", access: "runs on", note: "[AI_DRAFT_REVIEW] Five scheduled agent runs: morning, evening, weekly, the sweep and the installer." },
      { name: "Google Calendar", access: "reads", note: "[AI_DRAFT_REVIEW] Deadlines and sessions for the next 48 hours." },
      { name: "Gmail", access: "reads", note: "[AI_DRAFT_REVIEW] Programme mail, for deadlines that never reach the calendar." },
      { name: "GitHub", access: "reads", note: "[AI_DRAFT_REVIEW] The repository list, to detect new projects, and public repository records, to verify tools." },
      { name: "Local git and project files", access: "reads", note: "[AI_DRAFT_REVIEW] What actually moved in each active project." },
      { name: "Instagram saved collection", access: "reads", note: "[AI_DRAFT_REVIEW] The raw input for the Reels sweep, read through Aditya's own browser session." },
      { name: "SQLite", access: "reads + writes", note: "[AI_DRAFT_REVIEW] The local database behind the Reels pipeline." },
      { name: "Command Centre", access: "reads + writes", note: "[AI_DRAFT_REVIEW] One dashboard: a snapshot to read, and a queue of taps to act on." },
      { name: "Sandbox folder", access: "writes", note: "[AI_DRAFT_REVIEW] Where approved tools are installed for trial, with their provenance." },
    ],

    limits: [
      "[AI_DRAFT_REVIEW] It depends on one laptop being awake with the desktop app open. When the laptop is unreachable, scheduled runs pause.",
      "[AI_DRAFT_REVIEW] It cannot see browser, phone or app time, by design. Anything about those comes only from what Aditya reports.",
      "[AI_DRAFT_REVIEW] Reels are judged on their captions. There is no transcript of the video.",
      "[AI_DRAFT_REVIEW] Automation stops at the sandbox. Moving a tool into everyday use is a manual step.",
    ],

    lanes: [
      { id: "state", label: "STATE + SOURCES" },
      { id: "orbit", label: "ORBIT · SCHEDULED RUNS" },
      { id: "human", label: "ADITYA · COMMAND CENTRE" },
      { id: "reels", label: "REELS · SCHEDULED RUNS" },
      { id: "systems", label: "EXTERNAL + LOCAL SYSTEMS" },
    ],

    phases: [
      { id: "A", label: "DAILY CONTROL LOOP", lane: "orbit", row: 1,
        summary: "[AI_DRAFT_REVIEW] Each scheduled run applies what was tapped on the dashboard, reads the real sources, and proposes one commitment for the day. The evening run checks it against evidence, and a slip escalates by count." },
      { id: "B", label: "PROJECT INTAKE", lane: "orbit", row: 10,
        summary: "[AI_DRAFT_REVIEW] Nothing new becomes a project by default. A new repository or idea answers six questions, and with three projects already active it waits in the inbox unless something is traded out or an override is logged." },
      { id: "C", label: "REELS SWEEP", lane: "reels", row: 1,
        summary: "[AI_DRAFT_REVIEW] Every three days a run reads the saved collection, classifies what is new, and checks every named tool against independent records. It produces a shortlist and never installs anything." },
      { id: "D", label: "APPROVED INSTALL", lane: "reels", row: 10,
        summary: "[AI_DRAFT_REVIEW] A separate hourly run turns approvals into installs. Each candidate is scanned first; a flagged one is held and explained, and anything installed goes into a sandbox with its provenance recorded." },
    ],

    nodes: [
      // --- A · DAILY CONTROL LOOP
      { id: "a-trigger", phase: "A", lane: "orbit", row: 1, kind: "trigger", label: ["SCHEDULED RUN"],
        detail: "Three scheduled agent runs: a morning brief every day, an evening review Monday to Saturday, and a weekly review on Sunday." },
      { id: "a-queue", phase: "A", lane: "human", row: 2, kind: "surface", label: ["TAP QUEUE"],
        detail: "Every tap on the dashboard lands in a queue. The queue is a message box, never the record: nothing counts until a run applies it." },
      { id: "a-apply", phase: "A", lane: "orbit", row: 2, kind: "step", label: ["APPLY TAP QUEUE"],
        detail: "Each run starts by applying pending taps to the state file, oldest first. If chat already recorded something that contradicts a tap, chat wins and the tap is rejected with a note." },
      { id: "a-sources", phase: "A", lane: "state", row: 3, kind: "store", label: ["CALENDAR · MAIL", "GIT · FILES"],
        detail: "Read-only inputs: calendar, programme mail, git history and file changes in the project folders. ORBIT reads them where they live and never copies them." },
      { id: "a-read", phase: "A", lane: "orbit", row: 3, kind: "step", label: ["READ SOURCES"],
        detail: "Gathers the next 48 hours of deadlines and what actually moved in each active project since the last run. It cannot see browser, phone or app time, by design." },
      { id: "a-propose", phase: "A", lane: "orbit", row: 4, kind: "step", label: ["PROPOSE ONE", "COMMITMENT"],
        detail: "One outcome for the day, with a first physical action of 25 minutes or less. A real deadline inside 48 hours outranks any project. The proposal stands unless it is replaced." },
      { id: "a-write", phase: "A", lane: "orbit", row: 5, kind: "step", label: ["WRITE STATE", "PUSH SNAPSHOT"],
        detail: "Writes the result to the state file, then pushes a read-only snapshot to the dashboard. The dashboard is a view of the state, never the state itself." },
      { id: "a-state", phase: "A", lane: "state", row: 5, kind: "store", label: ["ONE STATE FILE"],
        detail: "The only place ORBIT writes: project register, today's commitment, decisions, overrides and the review log. One file, so there is never a second tracker to reconcile." },
      { id: "a-now", phase: "A", lane: "human", row: 5, kind: "surface", label: ["NOW VIEW"],
        detail: "The dashboard's first screen: today's commitment, the first action, what is due in 48 hours, and any active project that has gone quiet." },
      { id: "a-act", phase: "A", lane: "human", row: 4, kind: "human", label: ["DO THE WORK", "TAP THE RESULT"],
        detail: "Aditya does the work and taps the outcome: done, not done with a reason, replace the commitment, or capture a new idea." },
      { id: "a-evening", phase: "A", lane: "orbit", row: 6, kind: "step", label: ["EVENING REVIEW"],
        detail: "Shows what the run observed, asks six short questions, and writes one evidence line. If there is no reply it records only what it saw and never invents an answer." },
      { id: "a-gate", phase: "A", lane: "orbit", row: 7, kind: "gate", label: ["POSTPONED", "TWICE?"],
        detail: "A carried commitment keeps its original row and its postponed count goes up. The count, not the excuse, decides what happens next." },
      { id: "a-flag", phase: "A", lane: "human", row: 7, kind: "surface", label: ["FLAG IT", "SMALLEST NEXT STEP"],
        detail: "At two postponements the slip is named plainly and cut down to the smallest next action, with one question about the blocker." },
      { id: "a-fate", phase: "A", lane: "human", row: 8, kind: "human", label: ["FINISH · PARK", "OR DROP"],
        detail: "At three postponements rescheduling stops. Nothing is re-committed until Aditya chooses: finish, simplify, delegate, pause, park or abandon." },
      { id: "a-weekly", phase: "A", lane: "orbit", row: 8, kind: "step", label: ["WEEKLY REVIEW"],
        detail: "Counts from the log and git only: commitments kept and missed, projects advanced and stalled. At most two observations, each citing dated evidence. No scores." },
      // --- B · PROJECT INTAKE
      { id: "b-new", phase: "B", lane: "state", row: 10, kind: "store", label: ["NEW REPO OR IDEA"],
        detail: "A new repository is detected automatically from the code host; an idea arrives through the dashboard's capture button. Neither starts a build." },
      { id: "b-intake", phase: "B", lane: "orbit", row: 10, kind: "step", label: ["INTAKE", "SIX QUESTIONS"],
        detail: "What problem, why now, which existing project it supports, the smallest useful version, which active project pauses, and whether it is a project at all." },
      { id: "b-gate", phase: "B", lane: "orbit", row: 11, kind: "gate", label: ["THREE ACTIVE", "ALREADY?"],
        detail: "The cap is three active projects. ORBIT itself is infrastructure and never takes a slot." },
      { id: "b-inbox", phase: "B", lane: "state", row: 11, kind: "store", label: ["IDEA INBOX", "NO BUILD"],
        detail: "The default destination when all three slots are full. Parked with a date, not started." },
      { id: "b-trade", phase: "B", lane: "state", row: 12, kind: "store", label: ["TRADE OR OVERRIDE", "LOGGED"],
        detail: "Two ways past a full register, both recorded in the decision log: Aditya names which active project is finished or paused, or declares an override. An override is allowed at once and logged with the rule broken, the reason and a review date." },
      { id: "b-slot", phase: "B", lane: "orbit", row: 12, kind: "step", label: ["ACTIVE SLOT"],
        detail: "Every active project carries a definition of done and one concrete next action of 90 minutes or less. \"Working on it\" is not accepted as a status." },
      // --- C · REELS SWEEP
      { id: "c-trigger", phase: "C", lane: "reels", row: 1, kind: "trigger", label: ["EVERY THREE DAYS"],
        detail: "A scheduled agent run. It needs the laptop awake; if the laptop is unreachable the run says so and stops instead of guessing." },
      { id: "c-saved", phase: "C", lane: "systems", row: 2, kind: "store", label: ["SAVED COLLECTION"],
        detail: "The collection of AI and tooling Reels Aditya saves on Instagram. The raw input: other people's claims about tools." },
      { id: "c-pull", phase: "C", lane: "reels", row: 2, kind: "step", label: ["PULL SAVED", "COLLECTION"],
        detail: "Reads the saved collection through Aditya's own logged-in browser session, paginating until the whole collection is in hand." },
      { id: "c-gate-new", phase: "C", lane: "reels", row: 3, kind: "gate", label: ["ANYTHING NEW?"],
        detail: "Compares the pull against what is already in the database. Unchanged data is never reprocessed." },
      { id: "c-stop", phase: "C", lane: "systems", row: 3, kind: "end", label: ["STOP", "NOTHING NEW"],
        detail: "The run reports that nothing changed and ends." },
      { id: "c-ingest", phase: "C", lane: "reels", row: 4, kind: "step", label: ["INGEST", "RULE CLASSIFY"],
        detail: "New items are stored, then sorted by keyword rules. The rule pass is fast and is kept as an audit trail even when a later judgment overrides it." },
      { id: "c-db", phase: "C", lane: "systems", row: 4, kind: "store", label: ["LOCAL DATABASE"],
        detail: "A local SQLite file on the laptop. No server and no hosted database: the scale does not need one." },
      { id: "c-judge", phase: "C", lane: "reels", row: 5, kind: "step", label: ["MODEL JUDGES", "TO A RUBRIC"],
        detail: "A second pass against a written rubric: relevant or not, and what to do with it. Grounded in the caption only. A field is left empty rather than guessed." },
      { id: "c-records", phase: "C", lane: "systems", row: 6, kind: "store", label: ["PUBLIC REPO", "RECORDS"],
        detail: "Independent evidence: whether the project exists, its licence, activity and any disclosed security issues." },
      { id: "c-verify", phase: "C", lane: "reels", row: 6, kind: "step", label: ["VERIFY", "NAMED TOOLS"],
        detail: "A Reel naming a tool is a claim, not a fact. Nothing is recommended on the strength of the caption alone; what cannot be verified is listed as unverified." },
      { id: "c-gate-amb", phase: "C", lane: "reels", row: 7, kind: "gate", label: ["NAME", "AMBIGUOUS?"],
        detail: "Several unrelated projects often share one name." },
      { id: "c-disamb", phase: "C", lane: "systems", row: 7, kind: "step", label: ["DISAMBIGUATE", "BY REPO DATA"],
        detail: "Compares the competing repositories on real figures. A number quoted in the Reel is useless as proof of quality, but it identifies which project the creator meant. Where the data shows a trade-off, the choice goes to Aditya." },
      { id: "c-shortlist", phase: "C", lane: "reels", row: 8, kind: "step", label: ["BUILD SHORTLIST"],
        detail: "Sorts candidates into ready for trial, flagged, needs a choice, text-only technique, and unverified. Corrections to earlier calls are recorded, not smoothed over." },
      { id: "c-publish", phase: "C", lane: "reels", row: 9, kind: "step", label: ["PUBLISH", "NEVER INSTALL"],
        detail: "The sweep writes the shortlist to the dashboard and stops there. It never installs anything, and it reads existing decisions first so a rebuild cannot discard a call already made." },
      { id: "c-tab", phase: "C", lane: "human", row: 9, kind: "surface", label: ["REELS TAB"],
        detail: "The review console inside the same dashboard, so there is one place for every action item." },
      // --- D · APPROVED INSTALL
      { id: "d-trigger", phase: "D", lane: "reels", row: 10, kind: "trigger", label: ["HOURLY INSTALLER"],
        detail: "A separate scheduled run with a separate job: turn approvals into installs. An empty run records that it ran and does nothing else." },
      { id: "d-approve", phase: "D", lane: "human", row: 11, kind: "human", label: ["APPROVE · REJECT", "DEFER"],
        detail: "The human gate. Aditya approves, rejects or defers each candidate, and picks the repository when the data showed a trade-off." },
      { id: "d-read", phase: "D", lane: "reels", row: 11, kind: "step", label: ["READ APPROVALS"],
        detail: "Takes only approved items that have not been installed yet. Text-only techniques are skipped: they stay as drafts to paste by hand." },
      { id: "d-gate-skill", phase: "D", lane: "reels", row: 12, kind: "gate", label: ["SKILL FILE", "FOUND?"],
        detail: "Clones the repository and looks for an actual skill definition." },
      { id: "d-none", phase: "D", lane: "systems", row: 12, kind: "end", label: ["NOTHING", "TO INSTALL"],
        detail: "Recorded with a note saying what the repository is instead." },
      { id: "d-scan", phase: "D", lane: "reels", row: 13, kind: "step", label: ["SECURITY SCAN"],
        detail: "A skill security scanner runs over the candidate before anything is copied. The scanner was the first thing installed, so it could vet everything after it." },
      { id: "d-gate-flag", phase: "D", lane: "reels", row: 14, kind: "gate", label: ["SCAN", "FLAGGED IT?"],
        detail: "A do-not-install verdict is a hold. It is never a silent skip and never a silent install." },
      { id: "d-hold", phase: "D", lane: "human", row: 14, kind: "surface", label: ["HOLD", "EXPLAIN FINDING"],
        detail: "The run reads the actual findings and writes one or two plain sentences: what was flagged, and whether it looks like a false positive or a real problem." },
      { id: "d-force", phase: "D", lane: "human", row: 15, kind: "human", label: ["INSTALL ANYWAY", "OR DROP"],
        detail: "A held item costs one tap to release or drop. A forced install is recorded as an override." },
      { id: "d-install", phase: "D", lane: "reels", row: 15, kind: "step", label: ["INSTALL", "SANDBOX ONLY"],
        detail: "Copies only the skill folder. Never runs a script from the candidate, never copies its docs or dependencies, and holds anything oversized." },
      { id: "d-sandbox", phase: "D", lane: "systems", row: 15, kind: "store", label: ["SANDBOX", "+ PROVENANCE"],
        detail: "A scoped trial folder, not the global configuration. Each install records its repository, commit, date and scan summary. Promotion out of the sandbox is manual." },
      { id: "d-record", phase: "D", lane: "reels", row: 16, kind: "step", label: ["RECORD RESULT"],
        detail: "Writes the outcome back against the decision: installed, held, failed or nothing to install, with a plain-language note." },
      { id: "d-status", phase: "D", lane: "human", row: 16, kind: "surface", label: ["STATUS ON", "REELS TAB"],
        detail: "The result appears on the same card that was approved, with the time the installer last ran." },
    ],
    edges: [
      { from: "a-trigger", to: "a-apply", kind: "flow" },
      { from: "a-queue", to: "a-apply", kind: "data" },
      { from: "a-apply", to: "a-read", kind: "flow" },
      { from: "a-sources", to: "a-read", kind: "data" },
      { from: "a-read", to: "a-propose", kind: "flow" },
      { from: "a-propose", to: "a-write", kind: "flow" },
      { from: "a-write", to: "a-state", kind: "data" },
      { from: "a-write", to: "a-now", kind: "data" },
      { from: "a-now", to: "a-act", kind: "flow" },
      { from: "a-act", to: "a-queue", kind: "flow" },
      { from: "a-write", to: "a-evening", kind: "flow", label: "EVENING" },
      { from: "a-evening", to: "a-gate", kind: "flow" },
      { from: "a-gate", to: "a-flag", kind: "flow", label: "YES" },
      { from: "a-flag", to: "a-fate", kind: "flow", label: "3RD TIME" },
      { from: "a-gate", to: "a-weekly", kind: "flow", label: "NO" },
      { from: "b-new", to: "b-intake", kind: "flow" },
      { from: "b-intake", to: "b-gate", kind: "flow" },
      { from: "b-gate", to: "b-inbox", kind: "flow", label: "YES" },
      { from: "b-inbox", to: "b-trade", kind: "flow" },
      { from: "b-trade", to: "b-slot", kind: "flow" },
      { from: "b-gate", to: "b-slot", kind: "flow", label: "NO" },
      { from: "c-trigger", to: "c-pull", kind: "flow" },
      { from: "c-saved", to: "c-pull", kind: "data" },
      { from: "c-pull", to: "c-gate-new", kind: "flow" },
      { from: "c-gate-new", to: "c-stop", kind: "flow", label: "NO" },
      { from: "c-gate-new", to: "c-ingest", kind: "flow", label: "YES" },
      { from: "c-ingest", to: "c-db", kind: "data" },
      { from: "c-ingest", to: "c-judge", kind: "flow" },
      { from: "c-judge", to: "c-verify", kind: "flow" },
      { from: "c-records", to: "c-verify", kind: "data" },
      { from: "c-verify", to: "c-gate-amb", kind: "flow" },
      { from: "c-gate-amb", to: "c-disamb", kind: "flow", label: "YES" },
      { from: "c-disamb", to: "c-shortlist", kind: "flow", route: "vh" },
      { from: "c-gate-amb", to: "c-shortlist", kind: "flow", label: "NO" },
      { from: "c-shortlist", to: "c-publish", kind: "flow" },
      { from: "c-publish", to: "c-tab", kind: "data" },
      { from: "c-tab", to: "d-approve", kind: "flow" },
      { from: "d-trigger", to: "d-read", kind: "flow" },
      { from: "d-approve", to: "d-read", kind: "data" },
      { from: "d-read", to: "d-gate-skill", kind: "flow" },
      { from: "d-gate-skill", to: "d-none", kind: "flow", label: "NO" },
      { from: "d-gate-skill", to: "d-scan", kind: "flow", label: "YES" },
      { from: "d-scan", to: "d-gate-flag", kind: "flow" },
      { from: "d-gate-flag", to: "d-hold", kind: "flow", label: "YES" },
      { from: "d-hold", to: "d-force", kind: "flow" },
      { from: "d-force", to: "d-install", kind: "flow" },
      { from: "d-gate-flag", to: "d-install", kind: "flow", label: "NO" },
      { from: "d-install", to: "d-sandbox", kind: "data" },
      { from: "d-install", to: "d-record", kind: "flow" },
      { from: "d-record", to: "d-status", kind: "data" },
    ],
  },
];

export const workflows = z.array(WorkflowSchema).parse(raw);
```

---

## 6. The diagram

### 6.1 Geometry (validated)

The grid below was rendered and checked: no two nodes share a cell, no edge
passes through a node, and every label fits. See the reference image.

| Constant | Value |
|---|---|
| Lanes | 5 columns, in the order of `lanes` |
| `LANE_W` | 236 |
| `NODE_W` × `NODE_H` | 196 × 52 |
| `ROW_H` | 88 |
| `HEAD` (lane header band) | 72 |
| viewBox | `0 0 1180 1504` for 16 rows |
| Node centre x | `laneIndex * 236 + 118` |
| Node centre y | `72 + (row - 1) * 88 + 44` |

Add `layoutSwimlane(nodes, lanes, opts)` to `components/systems/diagramLayout.ts`
and reuse the existing `edgePoints` for straight edges. The existing
serpentine and vertical layouts stay untouched.

Edge routing, in this order:

1. Same row: one horizontal segment between the facing sides.
2. Same lane: one vertical segment between the facing top and bottom.
3. `route: "vh"`: leave the source vertically, turn, enter the target's side.
4. Otherwise: leave the source's side, turn, enter the target's top or bottom.

### 6.2 Node shapes

Shape carries the meaning. Colour does not: the accent appears only on
hover, focus and the active node, as in the existing diagrams.

| Kind | Tag | Shape | Fill | Stroke |
|---|---|---|---|---|
| `trigger` | TRIGGER | Pill (`rx = NODE_H / 2`) | `--color-surface` | `--color-border-strong` |
| `step` | AGENT | Rectangle, `rx 4` | `--color-surface` | `--color-border` |
| `gate` | CHECK | Hexagon: rectangle with both ends pointed, 16px inset | `--color-surface` | `--color-border-strong` |
| `human` | YOU | Pill | `--color-surface` | `--color-border-strong` |
| `surface` | DASHBOARD | Rectangle, `rx 4` | `--color-surface-raised` | `--color-border-strong` |
| `store` | DATA | Rectangle, `rx 4`, dashed stroke `5 4` | `--color-surface` | `--color-border-strong` |
| `end` | END | Rectangle, `rx 4` | `--color-bg` | `--color-border` |

- Tag: mono, 10px, `--tracking-mono`, `--color-text-faint`, above the node's
  top-left corner, the same position `ProcessDiagram` uses for its index.
- Label: mono, 13px, uppercase, `--tracking-mono`, `--color-text`, centred,
  one or two lines 16px apart.
- Flow edges: 1.5px solid `--color-border-strong` with the existing arrow
  marker. Data edges: the same, dashed `3 4`.
- Edge labels (YES, NO, EVENING, 3RD TIME): mono, 10px, `--color-text-muted`.
- Lane headers: `.label` style, centred, with 1px `--color-border` dividers
  between lanes and under the header band.
- Phase captions ("A · DAILY CONTROL LOOP"): mono, 10px, `--color-accent`,
  just above the phase's first node. This is the one static use of the
  accent, and it marks where each flow starts.
- Legend: bottom-left, in the empty block under Phase B (lanes 1 and 2,
  rows 14 to 16). Seven shapes and two edge styles, as in the reference.

The pill is shared by `trigger` and `human`. The tag tells them apart, and
so does the lane.

### 6.3 Interaction

- Hover, focus or tap a node: it becomes active, its stroke goes to
  `--color-accent`, and every edge touching it goes to `--color-accent`.
- The detail panel is a `figcaption` that sticks to the bottom of the
  viewport while the figure is on screen (`position: sticky`, `bottom:
  var(--space-4)`, `z-index: var(--z-sticky)`), on `--color-surface-raised`
  with a 1px `--color-border-strong` border. It shows the tag, the label and
  the detail. Empty state: "Hover, tab or tap a step for detail." It is
  `aria-live="polite"`.

  The existing diagrams put the caption under the figure. That does not
  work here: this figure is taller than the viewport.
- Each node is `role="button"`, `tabIndex={0}`, with `aria-label` of
  `"{TAG}: {label}. {detail}"`. DOM order is the `nodes` array order, which
  is reading order, so Tab walks the flow rather than the grid.
- A "Skip the diagram" link before the figure, visible on focus, jumps past
  all 49 tab stops.
- Enter and Space toggle the active node. Escape clears it.
- No animated particles. With 50 edges they would be noise.
- Reduced motion: stroke changes are instant. Nothing else moves.
- No `role="img"` on the `<svg>`, for the reason given in `ProcessDiagram`.

### 6.4 Below `xl`: the stacked list

The swimlane needs about 1180px to stay legible. Below `xl` (1280px) it is
not rendered. The same data renders as a stacked list instead:

- One section per phase: the phase label, then its summary.
- An ordered list of the phase's nodes in array order, skipping `store` nodes.
- Each item: a mono line with the tag and the lane label, then the label,
  then the detail as body text.
- Under an item, chips derived from the edges:
  - `READS` and `WRITES`, from data edges to or from a `store` or `surface`.
  - On a `gate`, one line per labelled outgoing edge: "YES → FLAG IT".
- No horizontal scroll at 375px.

At `xl` and up, the same list sits under the diagram inside a closed
`<details>` titled "READ AS A LIST". That is the route to every detail with
JavaScript off, and the text equivalent CLAUDE.md requires.

---

## 7. Pages and wiring

### 7.1 `/systems`

Insert the Workflows section after Automation Engine, and renumber:

| Label | Section |
|---|---|
| 01 — SYSTEMS | Intro (unchanged) |
| 02 — AUTOMATION | Automation Engine, then Agent Pipeline (audit fix 3) |
| 03 — WORKFLOWS | New |
| 04 — STRATEGY | Strategy Wall |
| 05 — CAPABILITY | Neural Core. Keep `id="neural-heading"`: the hero links to it. |

The Workflows section, per workflow: the `WORKFLOW_001` label with a
`StatusChip`, the title as `h2`, the subtitle, the summary, the
`WorkflowDiagram`, and a link in the existing accent label style:
"READ THE WRITE-UP: ORBIT →" to `/systems/orbit`.

Intro copy for the section, as a draft for Aditya (keep it in
`data/workflows.ts` or `data/systems.ts`, not in the component):

> [AI_DRAFT_REVIEW] The diagrams above show the shape work takes. This one
> is a system that runs: scheduled agents, real integrations, and the checks
> that decide what they are allowed to do.

### 7.2 `/systems/[slug]`

Model it on `app/work/[slug]/page.tsx`: `generateStaticParams`,
`generateMetadata` with a canonical of `/systems/{slug}`, `notFound()` for an
unknown slug, exactly one `h1`.

| Order | Label | Content |
|---|---|---|
| Header | `WORKFLOW_{id} · {year}` | Title, subtitle, summary, then a `dl` with Status (chip) and Runs on (the `runs on` integration) |
| 01 | WHY | `why` |
| 02 | THE FLOW | `WorkflowDiagram` |
| 03 | CHECKS | `checks` as a two-column list: rule in mono, what it prevents as body text |
| 04 | INTEGRATIONS | `integrations` as a list: name, access as a mono tag, note |
| 05 | PRINCIPLES | `principles` |
| 06 | LIMITS | `limits`, in the same dash-list style as case-study learnings |
| 07 | REFLECTION | Only if `reflection` exists. Omit the section otherwise. |
| Footer | | "← All systems" to `/systems` |

Every string goes through `<Fill>` so drafts show their outline in dev.

### 7.3 Wiring

| File | Change |
|---|---|
| `app/sitemap.ts` | Add `/systems/{slug}` for each workflow, priority 0.6. |
| `lib/search.ts` | Add a `Systems` command group with one item per workflow: label is the title, detail is the subtitle. |
| `lib/ai/link-suggestions.ts` | Add workflows to `knownRoutes()` and to `linkCandidates()` with the label `"{title} workflow"`. |
| `lib/ai/knowledge.ts` | Add `buildWorkflowSections()`: one section per workflow, id `workflow-{slug}`, built from summary, why, principles, checks, integrations, limits and the phase summaries. Leave the 49 node details out: they would spend the token budget. Draft and placeholder fields are skipped by the existing `field()` helper, so the section stays thin until Aditya approves the copy. That is correct. |
| `components/navigation/CommandPalette.tsx` | Render the new group if it groups by a fixed list. |
| `ARCHITECTURE.md` | Add `WorkflowDiagram` under `components/systems/` and `workflows.ts` under `data/`. |

No change to `data/navigation.ts`: the page sits under SYSTEMS.

---

## 8. Tests

New file `e2e/workflow.spec.ts`:

1. Data: every workflow parses; node ids are unique; no two nodes share a
   lane and row; every edge resolves; no node is without an edge; every
   label line is 18 characters or fewer; every node has a detail.
2. Public-detail guard: no string in the ORBIT workflow matches
   `/avoidance|procrastinat|perfectionis/i`. This protects the "mechanics
   only" decision from a later edit.
3. At 1280px on `/systems/orbit`: 49 node buttons exist; focusing the first
   shows its detail in the caption; Escape clears it; the caption is in the
   viewport while the middle of the figure is on screen.
4. At 375px: the swimlane is not rendered; all four phase headings are
   visible; `document.documentElement.scrollWidth <= window.innerWidth`.
5. JavaScript disabled, at 1280px and 375px: the text of a node detail from
   each phase is present in the DOM.
6. Axe: no violations on `/systems` and `/systems/orbit`.

Changes to existing tests:

- `e2e/smoke.spec.ts` and `scripts/screenshots.mjs`: add `/systems/orbit`,
  `/work/turbotork` and `/experiments/ai-lead-generation-engine` to `ROUTES`.
- `e2e/knowledge-retrieval.spec.ts`: "What personal automation has he built?"
  selects `workflow-orbit`. "Tell me about his AI agent work"
  still ranks `project-turbotork` first: Turbotork stays the primary
  reference for agents.
- `e2e/knowledge-budget.spec.ts`: must stay green with the new section.
- `e2e/link-suggestions.spec.ts`: an answer that mentions ORBIT gets the
  `/systems/orbit` chip, and `/systems/orbit` survives
  `stripUnknownInternalPaths`.
- `e2e/mobile-audit.spec.ts`: the orbital hero still has 11 bodies. This
  change does not add one.

---

## 9. Audit fixes in scope

Do these after the workflow work, one commit each.

1. **Site URL fallback.** In `data/site.ts`, use
   `NEXT_PUBLIC_SITE_URL`, then `VERCEL_PROJECT_PRODUCTION_URL` (with
   `https://`), then `VERCEL_URL`, then localhost. Confirm the variable name
   against Vercel's current system environment variables before relying on
   it. Aditya also sets `NEXT_PUBLIC_SITE_URL` in Vercel. After the next
   deploy, check that the canonical tag and `/sitemap.xml` show the real host.
2. **LeadIQ link.** Replace the URL in `data/projects.ts` once Aditya
   supplies the production one. If he has not, leave it and say so in the
   checkpoint report. Do not guess a URL.
3. **Agent Pipeline.** Add `components/systems/AgentPipeline.tsx`, the same
   shape as `AutomationEngine.tsx` without `animated`, and render it in the
   Automation section under the engine with an `h3`.
4. **Station copy.** In `data/stations.ts`, make the Automation Engine and
   Strategy Wall descriptions match their real nodes. Mention workflows in
   the Automation Engine line if it reads naturally.
5. **Route coverage.** Covered in section 8.

---

## 10. Checkpoints and acceptance

**Checkpoint A: data.** Schema, `data/workflows.ts`, queries and the data
tests exist and pass. No UI. Report and continue.

**Checkpoint B: the diagram.** `/systems` and `/systems/orbit` render.
Screenshots at 375, 768, 1280 and 1920 have been read. Stop and wait for
Aditya. Compare the 1280 screenshot against the reference image: same lanes,
same rows, no edge through a node, no clipped label.

**Checkpoint C: content.** Wiring and audit fixes done. Stop. Aditya reads
every draft field and every node detail, rewrites or approves, and removes
the markers himself. Only then does `npm run verify` run without the
override, and only then is the branch merged.

Done means all of the CLAUDE.md section 4 list, plus:

- [ ] `npm run verify` green with no `ALLOW_PLACEHOLDERS_IN_PROD`.
- [ ] `CONTENT_TODO.md` reports nothing outstanding.
- [ ] The recruiter path is unchanged: resume, one project and contact are
      still reachable from the homepage in the same number of steps.
- [ ] Initial JS for the homepage has not grown. The diagram is on
      `/systems` only and adds nothing to `/`.
- [ ] The canonical tag on the deployed site shows the real host.

---

## 11. What needs Aditya

| # | Needed | Blocks |
|---|---|---|
| 1 | Read, rewrite or approve the draft copy, and remove the markers. | Production build |
| 2 | Status for ORBIT. `WORKING` is proposed. ORBIT's rules date from 26 Sep 2026, and on 4 Oct four of its five scheduled runs were paused because the laptop was unreachable. `BUILDING` may be more honest. | Checkpoint C |
| 3 | Planes. `ai` and `product` are proposed. Plane assignment is always his call. | Checkpoint C |
| 4 | Confirm the nine integration names are fine to publish, or strike any. | Checkpoint C |
| 5 | The LeadIQ production URL. | Audit fix 2 |
| 6 | Set `NEXT_PUBLIC_SITE_URL` in Vercel, production environment. | Audit fix 1 |
| 7 | A Lab Log entry in his own words for this change. Log entries are never generated. | Nothing |
| 8 | Optional: a `reflection` for the write-up, what building it taught him. | Nothing |

---

## 12. Out of scope

- Adding ORBIT to the orbital hero or the homepage. It changes the 11-body
  layout and its tests. Worth doing later as its own change.
- A 3D station for workflows.
- A live feed from the Command Centre. The page is a description, not a
  window into private data.
- A second workflow. The content type supports it; nothing else is planned.
- Naming evaluated tools or publishing counts. Aditya chose structure only.

---

## Appendix: where the facts come from

Every statement in section 5 was checked against these on 4 Oct 2026. They
are on Aditya's Mac, outside this repo. Claude Code can read them to verify
a node, and must not edit them.

| Source | Path | Covers |
|---|---|---|
| ORBIT rules V1.1 | `~/Claude/Projects/MU/ORBIT/ORBIT_RULES.md` | Phases A and B: sources, governance, commitments, routines, permissions, dashboard sync |
| ORBIT readme | `~/Claude/Projects/MU/ORBIT/README.md` | Schedule, dashboard views, known limits |
| Sweep procedure | `~/Claude/Projects/MU/Instagram Reels/pipeline/sweep_instructions.md` | Phase C |
| Judging rubric | `~/Claude/Projects/MU/Instagram Reels/pipeline/llm_rubric.md` | The caption-only rule |
| Install procedure | `~/Claude/Projects/MU/Instagram Reels/pipeline/install_procedure.md` | Phase D |
| Pipeline readme | `~/Claude/Projects/MU/Instagram Reels/pipeline/README.md` | Two-pass classification, verification, sandbox ceiling |

Do not copy anything else from those files onto the site. `ORBIT.md` in
particular holds personal state and is not a source for this page.
