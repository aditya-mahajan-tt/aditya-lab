import Link from "next/link";
import { Fill } from "@/components/ui/Placeholder";
import type { TimelineEntry } from "@/data/schema";

/** "2026-09-04" -> "04 SEP 2026". */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const month = new Date(Number(y), Number(m) - 1).toLocaleString("en-US", { month: "short" });
  return `${d} ${month.toUpperCase()} ${y}`;
}

export function LogEntry({ entry }: { entry: TimelineEntry }) {
  return (
    <li className="flex flex-col gap-2 py-6 md:flex-row md:gap-10">
      <div className="flex items-baseline gap-4 md:w-56 md:shrink-0">
        <span className="label">{formatDate(entry.date)}</span>
        <span className="label text-text-faint">{entry.type}</span>
      </div>
      <div className="prose-lab text-text-muted">
        <Fill value={entry.body} as="p" />
        {entry.link && (
          <Link
            href={entry.link.url}
            className="label mt-2 inline-flex min-h-11 items-center text-accent transition-colors duration-[var(--duration-fast)] hover:text-accent-dim"
          >
            <Fill value={entry.link.label} /> →
          </Link>
        )}
      </div>
    </li>
  );
}
