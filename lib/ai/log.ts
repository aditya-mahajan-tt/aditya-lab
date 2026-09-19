/**
 * Anonymous instrumentation (AI_SPEC.md §8): question text, outcome,
 * latency, token cost — no IP, no fingerprint, no identifiers. Written as
 * a structured console line rather than to a new datastore (no database
 * dependency is approved in ARCHITECTURE.md §1); Vercel's function logs
 * are the store for now. Revisit with a real log sink if/when monthly
 * review of these becomes a regular workflow.
 */
export type AskOutcome = "answered" | "refused" | "blocked" | "cached" | "rate_limited" | "offline";

export function logQuestion(entry: {
  question: string;
  outcome: AskOutcome;
  latencyMs: number;
  totalTokens?: number;
  /** Which model answered, and which were skipped getting there. */
  model?: string;
  failedOver?: string[];
  /** Which corpus sections grounded this answer — the diagnostic for a retrieval miss. */
  sections?: string[];
}) {
  console.log(
    JSON.stringify({
      at: "ask_the_lab",
      question: entry.question,
      outcome: entry.outcome,
      latencyMs: entry.latencyMs,
      totalTokens: entry.totalTokens ?? 0,
      // Empty on the happy path. A field that starts filling up is the
      // signal that one model's per-minute budget is routinely exhausted.
      ...(entry.model ? { model: entry.model } : {}),
      ...(entry.failedOver?.length ? { failedOver: entry.failedOver } : {}),
      ...(entry.sections?.length ? { sections: entry.sections } : {}),
    }),
  );
}
