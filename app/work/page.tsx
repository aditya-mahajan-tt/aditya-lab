import type { Metadata } from "next";
import { getAllProjects } from "@/data/queries";
import { ProjectArchive } from "@/components/projects/ProjectArchive";

export const metadata: Metadata = {
  title: "Work",
  description: "Case studies across strategy, product, AI and automation.",
};

export default function WorkPage() {
  const projects = getAllProjects();

  return (
    <section className="section">
      <div className="container-lab">
        <p className="label mb-4">PROJECT ARCHIVE</p>
        <h1 className="text-[length:var(--text-3xl)]">Work</h1>
        <p className="prose-lab mt-6 text-text-muted">
          Projects presented as artifacts: what happened, why it mattered, and what came of it.
        </p>

        <ProjectArchive projects={projects} />
      </div>
    </section>
  );
}
