import Link from "next/link";
import { about } from "@/data/about";
import { getFeaturedProjects } from "@/data/queries";
import { Fill } from "@/components/ui/Placeholder";

/**
 * PHASE 1/2 homepage — content-first, zero motion, zero 3D.
 * Phase 5 adds the boot sequence and staged hero reveal.
 * Phase 9 adds the 3D core BEHIND this content, never in front of it.
 */
export default function HomePage() {
  const featured = getFeaturedProjects();

  return (
    <>
      <section className="section" aria-labelledby="hero-heading">
        <div className="container-lab">
          <p className="label mb-6">SYSTEM STATUS: ONLINE</p>

          <h1
            id="hero-heading"
            className="max-w-[18ch] text-[length:var(--text-4xl)] leading-[var(--leading-tight)]"
          >
            {about.heroHeadline}
          </h1>

          <p className="mt-6 max-w-[46ch] text-[length:var(--text-lg)] text-text-muted">
            {about.heroSubline}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/work"
              className="rounded-sm border border-accent px-6 py-3 font-mono text-xs uppercase tracking-widest text-accent transition-colors duration-200 hover:bg-accent hover:text-bg"
            >
              Explore Work
            </Link>
            <Link
              href="/about"
              className="rounded-sm border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors duration-200 hover:border-border-strong hover:text-text"
            >
              Who is Aditya
            </Link>
          </div>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="work-heading">
        <div className="container-lab">
          <p className="label mb-4">01 — WORK</p>
          <h2 id="work-heading" className="text-[length:var(--text-2xl)]">
            Selected projects
          </h2>

          <ul className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project) => (
              <li key={project.slug} className="bg-surface">
                <Link
                  href={`/work/${project.slug}`}
                  className="group flex h-full flex-col justify-between gap-8 p-6 transition-colors hover:bg-surface-raised"
                >
                  <div>
                    <p className="label">PROJECT_{project.id}</p>
                    <h3 className="mt-3 text-[length:var(--text-xl)]">
                      <Fill value={project.title} />
                    </h3>
                    {project.subtitle && (
                      <p className="mt-1 text-sm text-text-muted">{project.subtitle}</p>
                    )}
                    <p className="mt-4 text-sm text-text-muted">
                      <Fill value={project.summary} />
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
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

      <section className="section border-t border-border" aria-labelledby="contact-heading">
        <div className="container-lab">
          <h2 id="contact-heading" className="text-[length:var(--text-3xl)]">
            Let&rsquo;s build something.
          </h2>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-sm border border-accent px-6 py-3 font-mono text-xs uppercase tracking-widest text-accent transition-colors duration-200 hover:bg-accent hover:text-bg"
          >
            Start a conversation
          </Link>
        </div>
      </section>
    </>
  );
}
