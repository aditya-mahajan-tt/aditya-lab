"use client";

/**
 * DESIGN_SYSTEM.md §6 reserves --z-toast for exactly this: a transient,
 * non-blocking system message. Auto-dismisses; never traps focus or
 * blocks the recruiter path underneath it.
 */
export function Toast({ message, href }: { message: string; href?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[var(--z-toast)] flex justify-center px-4"
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-sm border border-accent bg-surface-raised px-4 py-3 font-mono text-xs uppercase tracking-widest text-accent shadow-none">
        <span>{message}</span>
        {href && (
          <a href={href} className="underline underline-offset-2 hover:text-text" data-cursor="interact">
            OPEN
          </a>
        )}
      </div>
    </div>
  );
}
