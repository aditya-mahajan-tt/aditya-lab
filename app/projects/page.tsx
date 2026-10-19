import type { Metadata } from "next";
import { getAllProjects } from "@/data/queries";
import { getAllWorkflows } from "@/data/workflowQueries";
import type { PlaneValue } from "@/data/schema";
import { ProjectArchive } from "@/components/projects/ProjectArchive";
import { projectToArchiveItem, type ArchiveItem } from "@/components/projects/archiveItem";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things built and shipped, and case studies across strategy, product, AI and automation.",
  alternates: { canonical: "/projects" },
};

// Title-case to match the existing project categories, so the filter chips merge.
const PLANE_CATEGORY: Record<PlaneValue, string> = { ai: "AI", product: "Product", business: "Business" };

export default function ProjectsPage() {
  const projects = getAllProjects().filter((p) => p.kind !== "work");
  const mezzala = projects.find((p) => p.slug === "mezzala");

  // Workflows already have a full page at /systems/[slug]. Show each as a row
  // linking there, built here (server) so data/workflows.ts stays out of the
  // client bundle. Sorted just after Mezzala.
  const workflowItems: ArchiveItem[] = getAllWorkflows().map((w) => ({
    slug: w.slug,
    label: `WORKFLOW_${w.id}`,
    href: `/systems/${w.slug}`,
    title: w.title,
    subtitle: w.subtitle,
    summary: w.summary,
    category: w.planes.map((plane) => PLANE_CATEGORY[plane]),
    status: w.status,
    kind: "built",
    order: (mezzala?.order ?? 0) + 0.5,
  }));

  const items = [...projects.map(projectToArchiveItem), ...workflowItems];

  return (
    <section className="section">
      <div className="container-lab">
        <p className="label mb-4">PROJECT ARCHIVE</p>
        <h1 className="text-[length:var(--text-3xl)]">Projects</h1>
        <p className="prose-lab mt-6 text-text-muted">
          Things I built and shipped, and case studies from competitions, coursework and live
          challenges: what happened, why it mattered, and what came of it.
        </p>

        <ProjectArchive items={items} />
      </div>
    </section>
  );
}
