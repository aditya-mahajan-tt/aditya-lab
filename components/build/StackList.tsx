import { buildMode } from "@/data/build";
import { stackIcons } from "@/components/icons/StackIcons";

/** PLAN.md Phase 12 — the actual stack, grouped and iconified. Objective, not a claim. */
export function StackList() {
  return (
    <ul className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {buildMode.stack.map((category) => {
        const Icon = stackIcons[category.id];
        return (
          <li key={category.id} className="flex flex-col gap-3 bg-surface p-6">
            <Icon className="h-6 w-6 text-accent" />
            <h3 className="font-mono text-sm uppercase tracking-widest text-text">{category.id}</h3>
            <p className="text-sm text-text-muted">{category.tools.join(" · ")}</p>
          </li>
        );
      })}
    </ul>
  );
}
