"use client";

import { useRef, useState } from "react";
import { useKonamiCode } from "@/lib/utils/useKonamiCode";
import { useLabStore } from "@/lib/store";
import { playTone } from "@/lib/sound";
import { analytics } from "@/lib/analytics/events";
import { Toast } from "@/components/ui/Toast";

const TOAST_DURATION_MS = 5000;

/**
 * PLAN.md Phase 15. Mounted once in the root layout, invisible until
 * triggered. Never blocks or delays anything else on the page — see
 * CLAUDE.md §2, the recruiter path always wins.
 */
export function KonamiListener() {
  const soundEnabled = useLabStore((s) => s.soundEnabled);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useKonamiCode(() => {
    if (soundEnabled) playTone("success");
    analytics.easterEggFound("konami");
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), TOAST_DURATION_MS);
  });

  if (!visible) return null;
  return <Toast message="KONAMI CODE ACCEPTED — ACCESS GRANTED" href="/experiments/hidden" />;
}
