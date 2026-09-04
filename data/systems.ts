import { z } from "zod";
import { SystemDiagramSchema } from "./schema";

/**
 * Phase 11 interactive systems (ARCHITECTURE.md components/systems,
 * PLAN.md Phase 11). Node labels describe Aditya's actual working process
 * at a structural level — they are not narrative case-study prose, so they
 * don't duplicate the draft-marked, not-yet-reviewed prose in
 * data/projects.ts. Each diagram links to the real project it's grounded
 * in via `relatedProjectSlug`.
 */
const raw = [
  {
    id: "automation-engine",
    title: "AUTOMATION ENGINE",
    description: "The shape automation takes in Aditya's work — manual operations turned into a repeatable pipeline.",
    nodes: [
      { label: "INPUT", detail: "Manual operations — paper, spreadsheets, phone calls." },
      { label: "DATA", detail: "Digitized into one shared system of record." },
      { label: "ENRICH", detail: "Payments, compliance and communication wired in." },
      { label: "AI", detail: "Agent workflows layered onto already-structured data." },
      { label: "DECISION", detail: "Planning and execution overhead — the real bottleneck — gets automated." },
      { label: "OUTPUT", detail: "A team that runs on the system instead of around it." },
    ],
    // Turbotork is work experience, not a /work case study (see
    // data/experience.ts) — links to its section on /about instead.
    relatedLink: { label: "Turbotork", url: "/about#experience-turbotork" },
  },
  {
    id: "strategy-wall",
    title: "STRATEGY WALL",
    description: "The GTM framework behind Aditya's segmentation and positioning work.",
    nodes: [
      { label: "MARKET", detail: "Where demand is, and where it's moving." },
      { label: "SEGMENTATION", detail: "Group by behaviour, not by demographic." },
      { label: "ICP", detail: "Who the strategy is actually built for." },
      { label: "POSITIONING", detail: "The one claim a segment believes fastest." },
      { label: "CHANNEL", detail: "Where the ICP already pays attention." },
      { label: "GTM", detail: "Sequencing the above into a launch." },
    ],
    relatedProjectSlug: "gostops-gtm",
  },
];

export const systemDiagrams = z.array(SystemDiagramSchema).parse(raw);

export const getSystemDiagram = (id: string) => systemDiagrams.find((d) => d.id === id);
