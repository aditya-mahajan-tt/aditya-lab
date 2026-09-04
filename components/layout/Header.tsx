"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLabStore } from "@/lib/store";
import { useHideOnScroll } from "@/lib/utils/useHideOnScroll";
import { NavOverlay } from "@/components/navigation/NavOverlay";
import { CommandPalette } from "@/components/navigation/CommandPalette";
import { AskTheLab } from "@/components/ai/AskTheLab";

/**
 * PLAN.md Phase 3. Wordmark, MENU (the full-screen overlay in NavOverlay)
 * and ⌘K (the CommandPalette) — hides on scroll down, reveals on scroll up.
 * Stays put while either overlay is open so the open trigger never scrolls
 * away from under the user.
 *
 * The blur backdrop lives on a decorative sibling, not on <header> itself,
 * and the hide/reveal animates `top` rather than `transform`: both
 * `backdrop-filter` and `transform` establish a new containing block for
 * `position: fixed` descendants, which would trap NavOverlay's full-screen
 * panel inside the header's own (short) box instead of the viewport.
 */
export function Header() {
  const menuOpen = useLabStore((s) => s.menuOpen);
  const commandPaletteOpen = useLabStore((s) => s.commandPaletteOpen);
  const hidden = useHideOnScroll(menuOpen || commandPaletteOpen);

  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeaderHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      style={{ top: hidden ? -headerHeight : 0 }}
      className="sticky z-[var(--z-header)] transition-[top] duration-[var(--duration-medium)] ease-[var(--ease-out-lab)]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 border-b border-border bg-bg/80 backdrop-blur-md"
      />

      <nav aria-label="Primary" className="container-lab relative flex items-center justify-between py-3">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-text transition-colors duration-[var(--duration-fast)] hover:text-accent"
        >
          Aditya Lab
        </Link>

        <div className="flex items-center gap-2">
          <AskTheLab />
          <NavOverlay />
          <CommandPalette />
        </div>
      </nav>
    </header>
  );
}
