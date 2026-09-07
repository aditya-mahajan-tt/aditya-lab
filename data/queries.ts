import { projects } from "./projects";
import { experiments } from "./experiments";
import { skillGroups } from "./skills";
import { experience } from "./experience";
import { stripDraftMarker, type Experiment, type PlaneValue, type Project } from "./schema";

/** The orbital hero's two ring depths (spec §3.2). */
export type HeroRing = "inner" | "outer";

/** One body on the orbital hero — a real, navigable thing, never decoration. */
export type HeroBody = {
  id: string;
  label: string;
  detail: string;
  ring: HeroRing;
  planes: PlaneValue[];
  href: string;
};

/** Fixed left-to-right / tab order for the three planes. */
export const HERO_PLANES: PlaneValue[] = ["ai", "product", "business"];

/* ------------------------------------------------------------- projects */

export const getAllProjects = (): Project[] =>
  [...projects].sort((a, b) => a.order - b.order);

export const getFeaturedProjects = (): Project[] =>
  getAllProjects().filter((p) => p.featured);

export const getProject = (slug: string): Project | undefined =>
  projects.find((p) => p.slug === slug);

export const getProjectCategories = (): string[] =>
  [...new Set(projects.flatMap((p) => p.category))].sort();

export const getProjectsByCategory = (category: string): Project[] =>
  getAllProjects().filter((p) => p.category.includes(category));

/** Previous/next for case-study navigation. Wraps around. */
export const getProjectNeighbours = (slug: string) => {
  const all = getAllProjects();
  const i = all.findIndex((p) => p.slug === slug);
  if (i === -1) return { previous: undefined, next: undefined };
  return {
    previous: all[(i - 1 + all.length) % all.length],
    next: all[(i + 1) % all.length],
  };
};

/* ---------------------------------------------------------- experiments */

export const getAllExperiments = (): Experiment[] =>
  [...experiments].sort((a, b) => a.order - b.order);

export const getExperiment = (slug: string): Experiment | undefined =>
  experiments.find((e) => e.slug === slug);

export const getExperimentsByStatus = (status: Experiment["status"]): Experiment[] =>
  getAllExperiments().filter((e) => e.status === status);

/* ------------------------------------------------------------- hero */

/**
 * Every body the orbital hero renders, across both rings, from all three
 * sources spec §3.2/§6 requires — projects.ts and experiments.ts alone
 * would leave the AI plane almost empty; Turbotork (the only selected
 * experience.ts entry, via its optional `planes` field) is what gives it
 * real weight. Order is stable (insertion order of the source arrays) so
 * every consumer lays bodies out identically without re-sorting.
 */
export const getHeroBodies = (): HeroBody[] => {
  const inner: HeroBody[] = skillGroups.map((group) => ({
    id: `skill-${group.id}`,
    label: group.id,
    detail: stripDraftMarker(group.description),
    ring: "inner",
    planes: group.planes,
    href: "/systems#neural-heading",
  }));

  const outerProjects: HeroBody[] = projects.map((project) => ({
    id: `project-${project.id}`,
    label: project.title,
    detail: project.summary,
    ring: "outer",
    planes: project.planes,
    href: `/work/${project.slug}`,
  }));

  const outerExperiments: HeroBody[] = experiments.map((experiment) => ({
    id: `experiment-${experiment.id}`,
    label: experiment.title,
    detail: experiment.summary,
    ring: "outer",
    planes: experiment.planes,
    href: `/experiments/${experiment.slug}`,
  }));

  const outerExperience: HeroBody[] = experience
    .filter((entry): entry is typeof entry & { planes: PlaneValue[] } => Boolean(entry.planes?.length))
    .map((entry) => ({
      id: `experience-${entry.id}`,
      label: entry.company,
      detail: entry.role,
      ring: "outer",
      planes: entry.planes,
      href: `/about#experience-${entry.id}`,
    }));

  return [...inner, ...outerProjects, ...outerExperiments, ...outerExperience];
};
