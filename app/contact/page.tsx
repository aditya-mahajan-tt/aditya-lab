import type { Metadata } from "next";
import { site } from "@/data/site";
import { Fill, filled } from "@/components/ui/Placeholder";
import { RevealText } from "@/components/effects/RevealText";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { AskTheLabStatic } from "@/components/ai/AskTheLabStatic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a conversation with Aditya.",
  alternates: { canonical: "/contact" },
};

/**
 * Maps a contact link's label to its analytics event (QA_AND_PERFORMANCE.md
 * §8) — plain data, not a callback, since this runs in a Server Component
 * and only serializable props can cross into <TrackedLink>.
 */
function trackingFor(label: string): { event: string; eventProps?: Record<string, string> } {
  switch (label) {
    case "Email":
      return { event: "contact_click", eventProps: { channel: "email" } };
    case "LinkedIn":
      return { event: "contact_click", eventProps: { channel: "linkedin" } };
    case "GitHub":
      return { event: "contact_click", eventProps: { channel: "github" } };
    case "Resume":
      return { event: "resume_click" };
    default:
      return { event: "contact_click" };
  }
}

export default function ContactPage() {
  const links = [
    ...(filled(site.email) ? [{ label: "Email", url: `mailto:${site.email}` }] : []),
    ...site.social.filter((s) => filled(s.url)),
    { label: "Resume", url: "/resume" },
  ];

  return (
    <section className="section">
      <div className="container-lab">
        <RevealText>
          <p className="label mb-6">COMMUNICATION TERMINAL</p>
          <h1 className="text-[length:var(--text-4xl)] leading-[var(--leading-tight)]">
            Let&rsquo;s build something.
          </h1>

          {!filled(site.email) && (
            <p className="mt-8">
              <Fill value={site.email} />
            </p>
          )}
        </RevealText>

        <ul className="mt-14 divide-y divide-border border-y border-border">
          {links.map((link) => (
            <li key={link.label}>
              <TrackedLink
                href={link.url}
                data-cursor={link.url.startsWith("/") ? "interact" : "open"}
                {...trackingFor(link.label)}
                className="flex items-center justify-between py-6 font-mono text-sm uppercase tracking-widest text-text-muted transition-colors hover:text-accent"
              >
                {link.label}
                <span aria-hidden="true">→</span>
              </TrackedLink>
            </li>
          ))}
        </ul>

        <AskTheLabStatic />
      </div>
    </section>
  );
}
