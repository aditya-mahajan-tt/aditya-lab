"use client";

import { useEffect, useRef, useState } from "react";

type SpeakState = "idle" | "loading" | "playing";

/**
 * Reads one answer aloud. Rendered only when spoken answers are switched on
 * (see app/api/speak/route.ts — the TTS model needs terms accepted on the
 * Groq account first), so this component never appears as a button that
 * cannot work.
 *
 * The audio is fetched on demand rather than with the answer: most visitors
 * will never press it, and pre-fetching speech for every message would
 * spend the rate-limit budget on silence.
 */
export function SpeakButton({ text, onUnavailable }: { text: string; onUnavailable?: () => void }) {
  const [state, setState] = useState<SpeakState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  // An object URL is a live reference to a blob the browser is holding in
  // memory; without this the audio for every answer stays there until the
  // tab closes.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function play() {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }

    if (urlRef.current && audioRef.current) {
      void audioRef.current.play();
      setState("playing");
      return;
    }

    setState("loading");
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        setState("idle");
        // "disabled" means the model itself cannot serve this account —
        // unaccepted terms, or a voice it does not have. Retire the control
        // rather than leaving a button that fails on every press.
        const body = (await res.json().catch(() => null)) as { status?: string } | null;
        if (body?.status === "disabled") onUnavailable?.();
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("idle");
      audioRef.current = audio;
      await audio.play();
      setState("playing");
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void play()}
      data-cursor="interact"
      aria-label={state === "playing" ? "Stop reading this answer" : "Read this answer aloud"}
      className="font-mono text-xs uppercase tracking-widest text-text-faint transition-colors duration-[var(--duration-fast)] hover:text-accent"
    >
      {state === "loading" ? "Loading" : state === "playing" ? "■ Stop" : "▸ Listen"}
    </button>
  );
}
