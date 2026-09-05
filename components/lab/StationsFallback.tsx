import Link from "next/link";
import { stations } from "@/data/stations";

/**
 * The Lab environment's accessible route (CLAUDE.md §3.5 / PLAN.md Phase
 * 13's "every station also reachable as a normal route"). The 3D ring is
 * `aria-hidden` and has no keyboard path through it, so this plain list is
 * not a loading-state stand-in — it stays visible and in the tab order
 * regardless of whether the 3D layer ever mounts.
 */
export function StationsFallback() {
  return (
    <ul className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {stations.map((station) => (
        <li key={station.id} className="bg-surface p-5">
          <Link href={station.route} data-cursor="interact" className="group block">
            <p className="label text-text-faint">
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
