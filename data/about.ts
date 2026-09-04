import { AboutSchema } from "./schema";

/**
 * CONTENT_INTAKE.md §B. Word counts are in that file — stick to them.
 */
export const about = AboutSchema.parse({
  heroHeadline: "I build things at the intersection of AI × Product × Business.",
  heroSubline: "Welcome to my digital laboratory.",

  shortBio: "[SHORT_BIO_REQUIRED]",
  longBio: "[LONG_BIO_REQUIRED]",

  progression: [
    { label: "CURIOUS", body: "[PROGRESSION_CURIOUS_REQUIRED]" },
    { label: "BUILDER", body: "[PROGRESSION_BUILDER_REQUIRED]" },
    { label: "MARKETER", body: "[PROGRESSION_MARKETER_REQUIRED]" },
    { label: "PRODUCT THINKER", body: "[PROGRESSION_PRODUCT_REQUIRED]" },
    { label: "AI EXPLORER", body: "[PROGRESSION_AI_REQUIRED]" },
    { label: "STILL EXPERIMENTING", body: "[PROGRESSION_EXPERIMENTING_REQUIRED]" },
  ],

  problemsIEnjoy: "[PROBLEMS_I_ENJOY_REQUIRED]",
});
