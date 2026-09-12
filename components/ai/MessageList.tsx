import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { ChatMessage } from "./types";

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-GB", { hour12: false });
}

/**
 * `aria-live="polite"` announces each new assistant message as it lands —
 * AI_SPEC.md §6. The pending "thinking" state is announced too, so a
 * screen reader user knows the Lab is working rather than silent.
 *
 * Rendered as log lines (mono role tag + accent rail), not chat bubbles —
 * the Lab's system language (SYSTEM · STATUS · ONLINE) carried into the
 * conversation itself, per CLAUDE.md §10.
 */
export function MessageList({ messages, pending }: { messages: ChatMessage[]; pending: boolean }) {
  if (messages.length === 0 && !pending) return null;

  return (
    <div aria-live="polite" aria-relevant="additions" className="flex flex-col gap-4">
      {messages.map((m, i) => (
        <div key={i} className="flex gap-3">
          <span
            className={cn(
              "shrink-0 pt-0.5 font-mono text-xs uppercase tracking-widest",
              m.role === "user" ? "text-text-muted" : "text-accent-dim",
            )}
          >
            {m.role === "user" ? "User >" : "Lab >"}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "border-l-2 pl-3 text-sm leading-relaxed",
                m.role === "user" ? "border-border-strong text-text-muted" : "border-accent-dim text-text",
              )}
            >
              {m.content}
            </p>
            <div className="mt-1.5 flex items-center gap-3 pl-3">
              <span className="font-mono text-xs text-text-faint">{formatTime(m.timestamp)}</span>
              {m.link && (
                <Link
                  href={m.link.href}
                  className="font-mono text-xs uppercase tracking-widest text-accent hover:text-accent-dim"
                >
                  → {m.link.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {pending && (
        <div className="flex gap-3">
          <span className="shrink-0 pt-0.5 font-mono text-xs uppercase tracking-widest text-accent-dim">Lab &gt;</span>
          <div className="flex items-center gap-2 border-l-2 border-accent-dim pl-3 font-mono text-xs uppercase tracking-widest text-text-faint">
            Analyzing knowledge base
            <span className="flex gap-1" aria-hidden="true">
              <span className="ask-lab-spinner-dot h-1 w-1 rounded-full bg-accent-dim" />
              <span className="ask-lab-spinner-dot h-1 w-1 rounded-full bg-accent-dim" />
              <span className="ask-lab-spinner-dot h-1 w-1 rounded-full bg-accent-dim" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
