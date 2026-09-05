"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { education } from "@/data/education";
import { experience } from "@/data/experience";
import { timelineIcons } from "@/components/icons/TimelineIcons";
import { Fill } from "@/components/ui/Placeholder";
import { cn } from "@/lib/utils/cn";
import type { Highlight } from "@/data/schema";

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
  highlights: Highlight[];
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
    highlights: job.highlights,
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
    highlights: entry.highlights,
  }));

  // Oldest first — a milestone map reads left-to-right as forward progress in time.
  return [...work, ...school].sort((a, b) => sortKey(a.start).localeCompare(sortKey(b.start)));
}

function anchorId(entry: Entry): string {
  return `${entry.kind === "work" ? "experience" : "education"}-${entry.id}`;
}

/**
 * The panel content — highlight stats first (the "KPI cards", real figures
 * restructured from the entry's own bullets/note, never new information),
 * then the full bullets for a work entry.
 */
function Panel({ entry }: { entry: Entry }) {
  return (
    <div className="pt-3">
      {entry.highlights.length > 0 && (
        <div className="rounded-sm border border-border-strong bg-surface">
          {entry.highlights.map((h, i) => (
            <div
              key={i}
              className={cn(
                "flex items-baseline justify-between gap-3 px-3 py-2",
                i > 0 && "border-t border-border",
              )}
            >
              <span className="font-mono text-sm font-semibold text-accent">{h.value}</span>
              <span className="max-w-[60%] text-right text-[11px] leading-snug text-text-faint">
                <Fill value={h.label} />
              </span>
            </div>
          ))}
        </div>
      )}
      {entry.kind === "work" && entry.bullets.length > 0 && (
        <ul className="prose-lab mt-3 space-y-2 text-left text-xs text-text-muted">
          {entry.bullets.map((bullet, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent">—</span>
              <Fill value={bullet} />
            </li>
          ))}
        </ul>
      )}
      {entry.kind === "education" && entry.note && !entry.highlights.length && (
        <p className="prose-lab mt-3 text-left text-xs text-text-muted">{entry.note}</p>
      )}
    </div>
  );
}

/**
 * The milestone timeline (design spec revision, 2026-09-05) — a real
 * chronological rail, not a list. One set of dot+details elements per
 * entry: below `md` the outer container is a plain flex column (each
 * `display:contents` group contributes its dot then its details straight
 * into that column — the dot is hidden there, since the summary is already
 * the fully accessible trigger), and at `md`+ the same container becomes a
 * CSS Grid with an `auto`-sized up/down row on either side of a fixed dot
 * row — expanding a KPI panel simply grows its own grid track, so it can
 * never collide with the spine regardless of content length. An earlier
 * draft rendered two fully separate copies (one per breakpoint) instead,
 * which put duplicate ids and duplicate text in the DOM at once — invalid
 * HTML, and it broke anchor links and locator-based tests alike.
 *
 * One entry's panel open at a time; every panel is a native <details>, so
 * every figure is reachable with JavaScript off.
 */
export function MilestoneTimeline() {
  const entries = buildEntries();
  const [active, setActive] = useState<number | null>(null);
  const refs = useRef<Array<HTMLDetailsElement | null>>([]);

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (el && el.open !== (active === i)) el.open = active === i;
    });
  }, [active]);

  const handleToggle = useCallback((index: number, open: boolean) => {
    // Functional updater: a click on dot A can programmatically close
    // details B via the effect above, which fires B's own native `toggle`
    // event — reading the latest `current` (not a stale closure) is what
    // makes that echo a no-op instead of clobbering the just-opened A.
    setActive((current) => (open ? index : current === index ? null : current));
  }, []);

  return (
    <div className="relative mt-16">
      <div
        className="flex flex-col md:grid md:items-stretch"
        style={{ gridTemplateColumns: `repeat(${entries.length}, minmax(0,1fr))`, gridTemplateRows: "auto 28px auto" }}
      >
        <div
          aria-hidden="true"
          className="hidden h-0.5 md:block md:self-center md:bg-gradient-to-r md:from-border md:via-border-strong md:to-accent-dim"
          style={{ gridRow: 2, gridColumn: `1 / -1` }}
        />

        {entries.map((entry, i) => {
          const up = i % 2 === 0;
          const Icon = timelineIcons[entry.kind === "work" ? "WORK" : "EDUCATION"];
          const isOpen = active === i;
          const isNow = !entry.end;
          return (
            <div key={entry.id} className="contents">
              <button
                type="button"
                aria-label={`${entry.title} details`}
                data-testid={`timeline-dot-${i}`}
                onClick={() => setActive((current) => (current === i ? null : i))}
                className="relative z-[1] hidden h-5 w-5 items-center justify-center md:flex md:justify-self-center md:self-center"
                style={{ gridRow: 2, gridColumn: i + 1 }}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full border-2 transition-all duration-[var(--duration-fast)]",
                    isOpen || isNow
                      ? "border-accent bg-accent shadow-[0_0_0_4px_rgba(182,255,74,0.16)]"
                      : "border-text-faint bg-bg",
                  )}
                />
              </button>

              <details
                ref={(el) => {
                  refs.current[i] = el;
                }}
                data-testid={`timeline-entry-${i}`}
                id={anchorId(entry)}
                onToggle={(e) => handleToggle(i, e.currentTarget.open)}
                className={cn(
                  "scroll-mt-24 border-b border-border py-5 text-left last:border-b-0",
                  "md:border-none md:px-2 md:py-0 md:text-center",
                  up ? "md:self-end md:pb-6" : "md:self-start md:pt-6",
                )}
                style={{ gridRow: up ? 1 : 3, gridColumn: i + 1 }}
              >
                <summary className="cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="label block">{formatRange(entry.start, entry.end)}</span>
                  <span
                    className={cn(
                      "mt-1 block font-mono text-sm font-semibold md:text-xs",
                      isNow ? "text-accent" : "text-text",
                    )}
                  >
                    {entry.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-sm text-text-muted md:justify-center md:text-[11px]">
                    <Icon className="h-4 w-4 shrink-0 text-text-faint md:h-3.5 md:w-3.5" />
                    {entry.subtitle}
                  </span>
                </summary>
                <Panel entry={entry} />
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
