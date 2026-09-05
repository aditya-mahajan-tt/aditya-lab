import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllExperiments, getExperiment } from "@/data/queries";
import { Fill } from "@/components/ui/Placeholder";
import { StatusChip } from "@/components/experiments/StatusChip";
import { ExperimentDemo } from "@/components/experiments/ExperimentDemo";
import { RevealText } from "@/components/effects/RevealText";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllExperiments().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const experiment = getExperiment(slug);
  if (!experiment) return {};
  return {
    title: experiment.title,
    description: experiment.summary,
    alternates: { canonical: `/experiments/${experiment.slug}` },
  };
}

export default async function ExperimentPage({ params }: Params) {
  const { slug } = await params;
  const experiment = getExperiment(slug);
  if (!experiment) notFound();

  const sections = [
    { label: "HYPOTHESIS", body: experiment.hypothesis },
    { label: "BUILD", body: experiment.build },
    { label: "RESULT", body: experiment.result },
    { label: "LEARNING", body: experiment.learning },
  ];

  return (
    <article className="section">
      <div className="container-lab">
        <div className="flex items-center gap-4">
          <p className="label">EXPERIMENT_{experiment.id}</p>
          <StatusChip status={experiment.status} />
        </div>

        <h1 className="mt-4 text-[length:var(--text-3xl)]">
          <Fill value={experiment.title} />
        </h1>
        <p className="prose-lab mt-6 text-[length:var(--text-lg)] text-text-muted">
          <Fill value={experiment.summary} />
        </p>

        <div className="mt-14 space-y-12">
          {sections.map((section) => (
            <RevealText key={section.label}>
              <section aria-labelledby={`e-${section.label}`}>
                <p className="label mb-3">{section.label}</p>
                <h2 id={`e-${section.label}`} className="sr-only">
                  {section.label}
                </h2>
                <div className="prose-lab text-[length:var(--text-lg)] text-text-muted">
                  <Fill value={section.body} as="p" />
                </div>
              </section>
            </RevealText>
          ))}
        </div>

        <ExperimentDemo experiment={experiment} />
      </div>
    </article>
  );
}
