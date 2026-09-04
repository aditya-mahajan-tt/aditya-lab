import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/data/site";
import { Fill, filled } from "@/components/ui/Placeholder";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a conversation with Aditya.",
};

export default function ContactPage() {
  const links = [
    ...(filled(site.email) ? [{ label: "Email", url: `mailto:${site.email}` }] : []),
    ...site.social.filter((s) => filled(s.url)),
    { label: "Resume", url: "/resume" },
  ];

  return (
    <section className="section">
      <div className="container-lab">
        <p className="label mb-6">COMMUNICATION TERMINAL</p>
        <h1 className="text-[length:var(--text-4xl)] leading-[var(--leading-tight)]">
          Let&rsquo;s build something.
        </h1>

        {!filled(site.email) && (
          <p className="mt-8">
            <Fill value={site.email} />
          </p>
        )}

        <ul className="mt-14 divide-y divide-border border-y border-border">
          {links.map((link) => (
            <li key={link.label}>
              <Link
                href={link.url}
                className="flex items-center justify-between py-6 font-mono text-sm uppercase tracking-widest text-text-muted transition-colors hover:text-accent"
              >
                {link.label}
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
