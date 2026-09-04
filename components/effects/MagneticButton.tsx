"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useMagnetic } from "@/lib/utils/useMagnetic";

/**
 * Magnetic pointer-follow on exactly four things sitewide (PLAN.md Phase 6):
 * the primary hero CTA, the contact CTA, the project card CTA, and the
 * command palette trigger. `MagneticLink` covers the first three; plain
 * buttons (the palette trigger) use `useMagnetic` directly since it's
 * already a client component with its own ref.
 */
export function MagneticLink({ className, ...props }: ComponentProps<typeof Link>) {
  const { triggerRef } = useMagnetic<HTMLAnchorElement>();
  return <Link ref={triggerRef} className={className} {...props} />;
}

export function MagneticButton({ className, ...props }: ComponentProps<"button">) {
  const { triggerRef } = useMagnetic<HTMLButtonElement>();
  return <button ref={triggerRef} className={className} {...props} />;
}
