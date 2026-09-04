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
  location: "[LOCATION_REQUIRED]",
  email: "[EMAIL_REQUIRED]",
  resumePath: "[RESUME_PATH_REQUIRED]",
  social: [
    { label: "LinkedIn", url: "[LINKEDIN_URL_REQUIRED]" },
    { label: "GitHub", url: "[GITHUB_URL_REQUIRED]" },
  ],
});
