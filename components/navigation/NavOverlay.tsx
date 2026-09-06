"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/data/navigation";
import { useLabStore } from "@/lib/store";
import { useFocusTrap } from "@/lib/utils/useFocusTrap";
import { useBodyScrollLock } from "@/lib/utils/useBodyScrollLock";

/**
 * The expanded menu overlay (PLAN.md Phase 3). Built on native <details>/
 * <summary> rather than a JS-only toggle: with JavaScript disabled the
 * browser still opens it and every route link still works — see CLAUDE.md
 * §2/§3 progressive enhancement. With JavaScript, it gains a real focus
 * trap, Escape-to-close, body scroll lock, and stays in sync with the
 * command palette so the two overlays are never open together.
 */
export function NavOverlay() {
  const menuOpen = useLabStore((s) => s.menuOpen);
  const setMenuOpen = useLabStore((s) => s.setMenuOpen);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const panelId = useId();

  useBodyScrollLock(menuOpen);

  const panelRef = useFocusTrap<HTMLDivElement>({
    active: menuOpen,
    onEscape: () => {
      if (detailsRef.current) detailsRef.current.open = false;
    },
  });

  // The native element is the source of truth for "open" — mirror it into the store.
  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const handleToggle = () => setMenuOpen(el.open);
    el.addEventListener("toggle", handleToggle);
    return () => el.removeEventListener("toggle", handleToggle);
  }, [setMenuOpen]);

  // Reflect store changes back onto the element (e.g. opening the palette closes this).
  useEffect(() => {
    const el = detailsRef.current;
    if (el && el.open !== menuOpen) el.open = menuOpen;
  }, [menuOpen]);

  // Never let the overlay survive a route change.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  return (
    <details ref={detailsRef} className="group relative">
      <summary
        aria-controls={panelId}
        className="relative z-[var(--z-palette)] flex min-h-11 cursor-pointer list-none items-center rounded-sm border border-border px-3 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors duration-[var(--duration-fast)] marker:hidden hover:border-border-strong hover:text-text [&::-webkit-details-marker]:hidden"
      >
        <span className="group-open:hidden">Menu</span>
        <span className="hidden group-open:inline">Close</span>
      </summary>

      <div
        id={panelId}
        ref={panelRef}
        onClick={(e) => {
          if (e.target === e.currentTarget && detailsRef.current) detailsRef.current.open = false;
        }}
        className="fixed inset-0 z-[var(--z-overlay)] overflow-y-auto bg-bg/97 backdrop-blur-md"
      >
        <div className="container-lab flex min-h-full flex-col justify-start py-8 md:justify-center md:py-32">
          <p className="label mb-6 md:mb-10">SYSTEM · NAVIGATE</p>

          <nav aria-label="Full site">
            <ul className="flex flex-col">
              {navigation.map((item) => (
                <li key={item.href} className="border-b border-border first:border-t">
                  <Link
                    href={item.href}
                    className="flex min-h-11 flex-col justify-center gap-1 py-3 transition-colors duration-[var(--duration-fast)] hover:text-accent md:flex-row md:items-baseline md:justify-between md:gap-10 md:py-5"
                  >
                    <span className="font-mono text-[length:var(--text-2xl)] uppercase leading-none tracking-[var(--tracking-mono)] md:text-[length:var(--text-3xl)] md:leading-snug">
                      {item.label}
                    </span>
                    <span className="line-clamp-1 text-sm leading-snug text-text-faint md:line-clamp-none">
                      {item.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </details>
  );
}
