import Link from "next/link";
import { navigation } from "@/data/navigation";

/**
 * PHASE 1 placeholder header. Phase 3 replaces this with the real
 * header + menu overlay + command palette (PLAN.md Phase 3).
 * It is deliberately simple and fully keyboard-accessible already.
 */
export function Header() {
  return (
    <header className="sticky top-0 border-b border-border bg-bg/80 backdrop-blur-md" style={{ zIndex: 40 }}>
      <nav aria-label="Primary" className="container-lab flex items-center justify-between py-4">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-text transition-colors hover:text-accent"
        >
          Aditya Lab
        </Link>

        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {navigation
            .filter((item) => item.href !== "/")
            .map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-mono text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-text"
                >
                  {item.label}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </header>
  );
}
