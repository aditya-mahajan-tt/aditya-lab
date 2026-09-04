"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { CANNED_ANSWERS } from "@/lib/ai/canned-answers.generated";
import { REFUSAL_STRING } from "@/lib/ai/system-prompt";
import { analytics } from "@/lib/analytics/events";
import { MessageList } from "./MessageList";
import { SuggestedQuestions } from "./SuggestedQuestions";
import type { ChatMessage } from "./types";

type AskApiResponse =
  | { status: "answered"; message: string; link?: { label: string; href: string }; cached?: boolean }
  | { status: "redirected"; message: string }
  | { status: "invalid" }
  | { status: "rate_limited" }
  | { status: "offline" };

type Status = "idle" | "pending" | "offline" | "rate_limited";

const MANUAL_LINKS = [
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function ChatWindow({
  open,
  inputRef,
}: {
  open: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fresh input every time the dialog opens — conversation history is
  // preserved (closing to re-read an answer shouldn't lose it). Focus
  // itself is handled by AskTheLab, right after dialog.showModal().
  useEffect(() => {
    if (open) {
      setValue("");
      setStatus("idle");
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, status]);

  function selectSuggested(question: string) {
    const answer = CANNED_ANSWERS[question as keyof typeof CANNED_ANSWERS] ?? REFUSAL_STRING;
    setMessages((prev) => [...prev, { role: "user", content: question }, { role: "assistant", content: answer }]);
    setStatus("idle");
    analytics.askLabQuestion(answer === REFUSAL_STRING);
  }

  async function submit(question: string) {
    const trimmed = question.trim();
    if (!trimmed || trimmed.length > 500 || status === "pending") return;

    const history = messages.slice(-4).map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
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
        <MessageList messages={messages} pending={status === "pending"} />

        {(status === "offline" || status === "rate_limited") && (
          <div role="alert" className="mt-3 rounded-md border border-building/50 bg-building/10 px-4 py-3">
            <p className="font-mono text-xs uppercase tracking-widest text-building">
              {status === "offline" ? "AI CORE TEMPORARILY OFFLINE." : "RATE LIMIT REACHED. The Lab resets hourly."}
            </p>
            <p className="mt-2 text-sm text-text-muted">Explore the Lab manually →</p>
            <ul className="mt-2 flex gap-4">
              {MANUAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-accent hover:text-accent-dim">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
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
        className="border-t border-border p-3"
      >
        <label htmlFor="ask-the-lab-input" className="sr-only">
          Ask the Lab a question
        </label>
        <div className="flex items-end gap-2">
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

        <p className="mt-3 text-xs text-text-faint">
          Lab assistant. Answers come only from Aditya&rsquo;s written portfolio.
        </p>
        <p className="mt-1 text-xs text-text-faint">
          Questions are stored anonymously to improve the portfolio. Nothing else is collected.
        </p>
      </form>
    </div>
  );
}
