import Link from "next/link";
import { stations, type StationId } from "@/data/stations";

/**
 * The Lab environment's accessible route (CLAUDE.md §3.5 / PLAN.md Phase
 * 13's "every station also reachable as a normal route"). The 3D ring is
 * `aria-hidden` and has no keyboard path through it, so this plain list is
 * not a loading-state stand-in — it stays visible and in the tab order
 * regardless of whether the 3D layer ever mounts.
 *
 * `highlightedId` ties this list back to the 3D orbit: whichever station is
 * currently hovered or focused there gets a spotlight here too, so the
 * connection between "that thing in the ring" and "this card" is legible
 * even before a visitor commits to clicking.
 */
export function StationsFallback({ highlightedId = null }: { highlightedId?: StationId | null }) {
  return (
    <ul className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {stations.map((station) => (
        <li
          key={station.id}
          data-active={station.id === highlightedId}
          className="bg-surface p-5 transition-shadow duration-[var(--duration-medium)] ease-[var(--ease-out-lab)] data-[active=true]:shadow-[inset_0_0_0_1px_var(--color-accent),0_0_56px_-8px_var(--color-accent-glow)]"
        >
          <Link href={station.route} data-cursor="interact" className="group block">
            <p
              className={`label ${station.id === highlightedId ? "text-accent" : "text-text-faint"}`}
            >
              {String(station.order + 1).padStart(2, "0")} — {station.label}
            </p>
            <p className="mt-2 text-[length:var(--text-sm)] text-text-muted">{station.description}</p>
            <span className="mt-3 inline-block font-mono text-xs uppercase tracking-widest text-accent group-hover:underline">
              Open →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
