import { projects } from "./projects";
import { experiments } from "./experiments";
import type { Experiment, Project } from "./schema";

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
