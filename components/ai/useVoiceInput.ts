"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceState = "unsupported" | "idle" | "recording" | "transcribing" | "error";

/**
 * Microphone capture for Ask the Lab, using only browser APIs — no
 * dependency, per ARCHITECTURE.md §1.
 *
 * Support is detected rather than assumed, and `unsupported` is a real
 * state the caller renders as "no button at all": Safari gained
 * MediaRecorder late, embedded webviews disable it, and any page served
 * over plain HTTP has no getUserMedia. A mic button that cannot record is
 * worse than no mic button, so the feature simply is not offered.
 */
const MAX_RECORDING_MS = 30_000;

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [state, setState] = useState<VoiceState>("unsupported");
  const [message, setMessage] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Runs after mount, never during render: `window` does not exist while
  // Next renders this on the server, and the first client render must match
  // that server HTML or React logs a hydration mismatch.
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      typeof window.MediaRecorder !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia;
    setState(supported ? "idle" : "unsupported");
  }, []);

  const cleanup = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  // A recorder left running when the dialog unmounts keeps the browser's
  // "recording" indicator lit, which reads as a site spying on you.
  useEffect(() => cleanup, [cleanup]);

  const send = useCallback(
    async (blob: Blob) => {
      setState("transcribing");
      try {
        const form = new FormData();
        form.append("audio", blob, "question.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = (await res.json()) as { status: string; text?: string; reason?: string };

        if (data.status === "transcribed" && data.text) {
          onTranscript(data.text);
          setState("idle");
          setMessage(null);
          return;
        }
        setState("error");
        setMessage(
          data.status === "rate_limited"
            ? "Too many recordings this hour. Type your question instead."
            : data.reason === "silent"
              ? "Nothing was picked up. Try again, or type it."
              : "Could not transcribe that. Type your question instead.",
        );
      } catch {
        setState("error");
        setMessage("Could not transcribe that. Type your question instead.");
      }
    },
    [onTranscript],
  );

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    setMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        cleanup();
        if (blob.size > 0) void send(blob);
        else setState("idle");
      };

      recorder.start();
      setState("recording");
      // A forgotten open microphone is both a privacy problem and a way to
      // exceed the upload cap; stop it for them.
      stopTimerRef.current = setTimeout(stop, MAX_RECORDING_MS);
    } catch (err) {
      cleanup();
      setState("error");
      setMessage(
        err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError")
          ? "Microphone permission denied. Type your question instead."
          : "No microphone available. Type your question instead.",
      );
    }
  }, [cleanup, send, stop]);

  const toggle = useCallback(() => {
    if (state === "recording") stop();
    else if (state === "idle" || state === "error") void start();
  }, [state, start, stop]);

  return { state, message, toggle };
}
