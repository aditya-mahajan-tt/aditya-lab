"use client";

import { useEffect, useRef } from "react";
import { useLabStore } from "@/lib/store";
import { useBodyScrollLock } from "@/lib/utils/useBodyScrollLock";
import { analytics } from "@/lib/analytics/events";
import { ChatWindow } from "./ChatWindow";

/**
 * "Ask the Lab" (PLAN.md Phase 10, AI_SPEC.md §6). Mounted once (in the
 * Header, alongside CommandPalette) and controlled entirely through
 * `useLabStore`'s `aiOpen` flag, so the command palette and the
 * contact-adjacent entry point can both open it without mounting their own
 * copy — same reasoning as CommandPalette's global ⌘K listener.
 *
 * Built on native <dialog> for the same reason as CommandPalette: it gets
 * a real focus trap, Escape-to-close and top-layer stacking for free.
 */
export function AskTheLab() {
  const open = useLabStore((s) => s.aiOpen);
  const setOpen = useLabStore((s) => s.setAiOpen);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      // Must run after showModal(), not in ChatWindow's own effect: React
      // commits child effects before parent effects, and showModal() itself
      // moves focus (to the dialog or its first autofocusable descendant),
      // so focusing the input any earlier gets silently overridden.
      inputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      setOpen(false);
      previouslyFocused.current?.focus();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [setOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          analytics.askLabOpen("header");
        }}
        aria-label="Open Ask the Lab"
        data-cursor="interact"
        className="flex h-11 items-center gap-1.5 rounded-sm border border-border px-3 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors duration-[var(--duration-fast)] hover:border-border-strong hover:text-text"
      >
        Ask the Lab
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Ask the Lab"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="m-0 h-full max-h-full w-full max-w-full border-none bg-transparent p-0 open:flex backdrop:bg-bg/80 backdrop:backdrop-blur-sm md:h-auto md:max-h-[80vh] md:open:mt-[8vh]"
      >
        <div className="mx-auto flex h-full w-full max-w-xl flex-col border border-border-strong bg-surface-raised md:h-[70vh] md:rounded-md">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="label">ASK THE LAB</p>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close Ask the Lab"
              data-cursor="interact"
              className="flex h-8 w-8 items-center justify-center text-text-faint transition-colors duration-[var(--duration-fast)] hover:text-text"
            >
              ✕
            </button>
          </div>

          <ChatWindow open={open} inputRef={inputRef} />
        </div>
      </dialog>
    </>
  );
}
