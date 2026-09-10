import { SiteSchema } from "./schema";

/**
 * CONTENT_INTAKE.md §A — supply the real values, then delete the placeholders.
 *
 * `NEXT_PUBLIC_SITE_URL` is meant to be set explicitly in the Vercel
 * project's production environment — that's the source of truth and should
 * still be set there. This fallback chain exists only so a missing/unset
 * env var degrades to Vercel's own deployment URL instead of silently
 * resolving to `localhost` in production, which is what broke every shared
 * link's OG preview and the sitemap (Diagnostic Report §13). `VERCEL_URL`
 * is set automatically by the platform on every deployment and has no
 * protocol prefix, unlike `NEXT_PUBLIC_SITE_URL`.
 */
const resolveSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
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
