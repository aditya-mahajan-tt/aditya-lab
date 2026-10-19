import type { Metadata } from "next";
import Link from "next/link";
import { experience } from "@/data/experience";
import { getProject, projectHref } from "@/data/queries";
import { formatRange } from "@/lib/utils/formatDate";

export const metadata: Metadata = {
  title: "Work",
  description: "Where I have worked and what I owned there.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  // Newest first. Entries flagged onWork: false stay on the About timeline only.
  const jobs = experience.filter((job) => job.onWork).sort((a, b) => b.start.localeCompare(a.start));

  return (
    <section className="section">
      <div className="container-lab">
        <p className="label mb-4">EXPERIENCE</p>
        <h1 className="text-[length:var(--text-3xl)]">Work</h1>
        <p className="prose-lab mt-6 text-text-muted">
          Where I have worked and what I owned there. Things I built on my own, and case studies from
          competitions and coursework, are under{" "}
          <Link href="/projects" className="text-text underline underline-offset-4 hover:text-accent">
            Projects
          </Link>
          .
        </p>

        <ul className="mt-12 divide-y divide-border border-y border-border">
          {jobs.map((job) => {
            const caseStudy = getProject(job.id);
            return (
              <li key={job.id} className="py-10">
                <article aria-labelledby={`job-${job.id}`}>
                  <p className="label">{formatRange(job.start, job.end)}</p>
                  <h2 id={`job-${job.id}`} className="mt-3 text-[length:var(--text-xl)]">
                    {job.company}
                  </h2>
                  <p className="mt-1 text-text-muted">
                    {job.role}
                    {job.location && ` · ${job.location}`}
                  </p>

                  {job.highlights.length > 0 && (
                    <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
                      {job.highlights.map((h) => (
                        <div key={h.label}>
                          <dt className="font-mono text-[length:var(--text-lg)] text-accent">{h.value}</dt>
                          <dd className="mt-1 max-w-[16rem] text-sm text-text-muted">{h.label}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <ul className="prose-lab mt-6 space-y-3 text-text-muted">
                    {job.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-4">
                        <span className="text-accent" aria-hidden="true">
                          —
                        </span>
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  {job.tools.length > 0 && (
                    <p className="label mt-6">Tools: {job.tools.join(" · ")}</p>
                  )}

                  {caseStudy && caseStudy.kind === "work" && (
                    <Link
                      href={projectHref(caseStudy)}
                      data-cursor="view"
                      className="mt-6 inline-flex min-h-11 items-center rounded-sm border border-accent px-4 font-mono text-xs uppercase tracking-widest text-accent hover:bg-accent hover:text-bg"
                    >
                      Read the case study →
                    </Link>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
