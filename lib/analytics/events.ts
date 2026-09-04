import { track } from "@vercel/analytics";

/**
 * Typed analytics events (QA_AND_PERFORMANCE.md §8). `page_view` is
 * automatic via <Analytics /> in the root layout — everything else is
 * called explicitly at the interaction site. Events not yet wired
 * (project_scroll_complete, ask_lab_*, build_mode_toggle) belong to
 * features that don't exist until their own phase (10, 12) ships.
 */
export const analytics = {
  heroCtaClick: (cta: "enter_lab" | "explore_work") => track("hero_cta_click", { cta }),
  projectOpen: (slug: string) => track("project_open", { slug }),
  experimentOpen: (slug: string) => track("experiment_open", { slug }),
  commandPaletteOpen: (source: "keyboard" | "click") => track("command_palette_open", { source }),
  commandPaletteSelect: (target: string) => track("command_palette_select", { target }),
  resumeClick: () => track("resume_click"),
  contactClick: (channel: "email" | "linkedin" | "github") => track("contact_click", { channel }),
  webglFallback: (reason: string) => track("webgl_fallback", { reason }),
  qualityTier: (tier: string) => track("quality_tier", { tier }),
};
