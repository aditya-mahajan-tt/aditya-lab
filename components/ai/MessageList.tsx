import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { ChatMessage } from "./types";

/**
 * `aria-live="polite"` announces each new assistant message as it lands —
 * AI_SPEC.md §6. The pending "thinking" state is announced too, so a
 * screen reader user knows the Lab is working rather than silent.
 */
export function MessageList({ messages, pending }: { messages: ChatMessage[]; pending: boolean }) {
  if (messages.length === 0 && !pending) return null;

  return (
    <div aria-live="polite" aria-relevant="additions" className="flex flex-col gap-3">
      {messages.map((m, i) => (
        <div
          key={i}
          className={cn(
            "max-w-[85%] rounded-md px-4 py-3 text-sm leading-relaxed",
            m.role === "user"
              ? "self-end bg-accent-glow text-text"
              : "self-start border border-border bg-surface text-text",
          )}
        >
          <p>{m.content}</p>
          {m.link && (
            <Link
              href={m.link.href}
              className="mt-2 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-accent hover:text-accent-dim"
            >
              → {m.link.label}
            </Link>
          )}
        </div>
      ))}

      {pending && (
        <div className="self-start rounded-md border border-border bg-surface px-4 py-3 font-mono text-xs uppercase tracking-widest text-text-faint">
          Querying knowledge base…
        </div>
      )}
    </div>
  );
}
