import type { Metadata } from "next";
import { RevealText } from "@/components/effects/RevealText";
import { DraggableArtifact } from "@/components/easter-eggs/DraggableArtifact";

/**
 * PLAN.md Phase 15 — "hidden `/experiments/hidden` route." Deliberately
 * absent from data/navigation.ts and lib/search.ts's command index, so it
 * surfaces only via the Konami code toast or a visitor who guesses the URL.
 * `noindex` keeps it out of search results too — "hidden" means found by
 * curiosity, not by Google.
 */
export const metadata: Metadata = {
  title: "You Found It",
  description: "A hidden corner of the Lab.",
  robots: { index: false, follow: false },
};

export default function HiddenExperimentPage() {
  return (
    <section className="section">
      <div className="container-lab max-w-[var(--container-prose)]">
        <RevealText>
          <p className="label mb-4">UNLISTED — NOT IN THE MENU, NOT IN ⌘K</p>
          <h1 className="text-[length:var(--text-3xl)]">You found the hidden room.</h1>
          <p className="prose-lab mt-6 text-text-muted">
            Nobody points here. No link on the site leads to this page — you either typed the
            URL, or you know the Konami code. Either way: that curiosity is the whole point of
            this Lab.
          </p>
        </RevealText>

        <RevealText>
          <div className="mt-14">
            <p className="label mb-3">A PHYSICS OBJECT, JUST FOR THIS ROOM</p>
            <p className="prose-lab mb-6 text-sm text-text-muted">
              Drag it, throw it, watch it settle. It exists only here — nothing else on the site
              moves like this.
            </p>
            <DraggableArtifact />
          </div>
        </RevealText>
      </div>
    </section>
  );
}
