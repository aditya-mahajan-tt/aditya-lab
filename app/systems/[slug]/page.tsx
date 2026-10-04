import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getAllWorkflows, getWorkflow } from "@/data/queries";
import { stripDraftMarker } from "@/data/schema";
import { Fill } from "@/components/ui/Placeholder";
import { RevealText } from "@/components/effects/RevealText";
import { StatusChip } from "@/components/experiments/StatusChip";
import { WorkflowDiagram } from "@/components/systems/WorkflowDiagram";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllWorkflows().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const w = getWorkflow(slug);
  if (!w) return {};
  return {
    title: w.title,
    description: stripDraftMarker(w.summary),
    alternates: { canonical: `/systems/${w.slug}` },
  };
}

function Section({ n, label, children }: { n: string; label: string; children: ReactNode }) {
  return (
    <section className="border-t border-border py-14" aria-labelledby={`s-${n}`}>
      <div className="container-lab">
        <RevealText>
          <p className="label mb-4">
            {n} — {label}
          </p>
          <h2 id={`s-${n}`} className="sr-only">
            {label}
          </h2>
        </RevealText>
        {children}
      </div>
    </section>
  );
}

export default async function WorkflowPage({ params }: Params) {
  const { slug } = await params;
  const w = getWorkflow(slug);
  if (!w) notFound();

  const runsOn = w.integrations.find((i) => i.access === "runs on");

  return (
    <article>
      <header className="section">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">
              WORKFLOW_{w.id} · {w.year}
            </p>
            <h1 className="text-[length:var(--text-3xl)]">
              <Fill value={w.title} />
            </h1>
            {w.subtitle && (
              <p className="mt-2 text-[length:var(--text-lg)] text-text-muted">{w.subtitle}</p>
            )}
            <p className="prose-lab mt-8 text-[length:var(--text-lg)]">
              <Fill value={w.summary} />
            </p>
            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4">
              <div>
                <dt className="label">Status</dt>
                <dd className="mt-1">
                  <StatusChip status={w.status} />
                </dd>
              </div>
              {runsOn && (
                <div>
                  <dt className="label">Runs on</dt>
                  <dd className="mt-1 font-mono text-sm">{runsOn.name}</dd>
                </div>
              )}
            </dl>
          </RevealText>
        </div>
      </header>

      <Section n="01" label="WHY">
        <RevealText>
          <p className="prose-lab text-[length:var(--text-lg)] text-text-muted">
            <Fill value={w.why} />
          </p>
        </RevealText>
      </Section>

      <Section n="02" label="THE FLOW">
        <div className="mt-2">
          <WorkflowDiagram workflow={w} />
        </div>
      </Section>

      <Section n="03" label="CHECKS">
        <RevealText>
          <dl className="divide-y divide-border">
            {w.checks.map((c) => (
              <div key={c.rule} className="grid gap-2 py-4 md:grid-cols-[16rem_1fr] md:gap-8">
                <dt className="font-mono text-sm uppercase tracking-[0.08em] text-text">{c.rule}</dt>
                <dd className="prose-lab text-text-muted">
                  <Fill value={c.prevents} />
                </dd>
              </div>
            ))}
          </dl>
        </RevealText>
      </Section>

      <Section n="04" label="INTEGRATIONS">
        <RevealText>
          <ul className="divide-y divide-border">
            {w.integrations.map((i) => (
              <li key={i.name} className="grid gap-2 py-4 md:grid-cols-[16rem_9rem_1fr] md:gap-8">
                <span className="text-text">{i.name}</span>
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-text-faint">
                  {i.access}
                </span>
                <span className="prose-lab text-text-muted">
                  <Fill value={i.note} />
                </span>
              </li>
            ))}
          </ul>
        </RevealText>
      </Section>

      <Section n="05" label="PRINCIPLES">
        <RevealText>
          <ul className="space-y-6">
            {w.principles.map((p) => (
              <li key={p.title}>
                <h3 className="font-mono text-sm uppercase tracking-[0.08em] text-text">{p.title}</h3>
                <p className="prose-lab mt-2 text-text-muted">
                  <Fill value={p.body} />
                </p>
              </li>
            ))}
          </ul>
        </RevealText>
      </Section>

      <Section n="06" label="LIMITS">
        <RevealText>
          <ul className="prose-lab space-y-4 text-[length:var(--text-lg)] text-text-muted">
            {w.limits.map((l, i) => (
              <li key={i} className="flex gap-4">
                <span className="text-accent">—</span>
                <Fill value={l} />
              </li>
            ))}
          </ul>
        </RevealText>
      </Section>

      {w.reflection && (
        <Section n="07" label="REFLECTION">
          <RevealText>
            <p className="prose-lab text-[length:var(--text-lg)] text-text-muted">{w.reflection}</p>
          </RevealText>
        </Section>
      )}

      <nav aria-label="Workflow navigation" className="border-t border-border py-10">
        <div className="container-lab">
          <Link href="/systems" className="label flex min-h-11 items-center hover:text-accent">
            ← All systems
          </Link>
        </div>
      </nav>
    </article>
  );
}
