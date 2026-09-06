import Link from "next/link";
import { site } from "@/data/site";
import { filled } from "@/components/ui/Placeholder";
import { QualityControl } from "@/components/ui/QualityControl";
import { SoundControl } from "@/components/ui/SoundControl";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container-lab flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <p className="label">ADITYA LAB — BUILD · EXPERIMENT · ITERATE</p>
          <QualityControl />
          <SoundControl />
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {site.social.filter((s) => filled(s.url)).map((s) => (
            <li key={s.label}>
              <Link
                href={s.url}
                className="flex min-h-11 items-center font-mono text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-accent"
              >
                {s.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/contact"
              className="flex min-h-11 items-center font-mono text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-accent"
            >
              Contact
            </Link>
          </li>
        </ul>
      </div>

      <p className="container-lab pb-6 font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-text-muted">
        You scrolled to the bottom. Curiosity noted — try ⌘K.
      </p>
    </footer>
  );
}
