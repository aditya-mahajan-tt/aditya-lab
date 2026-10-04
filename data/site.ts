import { SiteSchema } from "./schema";

/**
 * CONTENT_INTAKE.md §A — supply the real values, then delete the placeholders.
 *
 * `NEXT_PUBLIC_SITE_URL` is meant to be set explicitly in the Vercel
 * project's production environment: that's the source of truth and should
 * still be set there. The fallback chain exists so an unset variable degrades
 * to something sensible instead of `localhost` in production, which is what
 * broke every shared link's OG preview and the sitemap (Diagnostic Report
 * 13). The chain is:
 *   1. NEXT_PUBLIC_SITE_URL (has a protocol)
 *   2. VERCEL_PROJECT_PRODUCTION_URL, the stable production domain
 *   3. VERCEL_URL, the per-deployment host
 *   4. localhost
 * Step 2 was added 2026-10-04: without it an unset NEXT_PUBLIC_SITE_URL sent
 * canonicals, the sitemap and OG images to a per-deployment host. Both
 * Vercel variables have no protocol prefix and are documented at
 * vercel.com/docs/environment-variables/system-environment-variables.
 */
type Env = Record<string, string | undefined>;

export const resolveSiteUrl = (env: Env = process.env): string => {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL;
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export const site = SiteSchema.parse({
  name: "ADITYA LAB",
  title: "Aditya Mahajan — AI × Product × Business",
  description:
    "An interactive digital laboratory exploring AI, automation, product, strategy and technology.",
  url: resolveSiteUrl(),
  author: "Aditya Mahajan",
  // Inferred from resume (current program + most recent role, both Gurugram) — confirm or replace.
  location: "Gurugram, India",
  // From the resume he supplied directly — CONTENT_INTAKE.md suggests considering an alias
  // instead of a program email that expires with the degree; flag if you'd rather swap it.
  email: "aditya.mahajan2027@mastersunion.org",
  resumePath: "/Aditya-Mahajan-Resume.pdf",
  social: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/aditya-mahajan-29a7b9169/" },
    { label: "GitHub", url: "https://github.com/aditya-mahajan-tt" },
  ],
});
