"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { tourPrompt, tourSteps, type TourStep } from "@/data/tour";
import { analytics } from "@/lib/analytics/events";
import { useLabStore } from "@/lib/store";
import { useFocusTrap } from "@/lib/utils/useFocusTrap";

const SEEN_KEY = "aditya-lab:tour-seen";
const PAD = 6;
const CARD_WIDTH = 320;
const MARGIN = 16;

const selectorFor = (step: TourStep) => `[data-tour="${step.target}"]`;

function find(step: TourStep): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(selectorFor(step));
  return el && el.getClientRects().length > 0 ? el : null;
}

/**
 * First-visit walkthrough of the homepage (data/tour.ts holds the copy).
 * Two ways in: a dismissible chip shown once per browser, and the hero's
 * "Take a short tour" button, which always works. It never auto-starts and
 * never delays the page: CLAUDE.md §2's 30-second path comes first.
 *
 * No timers or polling — the spotlight re-measures only on scroll/resize
 * while the tour is open. Nothing here is the only route to anything; every
 * step points at something already reachable.
 */
export function SiteTour() {
  const pathname = usePathname();
  const open = useLabStore((s) => s.tourOpen);
  const setOpen = useLabStore((s) => s.setTourOpen);
  const bootComplete = useLabStore((s) => s.bootComplete);

  const [chip, setChip] = useState(false);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  const onHome = pathname === "/";

  // One-time chip. Marked seen as soon as it is shown, so a visitor who
  // ignores it is not nagged on the next page view.
  useEffect(() => {
    if (!onHome || !bootComplete) return;
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
      localStorage.setItem(SEEN_KEY, "1");
      setChip(true);
    } catch {
      // Storage blocked: skip the chip; the hero button still works.
    }
  }, [onHome, bootComplete]);

  useEffect(() => {
    if (!onHome) {
      setChip(false);
      setOpen(false);
    }
  }, [onHome, setOpen]);

  // Resolve which steps exist for this visitor each time the tour opens.
  useEffect(() => {
    if (!open) return;
    setChip(false);
    setSteps(tourSteps.filter((step) => find(step)));
    setIndex(0);
  }, [open]);

  const step = open ? steps[index] : undefined;

  const measure = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    const el = step ? find(step) : null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useEffect(() => {
    if (!step) return;
    const el = find(step);
    // Header controls are sticky; everything else is brought into view.
    if (el && !el.closest("header")) el.scrollIntoView({ block: "center" });
    measure();

    let frame = 0;
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, [step, measure]);

  const close = useCallback(
    (outcome: "completed" | "skipped") => {
      analytics.tourEnd(outcome, index + 1);
      setOpen(false);
    },
    [index, setOpen],
  );

  const cardRef = useFocusTrap<HTMLDivElement>({ active: open && steps.length > 0, onEscape: () => close("skipped") });
  const nextRef = useRef<HTMLButtonElement>(null);

  // Focus the card's primary action on every step, not just the first.
  useEffect(() => {
    if (step) nextRef.current?.focus();
  }, [step]);

  const last = index === steps.length - 1;
  const next = () => (last ? close("completed") : setIndex(index + 1));

  useEffect(() => {
    if (!step) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft" && index > 0) setIndex(index - 1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  if (chip && !open) {
    return (
      <div
        role="region"
        aria-label="Site tour"
        className="fixed inset-x-4 bottom-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-sm border border-accent bg-surface p-3 sm:right-auto sm:max-w-md"
        style={{ zIndex: "var(--z-sticky)" }}
      >
        <p className="min-w-0 flex-1 basis-56 text-sm text-text">{tourPrompt.chip}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              analytics.tourStart("chip");
              setOpen(true);
            }}
            className="min-h-11 rounded-sm bg-accent px-4 font-mono text-xs uppercase tracking-widest text-bg"
          >
            {tourPrompt.start}
          </button>
          <button
            type="button"
            onClick={() => setChip(false)}
            className="min-h-11 px-3 font-mono text-xs uppercase tracking-widest text-text-muted hover:text-text"
          >
            {tourPrompt.dismiss}
          </button>
        </div>
      </div>
    );
  }

  if (!step) return null;

  // Room the card needs, with slack. Below the target if it fits, else above,
  // else (target fills the viewport) pinned to the viewport's bottom edge.
  const CARD_ROOM = 260;
  const small = viewport.w < 640;
  const spaceBelow = rect ? viewport.h - rect.bottom - PAD - MARGIN : 0;
  const spaceAbove = rect ? rect.top - PAD - MARGIN : 0;
  const cardStyle: React.CSSProperties = small
    ? { left: MARGIN, right: MARGIN, bottom: MARGIN }
    : !rect
      ? { left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: CARD_WIDTH }
      : {
          width: CARD_WIDTH,
          left: Math.min(Math.max(rect.left, MARGIN), viewport.w - CARD_WIDTH - MARGIN),
          ...(spaceBelow >= CARD_ROOM
            ? { top: rect.bottom + PAD + MARGIN }
            : spaceAbove >= CARD_ROOM
              ? { bottom: viewport.h - rect.top + PAD + MARGIN }
              : { bottom: MARGIN }),
        };

  return (
    <div className="fixed inset-0" style={{ zIndex: "var(--z-toast)" }}>
      {/* Swallows clicks so a stray tap cannot open a page mid-tour. */}
      <div className="absolute inset-0" aria-hidden="true" style={rect ? undefined : { background: "rgba(7,8,9,0.78)" }} />
      {rect && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-sm border border-accent"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(7,8,9,0.78)",
          }}
        />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className="fixed rounded-sm border border-accent bg-surface p-4"
        style={cardStyle}
      >
        <p className="label">
          STEP {index + 1} / {steps.length}
        </p>
        <h2 id="tour-title" className="mt-2 text-[length:var(--text-lg)]">
          {step.title}
        </h2>
        <p id="tour-body" className="mt-2 text-sm text-text-muted">
          {step.body}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => close("skipped")}
            className="min-h-11 px-2 font-mono text-xs uppercase tracking-widest text-text-muted hover:text-text"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex(index - 1)}
                className="min-h-11 rounded-sm border border-border px-4 font-mono text-xs uppercase tracking-widest text-text-muted hover:border-border-strong hover:text-text"
              >
                Back
              </button>
            )}
            <button
              ref={nextRef}
              type="button"
              onClick={next}
              className="min-h-11 rounded-sm bg-accent px-4 font-mono text-xs uppercase tracking-widest text-bg"
            >
              {last ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
