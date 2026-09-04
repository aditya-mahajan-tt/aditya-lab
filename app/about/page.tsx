import type { Metadata } from "next";
import { about } from "@/data/about";
import { skillGroups } from "@/data/skills";
import { experience } from "@/data/experience";
import { Fill } from "@/components/ui/Placeholder";
import { RevealText } from "@/components/effects/RevealText";

/** "2025-07" -> "JUL 2025". No end date reads as "PRESENT". */
function formatRange(start: string, end?: string): string {
  const fmt = (ym: string) => {
    const [y, m] = ym.split("-");
    const month = new Date(Number(y), Number(m) - 1).toLocaleString("en-US", { month: "short" });
    return `${month.toUpperCase()} ${y}`;
  };
  return `${fmt(start)} — ${end ? fmt(end) : "PRESENT"}`;
}

export const metadata: Metadata = {
  title: "About",
  description: "Who Aditya is, how he got here, and what he can actually do.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="section">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">IDENTITY</p>
            <h1 className="text-[length:var(--text-3xl)]">Who is Aditya?</h1>
          </RevealText>

          <ol className="mt-12 divide-y divide-border border-y border-border">
            {about.progression.map((step, i) => (
              <li key={step.label}>
                <RevealText className="flex flex-col gap-2 py-6 md:flex-row md:gap-10">
                  <div className="flex items-baseline gap-4 md:w-64 md:shrink-0">
                    <span className="label">{String(i + 1).padStart(2, "0")}</span>
                    <h2 className="font-mono text-sm uppercase tracking-widest text-text">
                      {step.label}
                    </h2>
                  </div>
                  <div className="prose-lab text-text-muted">
                    <Fill value={step.body} as="p" />
                  </div>
                </RevealText>
              </li>
            ))}
          </ol>

          <RevealText className="prose-lab mt-14 space-y-6 text-[length:var(--text-lg)] text-text-muted">
            <Fill value={about.shortBio} as="p" />
            <Fill value={about.longBio} as="p" />
          </RevealText>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="experience-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">EXPERIENCE</p>
            <h2 id="experience-heading" className="text-[length:var(--text-2xl)]">
              Where the work happened
            </h2>
          </RevealText>

          <ol className="mt-12 divide-y divide-border border-y border-border">
            {experience.map((job) => (
              <li key={job.id} id={`experience-${job.id}`} className="scroll-mt-24">
                <RevealText className="py-8">
                  <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                    <div>
                      <h3 className="font-mono text-sm uppercase tracking-widest text-text">
                        {job.company}
                      </h3>
                      <p className="mt-1 text-text-muted">{job.role}</p>
                    </div>
                    <p className="label shrink-0">
                      {formatRange(job.start, job.end)}
                      {job.location ? ` · ${job.location}` : ""}
                    </p>
                  </div>
                  <ul className="prose-lab mt-6 space-y-3 text-text-muted">
                    {job.bullets.map((bullet, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="text-accent">—</span>
                        <Fill value={bullet} />
                      </li>
                    ))}
                  </ul>
                  {job.tools.length > 0 && (
                    <p className="label mt-6">{job.tools.join(" · ")}</p>
                  )}
                </RevealText>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="skills-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">CAPABILITIES</p>
            <h2 id="skills-heading" className="text-[length:var(--text-2xl)]">
              What I can actually do
            </h2>
          </RevealText>

          <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {skillGroups.map((group) => (
              <section key={group.id} className="bg-surface p-6" aria-labelledby={`sg-${group.id}`}>
                <h3 id={`sg-${group.id}`} className="font-mono text-sm uppercase tracking-widest text-accent">
                  {group.id}
                </h3>
                <p className="mt-3 text-sm text-text-muted">
                  <Fill value={group.description} />
                </p>
                <ul className="mt-5 space-y-2">
                  {group.items.map((item) => (
                    <li key={item.name} className="flex items-baseline justify-between gap-4">
                      <span className="text-sm">{item.name}</span>
                      <span className="label shrink-0">{item.depth}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="problems-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">PROBLEMS I ENJOY</p>
            <h2 id="problems-heading" className="sr-only">
              Problems I enjoy
            </h2>
            <div className="prose-lab text-[length:var(--text-lg)] text-text-muted">
              <Fill value={about.problemsIEnjoy} as="p" />
            </div>
          </RevealText>
        </div>
      </section>
    </>
  );
}
