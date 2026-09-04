import type { Metadata } from "next";
import Link from "next/link";
import { getAllExperiments } from "@/data/queries";
import { Fill } from "@/components/ui/Placeholder";
import { StatusChip } from "@/components/experiments/StatusChip";
import { RevealText } from "@/components/effects/RevealText";

export const metadata: Metadata = {
  title: "Experiments",
  description: "Things being built, tested, broken and learned from.",
};

export default function ExperimentsPage() {
  const experiments = getAllExperiments();

  return (
    <section className="section">
      <div className="container-lab">
        <RevealText>
          <p className="label mb-4">EXPERIMENT TABLE</p>
          <h1 className="text-[length:var(--text-3xl)]">Experiments</h1>
          <p className="prose-lab mt-6 text-text-muted">
            Things I&rsquo;m building, testing, breaking and learning from. Some of these failed.
            Those are the useful ones.
          </p>
        </RevealText>

        <ul className="mt-14 grid gap-px border border-border bg-border md:grid-cols-2">
          {experiments.map((experiment) => (
            <li key={experiment.slug} className="bg-surface">
              <Link
                href={`/experiments/${experiment.slug}`}
                data-cursor="view"
                className="flex h-full flex-col gap-6 p-6 transition-colors hover:bg-surface-raised"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="label">EXPERIMENT_{experiment.id}</span>
                  <StatusChip status={experiment.status} />
                </div>
                <div>
                  <h2 className="text-[length:var(--text-xl)]">
                    <Fill value={experiment.title} />
                  </h2>
                  <p className="mt-3 text-sm text-text-muted">
                    <Fill value={experiment.summary} />
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
