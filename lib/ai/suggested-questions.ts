/** AI_SPEC.md §6 — the six chips shown when the input is empty. */
export const SUGGESTED_QUESTIONS = [
  "What is Aditya strongest at?",
  "What has he built?",
  "What did he do at Turbotork and Accordion?",
  "What technologies does he use?",
  "What kind of problems does he enjoy?",
  "Why should I work with him?",
] as const;

export type SuggestedQuestion = (typeof SUGGESTED_QUESTIONS)[number];
