import { SUGGESTED_QUESTIONS } from "@/lib/ai/suggested-questions";

/**
 * AI_SPEC.md §6 — always visible when the input is empty. Selecting one
 * answers instantly from the canned-answer map, zero API calls.
 */
export function SuggestedQuestions({ onSelect }: { onSelect: (question: string) => void }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Suggested questions">
      {SUGGESTED_QUESTIONS.map((question) => (
        <li key={question}>
          <button
            type="button"
            onClick={() => onSelect(question)}
            data-cursor="interact"
            className="min-h-11 rounded-sm border border-border px-3 py-2 text-left text-sm text-text-muted transition-colors duration-[var(--duration-fast)] hover:border-border-strong hover:text-text"
          >
            {question}
          </button>
        </li>
      ))}
    </ul>
  );
}
