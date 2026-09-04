import { navigation } from "@/data/navigation";
import { getAllProjects, getAllExperiments } from "@/data/queries";
import { isPlaceholder } from "@/data/schema";

export type CommandGroup = "Navigate" | "Work" | "Experiments";

export type CommandItem = {
  id: string;
  group: CommandGroup;
  label: string;
  detail?: string;
  href: string;
};

/** Falls back to the artifact id while a title is still a content placeholder. */
const titleOf = (title: string, fallback: string) => (isPlaceholder(title) ? fallback : title);

function buildIndex(): CommandItem[] {
  const routes: CommandItem[] = navigation.map((item) => ({
    id: `route-${item.href}`,
    group: "Navigate",
    label: item.label,
    detail: item.description,
    href: item.href,
  }));

  const projects: CommandItem[] = getAllProjects().map((p) => ({
    id: `project-${p.slug}`,
    group: "Work",
    label: titleOf(p.title, `PROJECT_${p.id}`),
    detail: p.category.join(" / "),
    href: `/work/${p.slug}`,
  }));

  const experiments: CommandItem[] = getAllExperiments().map((e) => ({
    id: `experiment-${e.slug}`,
    group: "Experiments",
    label: titleOf(e.title, `EXPERIMENT_${e.id}`),
    detail: e.type,
    href: `/experiments/${e.slug}`,
  }));

  return [...routes, ...projects, ...experiments];
}

/** Built once per module load — the corpus is static build-time content. */
const index = buildIndex();

/** Subsequence fuzzy match: every character of `query` must appear in `text`, in order. */
function fuzzyScore(query: string, text: string): number | null {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (q.length === 0) return 0;

  const exactIndex = t.indexOf(q);
  if (exactIndex !== -1) return exactIndex === 0 ? 0 : 1;

  let cursor = 0;
  let firstMatch = -1;
  let lastMatch = -1;

  for (const ch of q) {
    const found = t.indexOf(ch, cursor);
    if (found === -1) return null;
    if (firstMatch === -1) firstMatch = found;
    lastMatch = found;
    cursor = found + 1;
  }

  return 2 + (lastMatch - firstMatch);
}

/** Fuzzy-searches routes, projects and experiments. Empty query returns the top of the index. */
export function searchCommands(query: string, limit = 8): CommandItem[] {
  const trimmed = query.trim();
  if (!trimmed) return index.slice(0, limit);

  return index
    .map((item) => {
      const haystack = `${item.label} ${item.detail ?? ""}`;
      const score = fuzzyScore(trimmed, haystack);
      return score === null ? null : { item, score };
    })
    .filter((r): r is { item: CommandItem; score: number } => r !== null)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((r) => r.item);
}
