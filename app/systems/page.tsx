import type { Metadata } from "next";
import { Suspense } from "react";
import { RevealText } from "@/components/effects/RevealText";
import Link from "next/link";
import { StatusChip } from "@/components/experiments/StatusChip";
import { AgentPipeline } from "@/components/systems/AgentPipeline";
import { AutomationEngine } from "@/components/systems/AutomationEngine";
import { NeuralCore } from "@/components/systems/NeuralCore";
import { StrategyWall } from "@/components/systems/StrategyWall";
import { WorkflowDiagram } from "@/components/systems/WorkflowDiagram";
import { Fill } from "@/components/ui/Placeholder";
import { getAllWorkflows } from "@/data/workflowQueries";
import { workflowsIntro } from "@/data/workflows";

export const metadata: Metadata = {
  title: "Systems",
  description: "Interactive diagrams of how Aditya actually works — automation, strategy and capability, grounded in real projects.",
  alternates: { canonical: "/systems" },
};

export default function SystemsPage() {
  return (
    <>
      <section className="section">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">01 — SYSTEMS</p>
            <h1 className="text-[length:var(--text-3xl)]">How the work actually runs.</h1>
            <p className="prose-lab mt-6 max-w-[68ch] text-[length:var(--text-lg)] text-text-muted">
              Not a portfolio describing capability — a set of live diagrams demonstrating it, each one
              grounded in a real project rather than a generic template.
            </p>
          </RevealText>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="automation-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">02 — AUTOMATION</p>
            <h2 id="automation-heading" className="text-[length:var(--text-2xl)]">
              Automation Engine
            </h2>
          </RevealText>
          <RevealText className="mt-8">
            <AutomationEngine />
          </RevealText>
          <RevealText className="mt-16">
            <h3 className="text-[length:var(--text-xl)]">Agent Pipeline</h3>
          </RevealText>
          <RevealText className="mt-8">
            <AgentPipeline />
          </RevealText>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="workflows-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">03 — WORKFLOWS</p>
            <p id="workflows-heading" className="prose-lab text-[length:var(--text-lg)] text-text-muted">
              <Fill value={workflowsIntro} />
            </p>
          </RevealText>

          {getAllWorkflows().map((w) => (
            <article key={w.slug} className="mt-16" aria-labelledby={`workflow-${w.slug}`}>
              <RevealText>
                <div className="flex flex-wrap items-center gap-4">
                  <p className="label">WORKFLOW_{w.id}</p>
                  <StatusChip status={w.status} />
                </div>
                <h2 id={`workflow-${w.slug}`} className="mt-4 text-[length:var(--text-2xl)]">
                  <Fill value={w.title} />
                </h2>
                {w.subtitle && (
                  <p className="mt-2 text-[length:var(--text-lg)] text-text-muted">{w.subtitle}</p>
                )}
                <p className="prose-lab mt-6 text-[length:var(--text-lg)] text-text-muted">
                  <Fill value={w.summary} />
                </p>
              </RevealText>
              <div className="mt-8">
                <WorkflowDiagram workflow={w} />
              </div>
              <Link
                href={`/systems/${w.slug}`}
                className="label mt-6 inline-flex min-h-11 items-center gap-2 text-accent transition-colors duration-[var(--duration-fast)] hover:text-accent-dim"
              >
                READ THE WRITE-UP: {w.title} →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="strategy-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">04 — STRATEGY</p>
            <h2 id="strategy-heading" className="text-[length:var(--text-2xl)]">
              Strategy Wall
            </h2>
          </RevealText>
          <RevealText className="mt-8">
            <StrategyWall />
          </RevealText>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="neural-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">05 — CAPABILITY</p>
            <h2 id="neural-heading" className="text-[length:var(--text-2xl)]">
              Neural Core
            </h2>
          </RevealText>
          <RevealText className="mt-8">
            {/* NeuralCore reads `?capability=` via useSearchParams, which Next
                requires to be wrapped in Suspense so the rest of the (static)
                page isn't forced into fully dynamic rendering. */}
            <Suspense fallback={null}>
              <NeuralCore />
            </Suspense>
          </RevealText>
        </div>
      </section>
    </>
  );
}
