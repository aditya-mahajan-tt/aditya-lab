import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/ai/rate-limit";
import { transcriptionVocabulary } from "@/lib/ai/transcription-vocabulary";

/**
 * Voice input for Ask the Lab. Takes a short audio clip recorded in the
 * browser and returns text — which is placed in the input box for the
 * visitor to read and edit, never submitted automatically. Transcription
 * is not reliable enough to put words in someone's mouth and then answer
 * them; the review step is the feature, not friction.
 *
 * Server-route-only, like /api/ask: the provider key never reaches the
 * browser (ARCHITECTURE.md §7).
 *
 * whisper-large-v3-turbo draws on its own rate-limit pool — 7,200 audio
 * seconds and 2,000 requests a day, measured 2026-09-18 — so this costs
 * the chat models no answering capacity.
 */
export const runtime = "nodejs";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
const MODEL = "whisper-large-v3-turbo";
const TIMEOUT_MS = 15_000;

/**
 * A spoken question is a few seconds of audio. This is generous for that
 * and still far too small to be worth anyone's while as free transcription
 * for a podcast — the request is rejected before a byte reaches Groq.
 */
const MAX_BYTES = 4 * 1024 * 1024;

type TranscribeResponse =
  | { status: "transcribed"; text: string }
  | { status: "invalid"; reason: string }
  | { status: "rate_limited" }
  | { status: "offline" };

export async function POST(req: NextRequest): Promise<NextResponse<TranscribeResponse>> {
  const ip = getClientIp(req.headers);
  if (!checkRateLimit(ip, "transcribe").allowed) {
    return NextResponse.json({ status: "rate_limited" }, { status: 429 });
  }

  if (!process.env.AI_PROVIDER_API_KEY) {
    return NextResponse.json({ status: "offline" });
  }

  let audio: File | null = null;
  try {
    const form = await req.formData();
    const value = form.get("audio");
    if (value instanceof File) audio = value;
  } catch {
    return NextResponse.json({ status: "invalid", reason: "malformed" }, { status: 400 });
  }

  if (!audio) {
    return NextResponse.json({ status: "invalid", reason: "missing" }, { status: 400 });
  }
  if (audio.size === 0) {
    return NextResponse.json({ status: "invalid", reason: "empty" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ status: "invalid", reason: "too_large" }, { status: 413 });
  }
  // MediaRecorder labels its output audio/webm, audio/mp4 or audio/ogg
  // depending on the browser. Anything outside that family is not a clip
  // this feature produced.
  if (!audio.type.startsWith("audio/") && !audio.type.startsWith("video/webm")) {
    return NextResponse.json({ status: "invalid", reason: "type" }, { status: 415 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body = new FormData();
    body.append("file", audio, audio.name || "question.webm");
    body.append("model", MODEL);
    body.append("response_format", "json");
    // Biases the transcriber toward the names this site is asked about.
    body.append("prompt", transcriptionVocabulary());
    // Answers are English-only, so pinning the language stops a noisy clip
    // being "detected" as another one and coming back as nonsense.
    body.append("language", "en");

    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.AI_PROVIDER_API_KEY}` },
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`[ask-the-lab] transcription failed: ${response.status} ${await response.text()}`);
      return NextResponse.json({ status: "offline" });
    }

    const data = (await response.json()) as { text?: string };
    const text = (data.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ status: "invalid", reason: "silent" }, { status: 422 });
    }

    // The question box caps at 500 characters; returning more would produce
    // an input the visitor cannot submit without editing it down.
    return NextResponse.json({ status: "transcribed", text: text.slice(0, 500) });
  } catch (err) {
    console.error("[ask-the-lab] transcription call failed:", err);
    return NextResponse.json({ status: "offline" });
  } finally {
    clearTimeout(timeout);
  }
}
