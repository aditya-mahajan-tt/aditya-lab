import { isPlaceholder } from "@/data/schema";

/**
 * Renders content, but makes any unfilled [X_REQUIRED] token impossible to
 * miss in development. In production these can never appear — the build
 * fails first (scripts/check-placeholders.mjs). See CLAUDE.md §7.
 */
export function Fill({ value, as: Tag = "span" }: { value: string; as?: "span" | "p" | "div" }) {
  if (!isPlaceholder(value)) return <Tag>{value}</Tag>;

  return (
    <Tag
      className="inline-block max-w-full break-all rounded-sm border border-dashed border-building/70 bg-building/10 px-2 py-0.5 font-mono text-xs tracking-widest text-building"
      title="Content required — see CONTENT_INTAKE.md"
    >
      {value}
    </Tag>
  );
}

/** True when a value is still a placeholder — use to hide empty sections. */
export const filled = (value: string | undefined): value is string =>
  !!value && !isPlaceholder(value);
