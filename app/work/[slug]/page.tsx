import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProjects, getProject, getProjectNeighbours } from "@/data/queries";
import { Fill, filled } from "@/components/ui/Placeholder";
import { RevealText } from "@/components/effects/RevealText";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return { title: project.title, description: project.summary };
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const { previous, next } = getProjectNeighbours(slug);

  /** The nine-section case study structure. Sections with no content are omitted. */
  const sections: Array<{ n: string; label: string; body?: string }> = [
    { n: "01", label: "CONTEXT", body: project.context },
    { n: "02", label: "PROBLEM", body: project.problem },
    { n: "03", label: "ROLE", body: project.role },
    { n: "04", label: "THINKING", body: project.thinking },
    { n: "05", label: "APPROACH", body: project.approach },
    { n: "06", label: "EXECUTION", body: project.execution },
    { n: "07", label: "OUTCOME", body: project.outcome },
    { n: "09", label: "REFLECTION", body: project.reflection },
  ];

  return (
    <article>
      <header className="section">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">PROJECT_{project.id} · {project.year}</p>
            <h1 className="text-[length:var(--text-3xl)]">
              <Fill value={project.title} />
            </h1>
            {project.subtitle && (
              <p className="mt-2 text-[length:var(--text-lg)] text-text-muted">{project.subtitle}</p>
            )}
            <p className="prose-lab mt-8 text-[length:var(--text-lg)]">
              <Fill value={project.summary} />
            </p>

            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4">
              <div>
                <dt className="label">Status</dt>
                <dd className="mt-1 font-mono text-sm">{project.status}</dd>
              </div>
              <div>
                <dt className="label">Categories</dt>
                <dd className="mt-1 font-mono text-sm">{project.category.join(" / ")}</dd>
              </div>
              {project.tools.length > 0 && (
                <div>
                  <dt className="label">Tools</dt>
                  <dd className="mt-1 font-mono text-sm">{project.tools.join(" · ")}</dd>
                </div>
              )}
            </dl>
          </RevealText>
        </div>
      </header>

      {project.process && project.process.length > 0 && (
        <section className="border-t border-border py-12" aria-label="Process">
          <div className="container-lab">
            <p className="label mb-6">PROCESS</p>
            {/* Phase 11 replaces this with the animated ProcessDiagram component. */}
            <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-widest">
              {project.process.map((step, i) => (
                <li key={step.label} className="flex items-center gap-3">
                  <span className="text-text">{step.label}</span>
                  {i < project.process!.length - 1 && <span className="text-text-faint">→</span>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {sections
        .filter((s) => s.body !== undefined)
        .map((section) => (
          <section key={section.n} className="border-t border-border py-14" aria-labelledby={`s-${section.n}`}>
            <div className="container-lab">
              <RevealText>
                <p className="label mb-4">
                  {section.n} — {section.label}
                </p>
                <h2 id={`s-${section.n}`} className="sr-only">
                  {section.label}
                </h2>
                <div className="prose-lab text-[length:var(--text-lg)] text-text-muted">
                  <Fill value={section.body!} as="p" />
                </div>
              </RevealText>
            </div>
          </section>
        ))}

      {project.learnings.length > 0 && (
        <section className="border-t border-border py-14" aria-labelledby="s-08">
          <div className="container-lab">
            <RevealText>
              <p className="label mb-4">08 — LEARNING</p>
              <h2 id="s-08" className="sr-only">
                Learning
              </h2>
              <ul className="prose-lab space-y-4 text-[length:var(--text-lg)] text-text-muted">
                {project.learnings.map((l, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="text-accent">—</span>
                    <Fill value={l} />
                  </li>
                ))}
              </ul>
            </RevealText>
          </div>
        </section>
      )}

      {project.links.filter((l) => filled(l.url)).length > 0 && (
        <section className="border-t border-border py-14">
          <div className="container-lab">
            <p className="label mb-4">ARTIFACTS</p>
            <ul className="flex flex-wrap gap-4">
              {project.links
                .filter((l) => filled(l.url))
                .map((l) => (
                  <li key={l.url}>
                    <Link
                      href={l.url}
                      data-cursor="open"
                      className="rounded-sm border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-text-muted hover:border-accent hover:text-accent"
                    >
                      {l.label} ↗
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </section>
      )}

      <nav aria-label="Project navigation" className="border-t border-border py-10">
        <div className="container-lab flex justify-between gap-6">
          {previous && (
            <Link href={`/work/${previous.slug}`} className="label hover:text-accent">
              ← Previous
            </Link>
          )}
          {next && (
            <Link href={`/work/${next.slug}`} className="label ml-auto hover:text-accent">
              Next →
            </Link>
          )}
        </div>
      </nav>
    </article>
  );
}
