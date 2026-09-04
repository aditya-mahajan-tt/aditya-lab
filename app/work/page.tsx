import type { Metadata } from "next";
import Link from "next/link";
import { getAllProjects } from "@/data/queries";
import { Fill } from "@/components/ui/Placeholder";

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

        <ul className="mt-14 divide-y divide-border border-y border-border">
          {projects.map((project) => (
            <li key={project.slug}>
              <Link
                href={`/work/${project.slug}`}
                className="group flex flex-col gap-4 py-8 transition-colors hover:bg-surface md:flex-row md:items-baseline md:gap-10"
              >
                <span className="label md:w-28 md:shrink-0">PROJECT_{project.id}</span>

                <div className="flex-1">
                  <h2 className="text-[length:var(--text-xl)]">
                    <Fill value={project.title} />
                    {project.subtitle && (
                      <span className="text-text-muted"> — {project.subtitle}</span>
                    )}
                  </h2>
                  <p className="prose-lab mt-2 text-sm text-text-muted">
                    <Fill value={project.summary} />
                  </p>
                  <p className="label mt-3">{project.category.join(" / ")}</p>
                </div>

                <div className="flex items-center gap-6 md:flex-col md:items-end md:gap-2">
                  <span className="label">{project.status}</span>
                  <span className="font-mono text-xs uppercase tracking-widest text-accent">
                    Explore →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
