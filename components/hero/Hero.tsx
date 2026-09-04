import Link from "next/link";
import { about } from "@/data/about";
import { CoreFallback } from "@/components/hero/CoreFallback";

/**
 * PLAN.md Phase 5. The headline is immediately visible (it's the LCP
 * candidate); the subline, CTAs and core visual stage in after it via the
 * `.hero-reveal` keyframes in globals.css.
 */
export function Hero() {
  return (
    <section className="section" aria-labelledby="hero-heading">
      <div className="container-lab grid items-center gap-16 md:grid-cols-2">
        <div>
          <p className="label mb-6">SYSTEM STATUS: ONLINE</p>

          <h1
            id="hero-heading"
            className="max-w-[18ch] text-[length:var(--text-4xl)] leading-[var(--leading-tight)]"
          >
            {about.heroHeadline}
          </h1>

          <p
            className="hero-reveal mt-6 max-w-[46ch] text-[length:var(--text-lg)] text-text-muted"
            style={{ animationDelay: "150ms" }}
          >
            {about.heroSubline}
          </p>

          <div className="hero-reveal mt-10 flex flex-wrap gap-4" style={{ animationDelay: "300ms" }}>
            <Link
              href="#lab"
              className="rounded-sm border border-accent px-6 py-3 font-mono text-xs uppercase tracking-widest text-accent transition-colors duration-[var(--duration-fast)] hover:bg-accent hover:text-bg"
            >
              Enter the Lab
            </Link>
            <Link
              href="/work"
              className="rounded-sm border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors duration-[var(--duration-fast)] hover:border-border-strong hover:text-text"
            >
              Explore Work
            </Link>
          </div>
        </div>

        <div className="hero-reveal" style={{ animationDelay: "450ms" }}>
          <CoreFallback />
        </div>
      </div>
    </section>
  );
}
