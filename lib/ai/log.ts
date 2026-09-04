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
}) {
  console.log(
    JSON.stringify({
      at: "ask_the_lab",
      question: entry.question,
      outcome: entry.outcome,
      latencyMs: entry.latencyMs,
      totalTokens: entry.totalTokens ?? 0,
    }),
  );
}
