import type { Metadata } from "next";
import { RevealText } from "@/components/effects/RevealText";
import { LabLog } from "@/components/log/LabLog";

export const metadata: Metadata = {
  title: "Lab Log",
  description: "A reverse-chronological record of what's been built, tried, and learned — written as it happens.",
  alternates: { canonical: "/log" },
};

export default function LogPage() {
  return (
    <section className="section">
      <div className="container-lab">
        <RevealText>
          <p className="label mb-4">LAB LOG</p>
          <h1 className="text-[length:var(--text-3xl)]">What&rsquo;s happening, as it happens.</h1>
          <p className="prose-lab mt-6 max-w-[68ch] text-[length:var(--text-lg)] text-text-muted">
            Every entry below is written by Aditya, not generated — a running record of builds,
            experiments, strategy work and what got learned along the way.
          </p>
        </RevealText>

        <RevealText className="mt-12">
          <LabLog />
        </RevealText>
      </div>
    </section>
  );
}
