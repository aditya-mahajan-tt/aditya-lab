import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * One flat global store. See ARCHITECTURE.md §4.
 * Nothing derivable lives here. No server data lives here.
 * Only `soundEnabled` and `quality` are persisted.
 */

export type Quality = "auto" | "high" | "medium" | "low";

type LabState = {
  activeSection: string | null;
  commandPaletteOpen: boolean;
  menuOpen: boolean;
  aiOpen: boolean;
  buildMode: boolean;
  soundEnabled: boolean;
  quality: Quality;
  webglAvailable: boolean | null;
  reducedMotion: boolean;
  bootComplete: boolean;

  setActiveSection: (id: string | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  setAiOpen: (open: boolean) => void;
  toggleBuildMode: () => void;
  setSoundEnabled: (on: boolean) => void;
  setQuality: (q: Quality) => void;
  setWebglAvailable: (ok: boolean) => void;
  setReducedMotion: (on: boolean) => void;
  setBootComplete: (done: boolean) => void;
};

export const useLabStore = create<LabState>()(
  persist(
    (set) => ({
      activeSection: null,
      commandPaletteOpen: false,
      menuOpen: false,
      aiOpen: false,
      buildMode: false,
      soundEnabled: false,
      quality: "auto",
      webglAvailable: null,
      reducedMotion: false,
      bootComplete: false,

      setActiveSection: (id) => set({ activeSection: id }),
      // The menu overlay, the command palette and Ask the Lab are mutually
      // exclusive — competing full-screen overlays with their own focus
      // traps must never be open at once.
      setCommandPaletteOpen: (open) =>
        set((s) => ({
          commandPaletteOpen: open,
          menuOpen: open ? false : s.menuOpen,
          aiOpen: open ? false : s.aiOpen,
        })),
      setMenuOpen: (open) =>
        set((s) => ({
          menuOpen: open,
          commandPaletteOpen: open ? false : s.commandPaletteOpen,
          aiOpen: open ? false : s.aiOpen,
        })),
      setAiOpen: (open) =>
        set((s) => ({
          aiOpen: open,
          menuOpen: open ? false : s.menuOpen,
          commandPaletteOpen: open ? false : s.commandPaletteOpen,
        })),
      toggleBuildMode: () => set((s) => ({ buildMode: !s.buildMode })),
      setSoundEnabled: (on) => set({ soundEnabled: on }),
      setQuality: (q) => set({ quality: q }),
      setWebglAvailable: (ok) => set({ webglAvailable: ok }),
      setReducedMotion: (on) => set({ reducedMotion: on }),
      setBootComplete: (done) => set({ bootComplete: done }),
    }),
    {
      name: "aditya-lab",
      partialize: (s) => ({ soundEnabled: s.soundEnabled, quality: s.quality }),
    },
  ),
);
