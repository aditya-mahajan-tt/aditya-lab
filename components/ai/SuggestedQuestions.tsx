import { SUGGESTED_QUESTIONS } from "@/lib/ai/suggested-questions";

/**
 * AI_SPEC.md §6 — always visible when the input is empty. Selecting one
 * answers instantly from the canned-answer map, zero API calls.
 */
export function SuggestedQuestions({ onSelect }: { onSelect: (question: string) => void }) {
  return (
    <div>
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-text-faint">Try asking</p>
      <ul className="flex flex-wrap gap-2" aria-label="Suggested questions">
        {SUGGESTED_QUESTIONS.map((question) => (
          <li key={question}>
            <button
              type="button"
              onClick={() => onSelect(question)}
              data-cursor="interact"
              className="flex min-h-11 items-center gap-2 rounded-sm border border-border px-3 py-2 text-left text-sm text-text-muted transition-colors duration-[var(--duration-fast)] hover:border-border-strong hover:text-text"
            >
              <span aria-hidden="true" className="font-mono text-accent-dim">
                $
              </span>
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
