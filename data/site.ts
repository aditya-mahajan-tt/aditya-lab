import { SiteSchema } from "./schema";

/**
 * CONTENT_INTAKE.md §A — supply the real values, then delete the placeholders.
 */
export const site = SiteSchema.parse({
  name: "ADITYA LAB",
  title: "Aditya Mahajan — AI × Product × Business",
  description:
    "An interactive digital laboratory exploring AI, automation, product, strategy and technology.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  author: "Aditya Mahajan",
  // Inferred from resume (current program + most recent role, both Gurugram) — confirm or replace.
  location: "Gurugram, India",
  // From the resume he supplied directly — CONTENT_INTAKE.md suggests considering an alias
  // instead of a program email that expires with the degree; flag if you'd rather swap it.
  email: "aditya.mahajan2027@mastersunion.org",
  // Still needed: the actual PDF file. I only received its extracted text, not the file
  // itself — drop it in /public and set this path once you do.
  resumePath: "[RESUME_PATH_REQUIRED]",
  social: [
    // The resume's PDF text only exposed "LinkedIn" as a link label, not the underlying URL.
    { label: "LinkedIn", url: "[LINKEDIN_URL_REQUIRED]" },
    { label: "GitHub", url: "https://github.com/aditya-mahajan-tt" },
  ],
});
