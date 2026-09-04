import { ThinkingSchema } from "./schema";

/** CONTENT_INTAKE.md §E. This section is signature material — write it yourself. */
export const thinking = ThinkingSchema.parse({
  heading: "HOW I THINK",
  intro: "[THINKING_INTRO_REQUIRED]",
  steps: [
    { label: "OBSERVE", body: "[THINKING_OBSERVE_REQUIRED]" },
    { label: "QUESTION", body: "[THINKING_QUESTION_REQUIRED]" },
    { label: "UNDERSTAND", body: "[THINKING_UNDERSTAND_REQUIRED]" },
    { label: "FRAME", body: "[THINKING_FRAME_REQUIRED]" },
    { label: "BUILD", body: "[THINKING_BUILD_REQUIRED]" },
    { label: "TEST", body: "[THINKING_TEST_REQUIRED]" },
    { label: "LEARN", body: "[THINKING_LEARN_REQUIRED]" },
    { label: "ITERATE", body: "[THINKING_ITERATE_REQUIRED]" },
  ],
  workedExample: "[THINKING_WORKED_EXAMPLE_REQUIRED]",
  principles: [],
});
