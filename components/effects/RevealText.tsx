"use client";

import type { ReactNode } from "react";
import { useScrollReveal } from "@/lib/utils/useScrollReveal";

/** Fades + rises a block of content in as it scrolls into view. See PLAN.md Phase 6. */
export function RevealText({
  children,
  className,
  delay,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useScrollReveal<HTMLDivElement>({ delay });
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
