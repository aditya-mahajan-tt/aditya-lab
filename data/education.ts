import { z } from "zod";
import { EducationEntrySchema } from "./schema";

/**
 * From Aditya_Mahajan_OnePager.pdf (supplied 2026-09-05). Structural facts —
 * institution, program, dates — written directly, no draft marker, same
 * treatment data/experience.ts already gives its own company/role/dates
 * fields. School-level entries (CBSE X/XII) are excluded per Aditya's
 * decision: higher ed + work only, matching how the resume itself is
 * weighted for a recruiter audience.
 */
const raw = [
  {
    id: "masters-union",
    institution: "Masters' Union",
    program: "Post Graduate Programme in Technology & Business Management (PGP TBM)",
    location: "Gurugram",
    start: "2026",
    note: "25% scholarship — Pankaj Bansal Scholarship for Young Leaders",
  },
  {
    id: "bits-pilani",
    institution: "Birla Institute of Technology & Science, Pilani",
    program: "B.E. Chemical Engineering",
    location: "Goa",
    start: "2018",
    end: "2022",
  },
];

export const education = z.array(EducationEntrySchema).parse(raw);
