import type { Metadata } from "next";
import { getAllExperiments } from "@/data/queries";
import { RevealText } from "@/components/effects/RevealText";
import { StatusFilter } from "@/components/experiments/StatusFilter";

export const metadata: Metadata = {
  title: "Experiments",
  description: "Things being built, tested, broken and learned from.",
  alternates: { canonical: "/experiments" },
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

        <StatusFilter experiments={experiments} />
      </div>
    </section>
  );
}
