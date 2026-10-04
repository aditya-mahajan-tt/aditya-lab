import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { navigation } from "@/data/navigation";
import { getAllProjects, getAllExperiments, getAllWorkflows } from "@/data/queries";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    ...navigation.map((item) => ({
      url: `${site.url}${item.href === "/" ? "" : item.href}`,
      lastModified: now,
      priority: item.href === "/" ? 1 : 0.8,
    })),
    ...getAllProjects().map((p) => ({
      url: `${site.url}/work/${p.slug}`,
      lastModified: now,
      priority: 0.7,
    })),
    ...getAllExperiments().map((e) => ({
      url: `${site.url}/experiments/${e.slug}`,
      lastModified: now,
      priority: 0.6,
    })),
    ...getAllWorkflows().map((w) => ({
      url: `${site.url}/systems/${w.slug}`,
      lastModified: now,
      priority: 0.6,
    })),
  ];
}
