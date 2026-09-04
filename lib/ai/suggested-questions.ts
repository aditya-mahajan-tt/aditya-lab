/** AI_SPEC.md §6 — the six chips shown when the input is empty. */
export const SUGGESTED_QUESTIONS = [
  "What is Aditya strongest at?",
  "What has he built?",
  "Tell me about the goSTOPS project.",
  "What technologies does he use?",
  "What kind of problems does he enjoy?",
  "Why should I work with him?",
] as const;

export type SuggestedQuestion = (typeof SUGGESTED_QUESTIONS)[number];
