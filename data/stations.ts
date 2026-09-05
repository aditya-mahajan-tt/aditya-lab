export type StationId =
  | "workstation"
  | "neural-core"
  | "automation-engine"
  | "strategy-wall"
  | "experiment-table"
  | "communication-terminal";

export type Station = {
  id: StationId;
  /** Position around the ring, 0-5, in visit order (PLAN.md Phase 13). */
  order: number;
  label: string;
  route: string;
  description: string;
  /** True once the station has its own 3D object — PLAN.md/objects/stations. */
  built: boolean;
};

/**
 * The six Lab stations (PLAN.md Phase 13), each already reachable as a
 * normal route (CLAUDE.md §3.5) — this data only adds the 3D layer's spatial
 * arrangement and copy on top of pages that work without it.
 */
export const stations: Station[] = [
  {
    id: "workstation",
    order: 0,
    label: "Workstation",
    route: "/build",
    description: "The stack, architecture and decisions behind this site — Build Mode.",
    built: true,
  },
  {
    id: "neural-core",
    order: 1,
    label: "Neural Core",
    route: "/systems",
    description: "The capability graph — AI, product, automation and strategy, linked to real projects.",
    built: false,
  },
  {
    id: "automation-engine",
    order: 2,
    label: "Automation Engine",
    route: "/systems",
    description: "Input → data → enrich → AI → decision → automation → output, animated end to end.",
    built: false,
  },
  {
    id: "strategy-wall",
    order: 3,
    label: "Strategy Wall",
    route: "/systems",
    description: "Segmentation, GTM, positioning and customer-journey work laid out visually.",
    built: false,
  },
  {
    id: "experiment-table",
    order: 4,
    label: "Experiment Table",
    route: "/experiments",
    description: "What's being built and broken right now, including the honest failures.",
    built: false,
  },
  {
    id: "communication-terminal",
    order: 5,
    label: "Communication Terminal",
    route: "/contact",
    description: "Where a visitor starts a conversation.",
    built: false,
  },
];
