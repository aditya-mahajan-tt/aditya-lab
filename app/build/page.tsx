import type { Metadata } from "next";
import { buildMode } from "@/data/build";
import { Fill } from "@/components/ui/Placeholder";
import { RevealText } from "@/components/effects/RevealText";
import { StackList } from "@/components/build/StackList";
import { BuildModeIndicator } from "@/components/build/BuildModeIndicator";
import { SystemDiagramCard } from "@/components/systems/SystemDiagramCard";

export const metadata: Metadata = {
  title: "Build Mode",
  description: "The stack, the architecture and the decisions behind ADITYA LAB — this website is also a project.",
  alternates: { canonical: "/build" },
};

export default function BuildPage() {
  return (
    <>
      <section className="section">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">BUILD MODE</p>
            <h1 className="text-[length:var(--text-3xl)]">This website is also a project.</h1>
            <div className="prose-lab mt-6 max-w-[68ch] text-[length:var(--text-lg)] text-text-muted">
              <Fill value={buildMode.why} as="p" />
            </div>
          </RevealText>
          <RevealText className="mt-8">
            <BuildModeIndicator />
          </RevealText>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="stack-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">STACK</p>
            <h2 id="stack-heading" className="text-[length:var(--text-2xl)]">
              What it&rsquo;s built with
            </h2>
          </RevealText>
          <RevealText className="mt-8">
            <StackList />
          </RevealText>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="architecture-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">ARCHITECTURE</p>
            <h2 id="architecture-heading" className="text-[length:var(--text-2xl)]">
              {buildMode.architecture.title}
            </h2>
          </RevealText>
          <RevealText className="mt-8">
            <SystemDiagramCard diagram={buildMode.architecture} />
          </RevealText>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="decisions-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">DECISIONS TAKEN</p>
            <h2 id="decisions-heading" className="text-[length:var(--text-2xl)]">
              Why it works this way
            </h2>
          </RevealText>

          <ol className="mt-12 divide-y divide-border border-y border-border">
            {buildMode.decisions.map((decision, i) => (
              <li key={decision.title}>
                <RevealText className="flex flex-col gap-2 py-6 md:flex-row md:gap-10">
                  <div className="flex items-baseline gap-4 md:w-64 md:shrink-0">
                    <span className="label">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="font-mono text-sm uppercase tracking-widest text-text">{decision.title}</h3>
                  </div>
                  <div className="prose-lab text-text-muted">
                    <Fill value={decision.body} as="p" />
                  </div>
                </RevealText>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="broke-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">WHAT BROKE</p>
            <h2 id="broke-heading" className="text-[length:var(--text-2xl)]">
              Honestly
            </h2>
          </RevealText>
          <RevealText className="prose-lab mt-8 max-w-[68ch] space-y-3 text-text-muted">
            <ul className="space-y-3">
              {buildMode.whatBroke.map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="text-accent">—</span>
                  <Fill value={item} />
                </li>
              ))}
            </ul>
          </RevealText>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="learned-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">WHAT WAS LEARNED</p>
            <h2 id="learned-heading" className="sr-only">
              What was learned
            </h2>
            <div className="prose-lab text-[length:var(--text-lg)] text-text-muted">
              <Fill value={buildMode.whatLearned} as="p" />
            </div>
          </RevealText>
        </div>
      </section>
    </>
  );
}
