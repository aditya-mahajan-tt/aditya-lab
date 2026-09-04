import type { Metadata } from "next";
import { RevealText } from "@/components/effects/RevealText";
import { AutomationEngine } from "@/components/systems/AutomationEngine";
import { NeuralCore } from "@/components/systems/NeuralCore";
import { StrategyWall } from "@/components/systems/StrategyWall";

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
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="strategy-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">03 — STRATEGY</p>
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
            <p className="label mb-4">04 — CAPABILITY</p>
            <h2 id="neural-heading" className="text-[length:var(--text-2xl)]">
              Neural Core
            </h2>
          </RevealText>
          <RevealText className="mt-8">
            <NeuralCore />
          </RevealText>
        </div>
      </section>
    </>
  );
}
