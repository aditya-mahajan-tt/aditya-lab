import type { Metadata } from "next";
import { thinking } from "@/data/thinking";
import { Fill } from "@/components/ui/Placeholder";
import { ThinkingFramework } from "@/components/thinking/ThinkingFramework";
import { RevealText } from "@/components/effects/RevealText";

export const metadata: Metadata = {
  title: "Thinking",
  description: "The framework Aditya uses to move from observation to iteration.",
};

export default function ThinkingPage() {
  return (
    <section className="section">
      <div className="container-lab">
        <RevealText>
          <p className="label mb-4">STRATEGY WALL</p>
          <h1 className="text-[length:var(--text-3xl)]">{thinking.heading}</h1>
          <div className="prose-lab mt-6 text-[length:var(--text-lg)] text-text-muted">
            <Fill value={thinking.intro} as="p" />
          </div>
        </RevealText>

        <RevealText className="mt-16">
          <ThinkingFramework steps={thinking.steps} />
        </RevealText>

        {/* Phase 11 replaces this with an animated, interactive version. */}
        <ol className="mt-16 divide-y divide-border border-y border-border">
          {thinking.steps.map((step, i) => (
            <li key={step.label}>
              <RevealText className="flex flex-col gap-3 py-8 md:flex-row md:gap-10">
                <div className="flex items-baseline gap-4 md:w-56 md:shrink-0">
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

        <RevealText className="mt-16">
          <section aria-labelledby="worked-example">
            <p className="label mb-4">WORKED EXAMPLE</p>
            <h2 id="worked-example" className="sr-only">
              Worked example
            </h2>
            <div className="prose-lab text-[length:var(--text-lg)] text-text-muted">
              <Fill value={thinking.workedExample} as="p" />
            </div>
          </section>
        </RevealText>
      </div>
    </section>
  );
}
