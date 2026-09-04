import { isPlaceholder, isDraft, stripDraftMarker } from "@/data/schema";

/**
 * Renders content, but makes any unfilled [X_REQUIRED] token — or any
 * content Claude Code drafted from source material rather than Aditya's
 * own words — impossible to miss in development. In production, both
 * states fail the build first (scripts/check-placeholders.mjs). See
 * CLAUDE.md §7 and data/schema.ts's DRAFT_MARKER comment.
 */
export function Fill({ value, as: Tag = "span" }: { value: string; as?: "span" | "p" | "div" }) {
  if (isPlaceholder(value)) {
    return (
      <Tag
        className="inline-block max-w-full break-all rounded-sm border border-dashed border-building/70 bg-building/10 px-2 py-0.5 font-mono text-xs tracking-widest text-building"
        title="Content required — see CONTENT_INTAKE.md"
      >
        {value}
      </Tag>
    );
  }

  if (isDraft(value)) {
    return (
      <Tag
        className="inline-block max-w-full rounded-sm border border-dashed border-accent/70 bg-accent/10 px-2 py-0.5 text-accent"
        title="AI-drafted from supplied source material — review and rewrite in your own voice before this ships."
      >
        {stripDraftMarker(value)}
      </Tag>
    );
  }

  return <Tag>{value}</Tag>;
}

/**
 * True when a value is present and not an [X_REQUIRED] placeholder — used
 * to decide whether to render a section at all. Draft-marked content
 * counts as filled (it's real, usable text that just needs review, not
 * missing); this function is never used on a field the draft marker could
 * appear in, since those always route through <Fill> instead of raw
 * interpolation (e.g. a mailto: URL), where the marker would otherwise leak.
 */
export const filled = (value: string | undefined): value is string =>
  !!value && !isPlaceholder(value);
