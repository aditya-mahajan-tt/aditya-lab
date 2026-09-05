/**
 * PLAN.md Phase 15 — "Sound default OFF with a visible control." Every tone
 * is synthesized with the Web Audio API rather than shipped as an audio
 * asset: no binary to source or license, and it keeps the bundle unchanged
 * (ARCHITECTURE.md's "can the existing stack solve this cleanly?" test).
 * Gated on useLabStore's `soundEnabled` (default false, persisted) at every
 * call site — this module never checks the store itself, so it stays usable
 * outside React.
 */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type ToneKind = "blip" | "success" | "denied" | "thud";

const TONES: Record<ToneKind, { frequencies: number[]; duration: number; type: OscillatorType }> = {
  blip: { frequencies: [880], duration: 0.06, type: "sine" },
  success: { frequencies: [523.25, 783.99], duration: 0.18, type: "sine" },
  denied: { frequencies: [196, 146.83], duration: 0.22, type: "square" },
  thud: { frequencies: [110], duration: 0.09, type: "triangle" },
};

/** Plays a short synthesized tone. Silently no-ops without a usable AudioContext (SSR, unsupported browser). */
export function playTone(kind: ToneKind) {
  const audioCtx = getContext();
  if (!audioCtx) return;

  const { frequencies, duration, type } = TONES[kind];
  const now = audioCtx.currentTime;
  const step = duration / frequencies.length;

  frequencies.forEach((frequency, i) => {
    const start = now + i * step;
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.08, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + step);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start(start);
    oscillator.stop(start + step);
  });
}
