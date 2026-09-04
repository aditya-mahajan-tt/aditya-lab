import Link from "next/link";
import { site } from "@/data/site";
import { filled } from "@/components/ui/Placeholder";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container-lab flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between">
        <p className="label">ADITYA LAB — BUILD · EXPERIMENT · ITERATE</p>

        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {site.social.filter((s) => filled(s.url)).map((s) => (
            <li key={s.label}>
              <Link
                href={s.url}
                className="font-mono text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-accent"
              >
                {s.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/contact"
              className="font-mono text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-accent"
            >
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
