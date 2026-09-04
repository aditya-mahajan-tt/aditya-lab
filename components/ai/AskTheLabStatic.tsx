import { SUGGESTED_QUESTIONS } from "@/lib/ai/suggested-questions";
import { CANNED_ANSWERS } from "@/lib/ai/canned-answers.generated";
import { OpenAskTheLabButton } from "./OpenAskTheLabButton";

/**
 * Server-rendered, zero-JS version of Ask the Lab (AI_SPEC.md §7: "JS
 * disabled → renders the six suggested questions with their canned answers
 * as plain static content"). Native <details>/<summary> disclosure, same
 * approach as NavOverlay — works before hydration and without it.
 *
 * Doubles as the "persistent contact-adjacent entry point" §6 asks for:
 * this section IS that entry point, not a second copy of it.
 */
export function AskTheLabStatic() {
  return (
    <section aria-labelledby="ask-the-lab-heading" className="mt-16 border-t border-border pt-10">
      <p className="label mb-3">SYSTEM · QUERY</p>
      <h2 id="ask-the-lab-heading" className="text-[length:var(--text-2xl)]">
        Ask the Lab
      </h2>
      <p className="mt-2 text-sm text-text-faint">
        Answers come only from Aditya&rsquo;s written portfolio.
      </p>

      <div className="mt-6 divide-y divide-border border-y border-border">
        {SUGGESTED_QUESTIONS.map((question) => (
          <details key={question} className="group py-1">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between py-3 text-sm text-text marker:hidden [&::-webkit-details-marker]:hidden">
              {question}
              <span aria-hidden="true" className="text-text-faint group-open:rotate-180">
                ↓
              </span>
            </summary>
            <p className="pb-4 text-sm text-text-muted">{CANNED_ANSWERS[question]}</p>
          </details>
        ))}
      </div>

      <OpenAskTheLabButton />
    </section>
  );
}
