import { site } from "@/data/site";
import { filled } from "@/components/ui/Placeholder";

/** JSON-LD Person schema (PLAN.md Phase 7 / QA_AND_PERFORMANCE.md §9). */
export function PersonJsonLd() {
  const sameAs = site.social.filter((s) => filled(s.url)).map((s) => s.url);

  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.author,
    url: site.url,
    description: site.description,
    ...(filled(site.email) && { email: `mailto:${site.email}` }),
    ...(sameAs.length > 0 && { sameAs }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
