import type { Metadata } from "next";
import { about } from "@/data/about";
import { skillGroups } from "@/data/skills";
import type { SkillGroup } from "@/data/schema";
import { Fill } from "@/components/ui/Placeholder";
import { RevealText } from "@/components/effects/RevealText";
import { IdentityMap } from "@/components/about/IdentityMap";
import { MilestoneTimeline } from "@/components/about/MilestoneTimeline";
import { capabilityIcons } from "@/components/icons/CapabilityIcons";

export const metadata: Metadata = {
  title: "About",
  description: "Who Aditya is, how he got here, and what he can actually do.",
  alternates: { canonical: "/about" },
};

type SkillDepthValue = SkillGroup["items"][number]["depth"];

/** data/skills.ts's SkillDepth has two real-world values today (`comfortable`,
 * `working knowledge` — `strong` is unused). Visual weight only, never the
 * printed word (design spec §3.5) — but see the sr-only span below, since
 * color alone isn't a valid signal per DESIGN_SYSTEM.md's contrast rules. */
const depthWeight: Record<SkillDepthValue, string> = {
  comfortable: "text-text",
  "working knowledge": "text-text-muted",
  strong: "text-text",
};

export default function AboutPage() {
  return (
    <>
      <section className="section">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">IDENTITY</p>
            <h1 className="text-[length:var(--text-3xl)]">Who is Aditya?</h1>
            <p className="prose-lab mt-4 max-w-[62ch] text-[length:var(--text-lg)] text-text-muted">
              <Fill value={about.shortBio} />
            </p>
          </RevealText>

          <RevealText className="mt-10">
            {/*
              IdentityMap renders each stage as an <h3> — without an <h2>
              between this section's <h1> and those <h3>s, the heading order
              skips a level. sr-only, since the visual design has no heading
              here; matches the pattern used for "problems-heading" below.
            */}
            <h2 className="sr-only">Identity progression</h2>
            <IdentityMap />
          </RevealText>

          <RevealText className="mt-10">
            <details>
              <summary className="label inline-flex min-h-11 cursor-pointer items-center text-accent marker:hidden [&::-webkit-details-marker]:hidden">
                Read the longer version →
              </summary>
              <div className="prose-lab mt-6 max-w-[68ch] text-text-muted">
                <Fill value={about.longBio} as="p" />
              </div>
            </details>
          </RevealText>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="timeline-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">TIMELINE</p>
            <h2 id="timeline-heading" className="text-[length:var(--text-2xl)]">
              Where the work — and the learning — happened
            </h2>
          </RevealText>

          <RevealText className="mt-12">
            <MilestoneTimeline />
          </RevealText>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="skills-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">CAPABILITIES</p>
            <h2 id="skills-heading" className="text-[length:var(--text-2xl)]">
              What I can actually do
            </h2>
          </RevealText>

          <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {skillGroups.map((group) => {
              const Icon = capabilityIcons[group.id];
              return (
                <section key={group.id} className="bg-surface p-6" aria-labelledby={`sg-${group.id}`}>
                  <Icon className="h-6 w-6 text-accent" />
                  <h3 id={`sg-${group.id}`} className="mt-3 font-mono text-sm uppercase tracking-widest text-accent">
                    {group.id}
                  </h3>
                  <p className="mt-3 text-sm text-text-muted">
                    <Fill value={group.description} />
                  </p>
                  <ul className="mt-5 space-y-2">
                    {group.items.map((item) => (
                      <li key={item.name} className={`text-sm ${depthWeight[item.depth]}`}>
                        {item.name}
                        <span className="sr-only"> — {item.depth}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section border-t border-border" aria-labelledby="problems-heading">
        <div className="container-lab">
          <RevealText>
            <p className="label mb-4">PROBLEMS I ENJOY</p>
            <h2 id="problems-heading" className="sr-only">
              Problems I enjoy
            </h2>
            <div className="prose-lab text-[length:var(--text-lg)] text-text-muted">
              <Fill value={about.problemsIEnjoy} as="p" />
            </div>
          </RevealText>
        </div>
      </section>
    </>
  );
}
