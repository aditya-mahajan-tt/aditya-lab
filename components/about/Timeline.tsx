import { education } from "@/data/education";
import { experience } from "@/data/experience";
import { timelineIcons } from "@/components/icons/TimelineIcons";
import { Fill } from "@/components/ui/Placeholder";

/** "2018" -> "2018-01"; "2025-07" is untouched — a comparable sort key regardless of precision. */
function sortKey(date: string): string {
  return /^\d{4}$/.test(date) ? `${date}-01` : date;
}

/** "2025-07" -> "JUL 2025"; "2018" -> "2018" (year-only stays year-only). */
function formatDate(value: string): string {
  if (/^\d{4}$/.test(value)) return value;
  const [y, m] = value.split("-");
  const month = new Date(Number(y), Number(m) - 1).toLocaleString("en-US", { month: "short" });
  return `${month.toUpperCase()} ${y}`;
}

/** No end date reads as "PRESENT". */
function formatRange(start: string, end?: string): string {
  return `${formatDate(start)} — ${end ? formatDate(end) : "PRESENT"}`;
}

type Entry = {
  kind: "work" | "education";
  id: string;
  title: string;
  subtitle: string;
  location?: string;
  start: string;
  end?: string;
  bullets: string[];
  note?: string;
};

function buildEntries(): Entry[] {
  const work: Entry[] = experience.map((job) => ({
    kind: "work",
    id: job.id,
    title: job.company,
    subtitle: job.role,
    location: job.location,
    start: job.start,
    end: job.end,
    bullets: job.bullets,
  }));

  const school: Entry[] = education.map((entry) => ({
    kind: "education",
    id: entry.id,
    title: entry.institution,
    subtitle: entry.program,
    location: entry.location,
    start: entry.start,
    end: entry.end,
    bullets: [],
    note: entry.note,
  }));

  return [...work, ...school].sort((a, b) => sortKey(b.start).localeCompare(sortKey(a.start)));
}

/**
 * Design spec §3.4 — education + work merged into one reverse-chronological
 * list. A plain Server Component: expand/collapse is a native <details>, so
 * it needs zero client JavaScript.
 */
export function Timeline() {
  const entries = buildEntries();

  return (
    <ol className="divide-y divide-border border-y border-border">
      {entries.map((entry) => {
        const Icon = timelineIcons[entry.kind === "work" ? "WORK" : "EDUCATION"];
        return (
          <li
            key={entry.id}
            id={`${entry.kind === "work" ? "experience" : "education"}-${entry.id}`}
            className="scroll-mt-24"
          >
            <details className="group">
              <summary className="flex min-h-11 cursor-pointer list-none flex-col gap-2 py-6 marker:hidden md:flex-row md:items-baseline md:justify-between md:gap-10 [&::-webkit-details-marker]:hidden">
                <span className="flex items-baseline gap-4">
                  <Icon className="h-5 w-5 shrink-0 text-accent" />
                  <span>
                    <span className="block font-mono text-sm uppercase tracking-widest text-text">
                      {entry.title}
                    </span>
                    <span className="mt-1 block text-text-muted">{entry.subtitle}</span>
                  </span>
                </span>
                <span className="label shrink-0">
                  {formatRange(entry.start, entry.end)}
                  {entry.location ? ` · ${entry.location}` : ""}
                </span>
              </summary>

              {entry.kind === "work" ? (
                <ul className="prose-lab mt-2 space-y-3 pb-6 pl-9 text-text-muted">
                  {entry.bullets.map((bullet, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="text-accent">—</span>
                      <Fill value={bullet} />
                    </li>
                  ))}
                </ul>
              ) : entry.note ? (
                <p className="prose-lab mt-2 pb-6 pl-9 text-text-muted">{entry.note}</p>
              ) : null}
            </details>
          </li>
        );
      })}
    </ol>
  );
}
