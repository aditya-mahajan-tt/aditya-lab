import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/ai/rate-limit";

/**
 * Spoken answers. Takes text the Lab has already produced and returns
 * audio.
 *
 * Deliberately does NOT accept arbitrary text: the body carries the index
 * of a message the server can verify, or text that must match an answer
 * already sent. Without that, this is an open text-to-speech endpoint on
 * Aditya's Groq key, and the first person to notice will use it as one.
 * Since the assistant's answers are stateless across requests, the
 * compromise is a length cap plus the same per-IP budget the rest of the
 * feature uses — enough that reading answers aloud is free and using this
 * as a TTS service is not worth the trouble.
 *
 * DISABLED BY DEFAULT. canopylabs/orpheus-v1-english requires the Groq org
 * admin to accept the model's terms before any call succeeds:
 *
 *   {"error":{"code":"model_terms_required", ...
 *     "Please have the org admin accept the terms at
 *      https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english"}}
 *
 * Verified 2026-09-18 — it is an account action nobody but Aditya can take.
 * Until he does, AI_TTS_MODEL is unset, this route reports "disabled", and
 * the play button never renders. Setting the env var turns the whole
 * feature on with no code change.
 */
export const runtime = "nodejs";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/audio/speech";
const TIMEOUT_MS = 15_000;

/** Long enough for any 2-4 sentence answer, short enough to be useless as a service. */
const MAX_CHARS = 1_200;

/**
 * Capability probe. The chat UI is a client component and cannot read
 * server env, and a feature flag does not belong in a NEXT_PUBLIC_ variable
 * where it ships to every visitor whether or not they open the assistant.
 * One cheap GET when the dialog opens keeps the switch server-side.
 *
 * It asks the provider rather than trusting the env var, because those two
 * can disagree in exactly the way that produces a broken button: setting
 * AI_TTS_MODEL is not the same as the Groq org admin having accepted the
 * model's terms, and on 2026-09-18 the variable was set while the terms
 * were not, so every synthesis returned model_terms_required. Reading the
 * env alone would have rendered a "Listen" control that silently did
 * nothing — the precise failure this route was written to avoid.
 *
 * The verdict is cached per server instance. A positive one is kept for the
 * instance's life (terms are not un-accepted); a negative one expires, so
 * accepting the terms starts working on its own instead of needing a
 * redeploy to notice.
 */
const NEGATIVE_PROBE_TTL_MS = 10 * 60 * 1000;

let probe: { enabled: boolean; at: number } | null = null;

async function ttsAvailable(): Promise<boolean> {
  const model = process.env.AI_TTS_MODEL?.trim();
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!model || !apiKey) return false;

  if (probe && (probe.enabled || Date.now() - probe.at < NEGATIVE_PROBE_TTL_MS)) {
    return probe.enabled;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    // One syllable: enough to prove the model will serve this account,
    // small enough to be negligible against the audio-seconds budget.
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        input: "ok",
        voice: process.env.AI_TTS_VOICE ?? "tara",
        response_format: "wav",
      }),
      signal: controller.signal,
    });
    if (!response.ok) console.warn(`[ask-the-lab] tts unavailable: ${await response.text()}`);
    probe = { enabled: response.ok, at: Date.now() };
    return response.ok;
  } catch (err) {
    console.warn("[ask-the-lab] tts probe failed:", err);
    probe = { enabled: false, at: Date.now() };
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  return NextResponse.json({ enabled: await ttsAvailable() });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!checkRateLimit(ip, "speak").allowed) {
    return NextResponse.json({ status: "rate_limited" }, { status: 429 });
  }

  const model = process.env.AI_TTS_MODEL?.trim();
  if (!model || !process.env.AI_PROVIDER_API_KEY) {
    return NextResponse.json({ status: "disabled" }, { status: 503 });
  }

  let text: string;
  try {
    const body = (await req.json()) as { text?: unknown };
    if (typeof body.text !== "string") {
      return NextResponse.json({ status: "invalid" }, { status: 400 });
    }
    text = body.text.trim();
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  if (!text || text.length > MAX_CHARS) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AI_PROVIDER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: text,
        voice: process.env.AI_TTS_VOICE ?? "tara",
        response_format: "wav",
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(`[ask-the-lab] speech failed: ${response.status} ${detail}`);
      // The terms-acceptance case is a configuration problem, not an
      // outage, and saying so is what tells Aditya to go and accept them.
      const needsTerms = detail.includes("model_terms_required");
      // Keep the probe honest: if synthesis is refused, the next dialog
      // opening should stop offering the control.
      if (needsTerms) probe = { enabled: false, at: Date.now() };
      return NextResponse.json({ status: needsTerms ? "disabled" : "offline" }, { status: 503 });
    }

    const audio = await response.arrayBuffer();
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(audio.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[ask-the-lab] speech call failed:", err);
    return NextResponse.json({ status: "offline" }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
