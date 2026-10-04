import { z } from "zod";
import { WorkflowSchema } from "./workflowSchema";

/**
 * Workflows: systems Aditya runs for himself, shown as flowcharts.
 *
 * Narrative fields below were drafted on 2026-10-04 from ORBIT's own rule
 * files and the Reels pipeline procedures (see the spec's appendix) and
 * were reviewed and approved by Aditya on 2026-10-04. Node labels and details
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
      "A personal operating system built on scheduled agent runs. It proposes one commitment a day, caps active projects at three, and turns saved Reels about AI tools into a verified, security-scanned shortlist, with a human approval gate before anything is installed.",

    why: "Two problems had the same shape. Too many projects were open at once, and every new tracker became one more thing to maintain. Separately, a growing list of saved Reels recommended AI tools with no way of telling which claims were real. ORBIT treats both as an operations problem: one state file, a small set of rules, and agents that do the reading and checking so that the only thing left for a person is the decision.",

    principles: [
      {
        title: "One state file",
        body: "The system writes to exactly one file. The dashboard is a view of it and a queue of taps, never a second record to reconcile.",
      },
      {
        title: "Read sources where they live",
        body: "Calendar, mail, git history and project files are read in place. Nothing is copied into a new tracker.",
      },
      {
        title: "Friction, not control",
        body: "The system can ask, flag and escalate. Only Aditya changes a project's state, and he can override any rule as long as the override is logged with a review date.",
      },
      {
        title: "A claim is not a fact",
        body: "A Reel naming a tool is treated as a claim. Nothing is recommended until an independent record confirms it exists and what it is.",
      },
      {
        title: "The finder never installs",
        body: "The run that discovers a tool cannot install it, and the run that installs cannot choose what to install. A person sits between the two.",
      },
      {
        title: "Hold and explain",
        body: "A failed check stops the flow and says why in plain language. It is never a silent skip and never a silent pass.",
      },
      {
        title: "Evidence, not scores",
        body: "Reviews count what happened and cite dated evidence. There are no ratings and no rankings.",
      },
    ],

    checks: [
      { rule: "Chat wins over taps", prevents: "A stale tap on the dashboard overwriting something already agreed in conversation." },
      { rule: "Deadlines outrank projects", prevents: "A project commitment being proposed on a day when a real deadline falls inside 48 hours." },
      { rule: "Escalate by count", prevents: "A commitment being quietly rescheduled forever. The second slip is named; the third stops rescheduling until a decision is made." },
      { rule: "Three active projects", prevents: "The active set growing silently. A fourth needs a trade or a logged override." },
      { rule: "No reply, no invention", prevents: "A review filling in answers that were never given. It records what it observed and marks the rest as unanswered." },
      { rule: "Read-only on project repos", prevents: "A scheduled run committing, staging or leaving a lock behind in a working repository." },
      { rule: "Nothing new, nothing done", prevents: "Unchanged data being reprocessed for no reason." },
      { rule: "Verify before recommending", prevents: "A tool being shortlisted on the strength of a caption alone." },
      { rule: "Disambiguate by data", prevents: "The wrong project being picked when several share a name. A real trade-off goes to Aditya instead of being guessed." },
      { rule: "Sweep never installs", prevents: "Discovery and installation happening in one unattended step." },
      { rule: "Scan before copy", prevents: "Unreviewed code reaching the machine. A flagged candidate is held with an explanation." },
      { rule: "Sandbox only", prevents: "A trial tool reaching global configuration. Only the skill folder is copied, its scripts are never run, and the source and commit are recorded." },
      { rule: "Unreachable means stop", prevents: "A run guessing at data when the laptop or browser cannot be reached." },
    ],

    integrations: [
      { name: "Claude scheduled tasks", access: "runs on", note: "Five scheduled agent runs: morning, evening, weekly, the sweep and the installer." },
      { name: "Google Calendar", access: "reads", note: "Deadlines and sessions for the next 48 hours." },
      { name: "Gmail", access: "reads", note: "Programme mail, for deadlines that never reach the calendar." },
      { name: "GitHub", access: "reads", note: "The repository list, to detect new projects, and public repository records, to verify tools." },
      { name: "Local git and project files", access: "reads", note: "What actually moved in each active project." },
      { name: "Instagram saved collection", access: "reads", note: "The raw input for the Reels sweep, read through Aditya's own browser session." },
      { name: "SQLite", access: "reads + writes", note: "The local database behind the Reels pipeline." },
      { name: "Command Centre", access: "reads + writes", note: "One dashboard: a snapshot to read, and a queue of taps to act on." },
      { name: "Sandbox folder", access: "writes", note: "Where approved tools are installed for trial, with their provenance." },
    ],

    limits: [
      "It depends on one laptop being awake with the desktop app open. When the laptop is unreachable, scheduled runs pause.",
      "It cannot see browser, phone or app time, by design. Anything about those comes only from what Aditya reports.",
      "Reels are judged on their captions. There is no transcript of the video.",
      "Automation stops at the sandbox. Moving a tool into everyday use is a manual step.",
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
        summary: "Each scheduled run applies what was tapped on the dashboard, reads the real sources, and proposes one commitment for the day. The evening run checks it against evidence, and a slip escalates by count." },
      { id: "B", label: "PROJECT INTAKE", lane: "orbit", row: 10,
        summary: "Nothing new becomes a project by default. A new repository or idea answers six questions, and with three projects already active it waits in the inbox unless something is traded out or an override is logged." },
      { id: "C", label: "REELS SWEEP", lane: "reels", row: 1,
        summary: "Every three days a run reads the saved collection, classifies what is new, and checks every named tool against independent records. It produces a shortlist and never installs anything." },
      { id: "D", label: "APPROVED INSTALL", lane: "reels", row: 10,
        summary: "A separate hourly run turns approvals into installs. Each candidate is scanned first; a flagged one is held and explained, and anything installed goes into a sandbox with its provenance recorded." },
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

/**
 * Intro copy for the Workflows section on /systems (spec 7.1). Draft: Aditya
 * reviews it with the rest.
 */
export const workflowsIntro =
  "The diagrams above show the shape work takes. This one is a system that runs: scheduled agents, real integrations, and the checks that decide what they are allowed to do.";
