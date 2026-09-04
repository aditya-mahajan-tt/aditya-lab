import type { Experiment } from "@/data/schema";

/**
 * Status is conveyed by TEXT first, colour second.
 * Never colour alone — see QA_AND_PERFORMANCE.md §5.
 */
const colour: Record<Experiment["status"], string> = {
  IDEA: "text-text-faint border-text-faint",
  PROTOTYPE: "text-building border-building",
  BUILDING: "text-building border-building",
  WORKING: "text-accent border-accent",
  LIVE: "text-live border-live",
  ARCHIVED: "text-archived border-archived",
  FAILED: "text-failed border-failed",
};

export function StatusChip({ status }: { status: Experiment["status"] }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-sm border px-2 py-0.5 font-mono text-xs uppercase tracking-widest ${colour[status]}`}
    >
      {status}
    </span>
  );
}
