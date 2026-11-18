"use client";

import Link from "next/link";
import { about } from "@/data/about";
import { site } from "@/data/site";
import { CoreStage } from "@/components/hero/CoreStage";
import { OrbitalBodyList } from "@/components/hero/OrbitalBodyList";
import { ScrambleText } from "@/components/effects/ScrambleText";
import { MagneticLink } from "@/components/effects/MagneticButton";
import { analytics } from "@/lib/analytics/events";
import { getHeroBodies } from "@/data/queries";
import { TourTrigger } from "@/components/tour/TourTrigger";

/**
 * PLAN.md Phase 5/6. The headline is immediately visible (it's the LCP
 * candidate); the subline, CTAs and core visual stage in after it via the
 * `.hero-reveal` keyframes in globals.css. "Enter the Lab" is one of the
 * four magnetic elements sitewide (Phase 6). Client component specifically
 * so the CTAs can fire hero_cta_click (QA_AND_PERFORMANCE.md §8) — a
 * Server Component can't pass an onClick to a Client Component child.
 */
export function Hero() {
  return (
    <section className="section" aria-labelledby="hero-heading">
      <div className="container-lab grid items-center gap-16 md:grid-cols-2">
        <div>
          <p className="label mb-6">
            SYSTEM STATUS: <ScrambleText text="ONLINE" />
          </p>

          {/* Name first: a visitor (and a search engine) must know whose lab this is before the tagline. */}
          <h1 id="hero-heading" className="text-[length:var(--text-2xl)] leading-[var(--leading-tight)]">
            {site.author}
          </h1>
          <p className="label mt-3 text-text-muted">{about.heroRole}</p>

          <p className="mt-8 max-w-[22ch] text-[length:var(--text-2xl)] leading-[var(--leading-tight)] md:text-[length:var(--text-3xl)]">
            {about.heroHeadline}
          </p>

          <p
            className="hero-reveal mt-6 max-w-[46ch] text-[length:var(--text-lg)] text-text-muted"
            style={{ animationDelay: "150ms" }}
          >
            {about.heroSubline}
          </p>

          <div className="hero-reveal mt-10 flex flex-wrap gap-4" style={{ animationDelay: "300ms" }}>
            <MagneticLink
              href="#lab"
              data-cursor="interact"
              onClick={() => analytics.heroCtaClick("enter_lab")}
              className="inline-flex min-h-11 items-center rounded-sm border border-accent px-6 py-3 font-mono text-xs uppercase tracking-widest text-accent transition-colors duration-[var(--duration-fast)] hover:bg-accent hover:text-bg"
            >
              Enter the Lab
            </MagneticLink>
            <Link
              href="/projects"
              data-cursor="interact"
              onClick={() => analytics.heroCtaClick("explore_work")}
              className="inline-flex min-h-11 items-center rounded-sm border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors duration-[var(--duration-fast)] hover:border-border-strong hover:text-text"
            >
              Explore Projects
            </Link>
            <TourTrigger />
          </div>
        </div>

        <div className="hero-reveal" style={{ animationDelay: "450ms" }}>
          <OrbitalBodyList bodies={getHeroBodies()} />
          <CoreStage />
        </div>
      </div>
    </section>
  );
}
