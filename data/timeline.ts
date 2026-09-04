import { z } from "zod";
import { TimelineEntrySchema } from "./schema";

/**
 * CONTENT_INTAKE.md §G — the Lab Log.
 * Every entry written by Aditya. Never generated.
 */
const raw = [
  {
    date: "2026-09-04",
    type: "BUILD",
    body: "Interactive portfolio architecture defined.",
  },
];

export const timeline = z
  .array(TimelineEntrySchema)
  .parse(raw)
  .sort((a, b) => b.date.localeCompare(a.date));
