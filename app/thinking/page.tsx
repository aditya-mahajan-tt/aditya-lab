import type { Metadata } from "next";
import Link from "next/link";
import { thinking } from "@/data/thinking";
import { Fill } from "@/components/ui/Placeholder";
import { ThinkingFramework } from "@/components/thinking/ThinkingFramework";
import { RevealText } from "@/components/effects/RevealText";

export const metadata: Metadata = {
  title: "Thinking",
  description: "The framework Aditya uses to move from observation to iteration.",
  alternates: { canonical: "/thinking" },
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

        {thinking.principles.length > 0 && (
          <RevealText className="mt-16">
            <section aria-labelledby="principles">
              <p className="label mb-4">PRINCIPLES</p>
              <h2 id="principles" className="text-[length:var(--text-2xl)]">
                What I believe about systems.
              </h2>
              <ul className="mt-12 grid gap-10 md:grid-cols-2">
                {thinking.principles.map((principle) => (
                  <li key={principle.title} className="border-t border-border pt-6">
                    <h3 className="text-[length:var(--text-lg)]">{principle.title}</h3>
                    <p className="prose-lab mt-3 text-text-muted">{principle.body}</p>
                    {principle.evidence.length > 0 && (
                      <ul className="mt-4 flex flex-col gap-2">
                        {principle.evidence.map((e) => (
                          <li key={e.url}>
                            <Link href={e.url} className="label text-accent hover:underline">
                              {e.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </RevealText>
        )}
      </div>
    </section>
  );
}
