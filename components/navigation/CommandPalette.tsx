"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLabStore } from "@/lib/store";
import { useBodyScrollLock } from "@/lib/utils/useBodyScrollLock";
import { searchCommands, ASK_THE_LAB_COMMAND_HREF, type CommandItem } from "@/lib/search";
import { cn } from "@/lib/utils/cn";
import { useMagnetic } from "@/lib/utils/useMagnetic";
import { analytics } from "@/lib/analytics/events";
import { playTone } from "@/lib/sound";

/**
 * The command palette (PLAN.md Phase 3). A JS-only enhancement — routes and
 * the menu overlay already work without JavaScript, this is the third way
 * in. Built on native <dialog>/showModal() rather than a hand-rolled focus
 * trap: modal <dialog> renders in the browser's top layer, closes on
 * Escape, and constrains Tab focus for free (see ARCHITECTURE.md's decision
 * to skip the `cmdk` dependency).
 */
export function CommandPalette() {
  const open = useLabStore((s) => s.commandPaletteOpen);
  const setOpen = useLabStore((s) => s.setCommandPaletteOpen);
  const setAiOpen = useLabStore((s) => s.setAiOpen);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const results = searchCommands(query);
  const activeItem = results[activeIndex];
  const soundEnabled = useLabStore((s) => s.soundEnabled);

  // PLAN.md Phase 15 easter egg — a playful dead end, not a real command:
  // it never appears in `results` or affects keyboard navigation.
  const isSudo = query.trim().toLowerCase().startsWith("sudo");
  useEffect(() => {
    if (!isSudo) return;
    if (soundEnabled) playTone("denied");
    analytics.easterEggFound("sudo");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per sudo-query transition, not on every render
  }, [isSudo]);

  const listboxId = useId();
  const optionId = (item: CommandItem) => `${listboxId}-${item.id}`;

  // One of the four magnetic elements sitewide — see PLAN.md Phase 6.
  const { triggerRef: magneticTriggerRef } = useMagnetic<HTMLButtonElement>();

  useBodyScrollLock(open);

  // Global ⌘K / Ctrl+K — works from anywhere on the page, open or closed.
  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const next = !useLabStore.getState().commandPaletteOpen;
        setOpen(next);
        if (next) analytics.commandPaletteOpen("keyboard");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  // Open/close the native dialog to match the store — this is what gives
  // the <100ms open requirement, since showModal() is synchronous.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      setQuery("");
      setActiveIndex(0);
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Native close (Escape, backdrop click, dialog.close()) — sync back to the
  // store and return focus to whatever opened the palette.
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

  // Never let the palette survive a route change.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setOpen(false);
  }, [pathname, setOpen]);

  function go(item: CommandItem) {
    analytics.commandPaletteSelect(item.href);
    setOpen(false);
    if (item.href === ASK_THE_LAB_COMMAND_HREF) {
      setAiOpen(true);
      analytics.askLabOpen("palette");
      return;
    }
    router.push(item.href);
  }

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeItem) go(activeItem);
    }
  }

  return (
    <>
      <button
        ref={magneticTriggerRef}
        type="button"
        onClick={() => {
          setOpen(true);
          analytics.commandPaletteOpen("click");
        }}
        aria-label="Open command palette"
        data-cursor="interact"
        className="flex h-11 items-center gap-1.5 rounded-sm border border-border px-3 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors duration-[var(--duration-fast)] hover:border-border-strong hover:text-text"
      >
        <span aria-hidden="true">⌘</span>K
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Command palette"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="m-0 max-h-none w-full max-w-full border-none bg-transparent p-0 open:mt-[12vh] backdrop:bg-bg/80 backdrop:backdrop-blur-sm"
      >
        <div className="mx-auto w-full max-w-xl rounded-md border border-border-strong bg-surface-raised">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <span aria-hidden="true" className="font-mono text-xs text-text-faint">
              ⌘K
            </span>
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded="true"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={activeItem ? optionId(activeItem) : undefined}
              autoComplete="off"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search routes, work, experiments…"
              className="w-full bg-transparent text-[length:var(--text-base)] text-text placeholder:text-text-faint focus:outline-none"
            />
          </div>

          {isSudo && (
            <p className="px-4 pt-3 font-mono text-xs uppercase tracking-widest text-failed" role="status">
              Permission denied: you already have root. It&rsquo;s my portfolio.
            </p>
          )}

          <ul id={listboxId} role="listbox" aria-label="Results" className="max-h-80 overflow-y-auto p-2">
            {results.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-text-faint">No matches.</li>
            )}
            {results.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  id={optionId(item)}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => go(item)}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between gap-4 rounded-sm px-3 text-left transition-colors duration-[var(--duration-instant)]",
                    i === activeIndex ? "bg-accent-glow text-text" : "text-text-muted",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className="label">{item.group}</span>
                    <span className="text-sm">{item.label}</span>
                  </span>
                  {item.detail && (
                    <span className="shrink-0 text-xs text-text-faint">{item.detail}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {!query && (
            <p className="border-t border-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-text-faint">
              This lab has a few secrets. Some respond to typing, some to keys.
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
