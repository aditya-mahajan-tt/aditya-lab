import Link from "next/link";
import { about } from "@/data/about";
import { thinking } from "@/data/thinking";
import { getFeaturedProjects } from "@/data/queries";
import { Fill } from "@/components/ui/Placeholder";
import { Hero } from "@/components/hero/Hero";
import { BootSequence } from "@/components/hero/BootSequence";
import { LabEnvironmentStage } from "@/components/lab/LabEnvironmentStage";
import { RevealText } from "@/components/effects/RevealText";
import { MagneticLink } from "@/components/effects/MagneticButton";
import { ProjectCard } from "@/components/projects/ProjectCard";

/**
 * PLAN.md Phase 5. The homepage stands alone: hero, then a compressed
 * version of the whole site (work, thinking, about, contact) below the
 * fold — a visitor never has to leave "/" to get the gist of everything.
 */
export default function HomePage() {
  const featured = getFeaturedProjects();

  return (
    <>
      <BootSequence />
      <Hero />

      <div id="lab">
        <section className="border-t border-border" aria-labelledby="lab-env-heading">
          <LabEnvironmentStage />
        </section>

        <section className="section border-t border-border" aria-labelledby="work-heading">
          <div className="container-lab">
            <RevealText>
              <p className="label mb-4">01 — WORK</p>
              <h2 id="work-heading" className="text-[length:var(--text-2xl)]">
                Selected projects
              </h2>
            </RevealText>

            <ul className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((project) => (
                <li key={project.slug} className="bg-surface">
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section border-t border-border" aria-labelledby="thinking-heading">
          <div className="container-lab">
            <RevealText>
              <p className="label mb-4">02 — THINKING</p>
              <h2 id="thinking-heading" className="text-[length:var(--text-2xl)]">
                {thinking.heading}
              </h2>
              <p className="prose-lab mt-4 text-text-muted">
                <Fill value={thinking.intro} />
              </p>
              <Link
                href="/thinking"
                data-cursor="interact"
                className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-accent hover:underline"
              >
                See the framework →
              </Link>
            </RevealText>
          </div>
        </section>

        <section className="section border-t border-border" aria-labelledby="about-heading">
          <div className="container-lab">
            <RevealText>
              <p className="label mb-4">03 — ABOUT</p>
              <h2 id="about-heading" className="text-[length:var(--text-2xl)]">
                Who is Aditya
              </h2>
              <p className="prose-lab mt-4 text-text-muted">
                <Fill value={about.shortBio} />
              </p>
              <Link
                href="/about"
                data-cursor="interact"
                className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-accent hover:underline"
              >
                Full background →
              </Link>
            </RevealText>
          </div>
        </section>

        <section className="section border-t border-border" aria-labelledby="contact-heading">
          <div className="container-lab">
            <RevealText>
              <h2 id="contact-heading" className="text-[length:var(--text-3xl)]">
                Let&rsquo;s build something.
              </h2>
              <MagneticLink
                href="/contact"
                data-cursor="interact"
                className="mt-8 inline-block rounded-sm border border-accent px-6 py-3 font-mono text-xs uppercase tracking-widest text-accent transition-colors duration-[var(--duration-fast)] hover:bg-accent hover:text-bg"
              >
                Start a conversation
              </MagneticLink>
            </RevealText>
          </div>
        </section>
      </div>
    </>
  );
}
