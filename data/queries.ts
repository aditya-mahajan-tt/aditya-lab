import { projects } from "./projects";
import { experience } from "./experience";
import { experiments } from "./experiments";
import { skillGroups } from "./skills";
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

/** The one place a project URL is built: roles live under /work, everything else under /projects. */
export const projectHref = (p: Pick<Project, "kind" | "slug">): string =>
  p.kind === "work" ? `/work/${p.slug}` : `/projects/${p.slug}`;

export const getProject = (slug: string): Project | undefined =>
  projects.find((p) => p.slug === slug);

export const getProjectCategories = (): string[] =>
  [...new Set(projects.flatMap((p) => p.category))].sort();

export const getProjectsByCategory = (category: string): Project[] =>
  getAllProjects().filter((p) => p.category.includes(category));

/** Previous/next for case-study navigation. Wraps within the same section (work vs projects). */
export const getProjectNeighbours = (slug: string) => {
  const current = getProject(slug);
  if (!current) return { previous: undefined, next: undefined };
  const all = getAllProjects().filter((p) => (p.kind === "work") === (current.kind === "work"));
  const i = all.findIndex((p) => p.slug === slug);
  return {
    previous: all[(i - 1 + all.length) % all.length],
    next: all[(i + 1) % all.length],
  };
};

/** Experience entries shown on /work, newest first. */
export const getWorkEntries = () =>
  experience.filter((job) => job.onWork).sort((a, b) => b.start.localeCompare(a.start));

/** A job's case study when one exists, else its anchor on /work. */
export const workHref = (job: { id: string }): string => {
  const p = getProject(job.id);
  return p?.kind === "work" ? projectHref(p) : `/work#job-${job.id}`;
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
 * sources spec §3.2/§6 requires. Turbotork carried the AI plane via a
 * hardcoded experience-entry special case until 2026-09-19; it is now an
 * ordinary project (data/projects.ts) and needs none. Order is stable
 * (insertion order of the source arrays) so every consumer lays bodies out
 * identically without re-sorting.
 */
export const getHeroBodies = (): HeroBody[] => {
  const inner: HeroBody[] = skillGroups.map((group) => ({
    id: `skill-${group.id}`,
    label: group.id,
    detail: stripDraftMarker(group.description),
    ring: "inner",
    planes: group.planes,
    // Each of the 5 capability nodes routes to its own pre-selected group in
    // the Neural Core rather than all 5 landing on the same anchor with
    // whichever group happens to be first (Diagnostic Report §03/§16): the
    // query param drives NeuralCore's initial `active` state.
    href: `/systems?capability=${group.id}#neural-heading`,
  }));

  const outerProjects: HeroBody[] = projects.map((project) => ({
    id: `project-${project.id}`,
    label: project.title,
    detail: project.summary,
    ring: "outer",
    planes: project.planes,
    href: projectHref(project),
  }));

  // Jobs with a case study already appear above as projects.
  const outerWork: HeroBody[] = getWorkEntries()
    .filter((job) => job.planes && getProject(job.id)?.kind !== "work")
    .map((job) => ({
      id: `work-${job.id}`,
      label: job.company.replace(/ \(.*/, ""),
      detail: job.highlights[0] ? `${job.highlights[0].value} ${job.highlights[0].label}` : (job.bullets[0] ?? ""),
      ring: "outer",
      planes: job.planes!,
      href: workHref(job),
    }));

  const outerExperiments: HeroBody[] = experiments.map((experiment) => ({
    id: `experiment-${experiment.id}`,
    label: experiment.title,
    detail: experiment.summary,
    ring: "outer",
    planes: experiment.planes,
    href: `/experiments/${experiment.slug}`,
  }));

  return [...inner, ...outerProjects, ...outerWork, ...outerExperiments];
};
