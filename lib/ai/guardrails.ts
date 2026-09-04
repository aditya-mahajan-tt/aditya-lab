import { z } from "zod";

/** AI_SPEC.md §4. */

export const AskRequestSchema = z.object({
  question: z.string().trim().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(500),
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
 * A small stoplist of common capitalised English words that would otherwise
 * false-positive as "proper nouns absent from the knowledge file" in
 * isGrounded below. Not exhaustive by design (AI_SPEC.md §4: "cheap,
 * imperfect, catches the worst cases") — erring toward over-refusing a
 * grounded answer is the safe failure direction here, not under-refusing
 * a fabricated one.
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
  "A",
  "An",
  "And",
  "But",
  "Or",
  "So",
  "If",
  "When",
  "While",
  "Because",
  "Since",
  "As",
  "To",
  "For",
  "In",
  "On",
  "At",
  "Of",
  "With",
  "By",
  "From",
  "Is",
  "Are",
  "Was",
  "Were",
  "Be",
  "Been",
  "Has",
  "Have",
  "Had",
  "Will",
  "Would",
  "Should",
  "Could",
  "Can",
  "May",
  "Might",
  "Not",
  "No",
  "Yes",
  "Aditya",
  "Ask",
  "Lab",
  "AI",
  "Want",
  "Explore",
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
