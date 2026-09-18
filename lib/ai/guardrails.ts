import { z } from "zod";

/** AI_SPEC.md §4. */

export const AskRequestSchema = z.object({
  question: z.string().trim().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        // Assistant turns aren't user input — they're the model's own prior
        // output (or a canned answer) echoed back for context, and routinely
        // run longer than the 500-char cap on a fresh question.
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .max(4)
    .default([]),
});

export type AskRequest = z.infer<typeof AskRequestSchema>;

/**
 * Obvious prompt-injection shapes (AI_SPEC.md §4). Not exhaustive — the
 * system prompt's own rule 7 and the output grounding check are the real
 * backstops. This just catches the blunt attempts cheaply and lets us
 * respond with a friendly redirect instead of silently forwarding them.
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+|any\s+)?(previous|prior|above)\s+instructions?/i,
  /disregard\s+(all\s+|any\s+)?(previous|prior|above)/i,
  /\bsystem\s*:/i,
  /you\s+are\s+now\b/i,
  /forget\s+(all\s+|any\s+)?(previous|prior)/i,
  /new\s+instructions?\s*:/i,
  /pretend\s+(you|to\s+be)\b/i,
  /act\s+as\s+(if\s+you('re|\s+are)|a\b)/i,
  /reveal\s+(your|the)\s+(system\s+)?prompt/i,
  /what\s+(is|are)\s+your\s+(system\s+)?(instructions?|prompt)/i,
  /jailbreak/i,
  /role[\s-]?play\s+as\b/i,
];

export function isPromptInjection(question: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(question));
}

export const FRIENDLY_REDIRECT =
  "That's not something the Lab can help with — try asking about Aditya's work, skills, or approach.";

/**
 * AI_SPEC.md §4 requires that no URL the model produces ever reaches the
 * visitor — internal links come only from link-suggestions.ts's allowlist,
 * rendered as a separate chip. Nothing was actually enforcing that on the
 * answer text: a live probe on 2026-09-18 returned prose containing
 * "<https://adityalab.com/work/gostops-gtm>", and the six pre-generated
 * canned answers still carry bare absolute URLs, one of them to a domain
 * with a www prefix the site does not use.
 *
 * The same probe showed reasoning models emitting corpus headings back as
 * citation spans — "...roughly 70%【Experience: AI Product Manager,
 * Founder's Office at Turbotork Technologies Pvt. Ltd.】" — which leaks the
 * grounding document's structure into a recruiter-facing answer.
 *
 * Both are stripped here, before the grounding check runs, so a stray URL
 * or citation marker cleans up rather than failing an otherwise good
 * answer. Runs on every answer path including the canned ones.
 */
export function sanitizeAnswer(answer: string): string {
  return (
    answer
      // CJK bracket citation spans, and the ASCII [[...]] form.
      .replace(/【[^】]*】/g, "")
      .replace(/\[\[[^\]]*\]\]/g, "")
      // Markdown links: keep the label, drop the target.
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      // Bare or angle-bracketed URLs, and any trailing "see: " lead-in left
      // dangling once the URL is gone.
      .replace(/<?\bhttps?:\/\/[^\s<>)\]]+>?/gi, "")
      .replace(/\s+([,.;:])/g, "$1")
      .replace(/(?:\b(?:see|at|via|visit)\s*)?[:,]?\s*\.(?=\s|$)/gi, ".")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
}

/**
 * Capitalised words that are ordinary English rather than proper nouns.
 * Without this, isGrounded below throws away a perfectly grounded answer
 * whenever the model opens a sentence with a connective — a live probe on
 * 2026-09-18 lost a correct, fully-sourced answer about Aditya's AI work to
 * the single word "Additionally", and the visitor saw the refusal string
 * instead. That failure is not "safe": it makes a working feature look
 * broken on exactly the questions the portfolio most wants to answer.
 *
 * So this list covers the closed class the false positives come from —
 * determiners, conjunctions, connectives, prepositions, modals and the
 * handful of common nouns this assistant's register starts sentences with.
 * It deliberately does NOT weaken the check itself: a capitalised word that
 * is genuinely a fabricated employer, client or technology is still absent
 * from the corpus, still not in this list, and still triggers a refusal
 * (AI_SPEC.md §4: "cheap, imperfect, catches the worst cases").
 */
const COMMON_CAPITALISED_WORDS = new Set([
  "The",
  "This",
  "That",
  "These",
  "Those",
  "He",
  "She",
  "It",
  "They",
  "We",
  "You",
  "His",
  "Her",
  "Their",
  "Its",
  "Our",
  "A",
  "An",
  "Each",
  "Every",
  "Both",
  "Either",
  "Neither",
  "Some",
  "Most",
  "Many",
  "Much",
  "Few",
  "Several",
  "Any",
  "All",
  "One",
  "Two",
  "Three",
  "And",
  "But",
  "Or",
  "Nor",
  "Yet",
  "So",
  "For",
  "If",
  "When",
  "While",
  "Because",
  "Since",
  "Although",
  "Though",
  "Unless",
  "Until",
  "Whether",
  "Whereas",
  "However",
  "Moreover",
  "Furthermore",
  "Additionally",
  "Also",
  "Therefore",
  "Thus",
  "Hence",
  "Instead",
  "Otherwise",
  "Meanwhile",
  "Nevertheless",
  "Nonetheless",
  "Besides",
  "Overall",
  "Altogether",
  "Together",
  "Beyond",
  "Rather",
  "Still",
  "Then",
  "Once",
  "Before",
  "After",
  "During",
  "Across",
  "Alongside",
  "Regarding",
  "Concerning",
  "As",
  "To",
  "In",
  "On",
  "At",
  "Of",
  "With",
  "Without",
  "Within",
  "By",
  "From",
  "Into",
  "Onto",
  "Over",
  "Under",
  "Through",
  "Throughout",
  "Between",
  "Among",
  "Against",
  "Toward",
  "Towards",
  "Upon",
  "About",
  "Above",
  "Below",
  "Here",
  "There",
  "Where",
  "Why",
  "How",
  "What",
  "Which",
  "Who",
  "Whom",
  "Whose",
  "Is",
  "Are",
  "Was",
  "Were",
  "Be",
  "Been",
  "Being",
  "Am",
  "Has",
  "Have",
  "Had",
  "Having",
  "Does",
  "Did",
  "Doing",
  "Will",
  "Would",
  "Should",
  "Could",
  "Can",
  "May",
  "Might",
  "Must",
  "Shall",
  "Let",
  "Make",
  "Made",
  "Get",
  "Got",
  "Give",
  "Given",
  "Take",
  "Taken",
  "Use",
  "Used",
  "Using",
  "Work",
  "Works",
  "Worked",
  "Working",
  "Build",
  "Built",
  "Building",
  "Based",
  "Focused",
  "Drawn",
  "Known",
  "Seen",
  "Said",
  "Says",
  "Look",
  "Looking",
  "Note",
  "Notably",
  "Specifically",
  "Currently",
  "Previously",
  "Recently",
  "Earlier",
  "Later",
  "Finally",
  "First",
  "Second",
  "Third",
  "Next",
  "Last",
  "Prior",
  "Aditya",
  "Ask",
  "Lab",
  "Want",
  "Explore",
  "More",
  "Other",
  "Another",
  "Such",
  "Same",
  "Similar",
  "Different",
  "Key",
  "Main",
  "Early",
  "Late",
  "Good",
  "Best",
  "Strong",
  "Clear",
  "Real",
  "Full",
  "Long",
  "Short",
  "Small",
  "Large",
  "High",
  "Low",
  "New",
  "Old",
  "According",
  "Details",
  "Example",
  "Examples",
  "Experience",
  "Project",
  "Projects",
  "Skills",
  "Portfolio",
  "Page",
  "Site",
  "Contact",
  "Resume",
  "Email",
  "Yes",
  "Not",
  "No",
  "Nothing",
  "None",
  "Never",
  "Always",
  "Often",
  "Sometimes",
  "Unfortunately",
  "Importantly",
  "Interestingly",
  "Essentially",
  "Generally",
  "Typically",
  "Broadly",
  "Largely",
  "Mostly",
  "Primarily",
  "Particularly",
  "Notable",
  // Added after a 2026-09-18 model comparison: "(See the Turbotork case...)"
  // cost an otherwise correct answer. Sentence-opening imperatives belong to
  // the same closed class as the connectives above.
  "See",
  "Read",
  "Visit",
  "Check",
  "Find",
  "Learn",
  "Consider",
  "Browse",
]);

function extractNumbers(text: string): string[] {
  return [...new Set(text.match(/\b\d[\d,.]*\b/g) ?? [])];
}

function extractProperNouns(text: string): string[] {
  const words = text.match(/\b[A-Z][a-z]{2,}\b/g) ?? [];
  return [...new Set(words)].filter((w) => !COMMON_CAPITALISED_WORDS.has(w));
}

/**
 * Cheap post-check (AI_SPEC.md §4): every number and every proper noun in
 * the model's response must appear verbatim in the grounding knowledge.
 * If anything doesn't, the caller downgrades to the refusal string rather
 * than risk shipping a fabricated fact under Aditya's name.
 */
export function isGrounded(response: string, knowledge: string): boolean {
  const numbers = extractNumbers(response);
  const nouns = extractProperNouns(response);
  return (
    numbers.every((n) => knowledge.includes(n)) && nouns.every((n) => knowledge.includes(n))
  );
}
