import { experience } from "@/data/experience";
import { education } from "@/data/education";
import { getAllProjects, getAllExperiments } from "@/data/queries";
import { isPlaceholder, isDraft } from "@/data/schema";

/**
 * Whisper accepts a `prompt` that biases transcription toward a given
 * vocabulary. Without one it mangles exactly the words this site exists to
 * be asked about, because they are proper nouns it has never seen —
 * measured against the live model on 2026-09-18:
 *
 *   spoken                          raw              with this hint
 *   "Turbotork"                 →   "TurboToc"    →  "Turbotork"
 *   "Accordion and Kensara AI"  →   "accordion
 *                                    and kensara-ai"  "Accordion and Kensara AI"
 *
 * A misheard company name is not a cosmetic bug: it produces a question
 * whose subject is absent from the grounding corpus, so the assistant
 * answers "I don't have that in Aditya's portfolio" about Aditya's own
 * employer. The visitor blames the assistant, not the microphone.
 *
 * Derived from /data rather than hardcoded, for the same reason the corpus
 * is (see knowledge.ts): a company or project renamed in one place must
 * never keep its old spelling here. Placeholders and unreviewed drafts are
 * excluded — a name that is not real content should not be taught to the
 * transcriber.
 */

function real(value: string | undefined | null): string | null {
  if (!value) return null;
  if (isPlaceholder(value) || isDraft(value)) return null;
  return value;
}

let cached: string | null = null;

export function transcriptionVocabulary(): string {
  if (cached) return cached;

  const names = [
    ...experience.map((e) => real(e.company)),
    ...experience.flatMap((e) => e.tools),
    ...education.map((e) => real(e.institution)),
    ...getAllProjects()
      .filter((p) => !p.confidential)
      .map((p) => real(p.title)),
    ...getAllExperiments().map((e) => real(e.title)),
  ].filter((n): n is string => !!n);

  // Whisper's prompt is itself capped (224 tokens), and a list that runs
  // past it is silently truncated — so the sentence that frames the task
  // goes first, and the names are de-duplicated before they compete for
  // the remaining room.
  const unique = [...new Set(names)];
  cached = `Questions about Aditya Mahajan's portfolio. Proper nouns: ${unique.join(", ")}.`;
  return cached;
}
