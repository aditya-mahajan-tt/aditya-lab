"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { CANNED_ANSWERS } from "@/lib/ai/canned-answers.generated";
import { REFUSAL_STRING } from "@/lib/ai/system-prompt";
import { analytics } from "@/lib/analytics/events";
import { cn } from "@/lib/utils/cn";
import { MessageList } from "./MessageList";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { useVoiceInput } from "./useVoiceInput";
import type { AskStatus, ChatMessage } from "./types";

type AskApiResponse =
  | { status: "answered"; message: string; link?: { label: string; href: string }; cached?: boolean }
  | { status: "redirected"; message: string }
  | { status: "invalid" }
  | { status: "rate_limited" }
  | { status: "offline" };

const MANUAL_LINKS = [
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function ChatWindow({
  open,
  inputRef,
  status,
  setStatus,
}: {
  open: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  status: AskStatus;
  setStatus: (status: AskStatus) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState("");
  const [canSpeak, setCanSpeak] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // A transcript lands in the input for the visitor to read, never straight
  // into a question. Speech recognition mishears names — the whole reason
  // lib/ai/transcription-vocabulary.ts exists — and answering a question
  // someone did not ask is worse than making them glance at it first.
  const voice = useVoiceInput((text) => {
    setValue(text.slice(0, 500));
    inputRef.current?.focus();
  });

  // Fresh input every time the dialog opens — conversation history is
  // preserved (closing to re-read an answer shouldn't lose it). Focus
  // itself is handled by AskTheLab, right after dialog.showModal().
  useEffect(() => {
    if (open) {
      setValue("");
      setStatus("idle");
    }
  }, [open, setStatus]);

  // Asked once per opening rather than at mount: most visitors never open
  // the assistant, and this should not cost them a request.
  useEffect(() => {
    if (!open || canSpeak) return;
    let cancelled = false;
    void fetch("/api/speak")
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d: { enabled?: boolean }) => {
        if (!cancelled) setCanSpeak(!!d.enabled);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, canSpeak]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, status]);

  function selectSuggested(question: string) {
    const answer = CANNED_ANSWERS[question as keyof typeof CANNED_ANSWERS] ?? REFUSAL_STRING;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question, timestamp: Date.now() },
      { role: "assistant", content: answer, timestamp: Date.now() },
    ]);
    setStatus("idle");
    analytics.askLabQuestion(answer === REFUSAL_STRING);
  }

  async function submit(question: string) {
    const trimmed = question.trim();
    if (!trimmed || trimmed.length > 500 || status === "pending") return;

    const history = messages.slice(-4).map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: trimmed, timestamp: Date.now() }]);
    setValue("");
    setStatus("pending");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, history }),
      });
      const data = (await res.json()) as AskApiResponse;

      if (data.status === "answered" || data.status === "redirected") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            link: "link" in data ? data.link : undefined,
            timestamp: Date.now(),
          },
        ]);
        setStatus("idle");
        if (data.status === "answered") analytics.askLabQuestion(data.message === REFUSAL_STRING);
        return;
      }

      if (data.status === "rate_limited") {
        setStatus("rate_limited");
        return;
      }

      setStatus("offline");
    } catch {
      setStatus("offline");
    }
  }

  const showSuggestions = messages.length === 0 && value.trim().length === 0 && status === "idle";

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <MessageList messages={messages} pending={status === "pending"} canSpeak={canSpeak} />

        {(status === "offline" || status === "rate_limited") && (
          <div role="alert" className="mt-3 flex gap-3">
            <span className="shrink-0 pt-0.5 font-mono text-xs uppercase tracking-widest text-building">
              SYS &gt;
            </span>
            <div className="min-w-0 flex-1 border-l-2 border-building pl-3">
              <p className="font-mono text-xs uppercase tracking-widest text-building">
                {status === "offline" ? "AI Core Offline" : "Rate Limit Reached"}
              </p>
              <p className="mt-1.5 text-sm text-text-muted">
                {status === "offline"
                  ? "Explore the Lab manually."
                  : "The Lab resets hourly. Explore manually meanwhile."}
              </p>
              <ul className="mt-2 flex gap-4">
                {MANUAL_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="font-mono text-xs uppercase tracking-widest text-accent hover:text-accent-dim"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {showSuggestions && (
          <div className="mt-2">
            <SuggestedQuestions onSelect={selectSuggested} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(value);
        }}
        className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <label htmlFor="ask-the-lab-input" className="sr-only">
          Ask the Lab a question
        </label>
        <div className="flex items-end gap-2">
          <span aria-hidden="true" className="pb-2 font-mono text-sm text-accent-dim">
            &gt;
          </span>
          <textarea
            id="ask-the-lab-input"
            ref={inputRef}
            rows={1}
            maxLength={500}
            value={value}
            placeholder="What do you want to know?"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit(value);
              }
            }}
            className="max-h-32 flex-1 resize-none bg-transparent text-sm text-text placeholder:text-text-faint focus:outline-none"
          />
          {voice.state !== "unsupported" && (
            <button
              type="button"
              onClick={voice.toggle}
              disabled={voice.state === "transcribing" || status === "pending"}
              aria-pressed={voice.state === "recording"}
              aria-label={voice.state === "recording" ? "Stop recording" : "Ask by voice"}
              data-cursor="interact"
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border text-text-muted transition-colors duration-[var(--duration-fast)] disabled:opacity-40",
                voice.state === "recording"
                  ? "border-accent text-accent"
                  : "border-border hover:border-border-strong hover:text-text",
              )}
            >
              {voice.state === "recording" ? (
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="ask-lab-status-pulse absolute inline-flex h-full w-full rounded-full bg-accent" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
              ) : voice.state === "transcribing" ? (
                <span className="font-mono text-xs" aria-hidden="true">
                  ...
                </span>
              ) : (
                // Drawn rather than an emoji: every other control in this
                // dialog is a monochrome glyph (>,, x), and a full-colour
                // emoji mic was the one element that read as borrowed
                // chrome rather than part of the Lab. currentColor so it
                // inherits the same hover and recording states as its border.
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="h-4 w-4"
                >
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0" />
                  <path d="M12 18v3" />
                </svg>
              )}
            </button>
          )}

          <button
            type="submit"
            disabled={value.trim().length === 0 || status === "pending"}
            aria-label="Send question"
            data-cursor="interact"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-border text-text-muted transition-colors duration-[var(--duration-fast)] hover:border-border-strong hover:text-text disabled:opacity-40"
          >
            ↵
          </button>
        </div>

        <div className="mt-1 flex items-center justify-between gap-3">
          <span aria-live="polite" className="min-w-0 truncate font-mono text-xs text-text-faint">
            {voice.state === "recording"
              ? "Recording — press again to stop."
              : voice.state === "transcribing"
                ? "Transcribing..."
                : (voice.message ?? "")}
          </span>
          <span className="shrink-0 font-mono text-xs tabular-nums text-text-faint">{value.length} / 500</span>
        </div>

        <p className="mt-2 text-xs text-text-faint">
          Lab assistant. Answers come only from Aditya&rsquo;s written portfolio.
        </p>
        <p className="mt-1 text-xs text-text-faint">
          Questions are stored anonymously to improve the portfolio. Nothing else is collected.
        </p>
      </form>
    </div>
  );
}
