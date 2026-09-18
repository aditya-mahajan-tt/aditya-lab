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
/**
 * Synthesis time scales with the text: 254 characters took 3.0s and 54 took
 * 0.8s, measured 2026-09-18. At that rate the MAX_CHARS cap below lands near
 * 14s, which 15s would have clipped for the longest answers only — the
 * failure mode where a feature looks fine until someone asks a real
 * question. This is not the 10s answer budget in AI_SPEC §7: nobody is
 * waiting on a blank screen here, they already have the answer in text and
 * pressed a button to also hear it.
 */
const TIMEOUT_MS = 25_000;

/** Long enough for any 2-4 sentence answer, short enough to be useless as a service. */
const MAX_CHARS = 1_200;

/**
 * The voices canopylabs/orpheus-v1-english actually accepts, read off the
 * API's own rejection on 2026-09-18 and confirmed one by one — all six
 * return audio. The model does NOT take Orpheus's widely documented default
 * ("tara"), which this route originally used: every call failed with
 * `voice must be one of the following voices: [...]`, and because that is a
 * 400 like the terms error, it would have looked like the terms were still
 * unaccepted rather than like a bad parameter.
 *
 * Validated here rather than passed through, so a typo in AI_TTS_VOICE
 * degrades to a working default instead of breaking every answer's audio.
 */
const VOICES = ["autumn", "diana", "hannah", "austin", "daniel", "troy"] as const;
const DEFAULT_VOICE = "daniel";

function voice(): string {
  const configured = process.env.AI_TTS_VOICE?.trim().toLowerCase();
  if (configured && (VOICES as readonly string[]).includes(configured)) return configured;
  if (configured) {
    console.warn(`[ask-the-lab] AI_TTS_VOICE="${configured}" is not one of ${VOICES.join(", ")}; using ${DEFAULT_VOICE}.`);
  }
  return DEFAULT_VOICE;
}

/**
 * Capability probe. The chat UI is a client component and cannot read
 * server env, and a feature flag does not belong in a NEXT_PUBLIC_ variable
 * where it ships to every visitor whether or not they open the assistant.
 * One cheap GET when the dialog opens keeps the switch server-side.
 *
 * It answers from configuration and does NOT synthesise anything to check.
 * An earlier version did, to catch the case where AI_TTS_MODEL is set but
 * the model is unusable — but Groq allows only 100 speech requests a DAY
 * (measured 2026-09-18, against 1,000 for chat). On serverless, every cold
 * start is a fresh module scope and therefore a fresh probe, so verifying
 * availability would have spent the budget for reading answers aloud on
 * repeatedly asking whether answers can be read aloud.
 *
 * Correctness is preserved at the other end instead: a synthesis rejected
 * for terms or an invalid voice records the failure below, so the control
 * retires itself after at most one press rather than failing forever.
 */
const UNAVAILABLE_TTL_MS = 10 * 60 * 1000;

/** Set when the provider says this model cannot serve us; expires so accepting terms self-heals. */
let unavailableSince: number | null = null;

function markUnavailable() {
  unavailableSince = Date.now();
}

function configured(): boolean {
  if (!process.env.AI_TTS_MODEL?.trim() || !process.env.AI_PROVIDER_API_KEY) return false;
  if (unavailableSince && Date.now() - unavailableSince < UNAVAILABLE_TTL_MS) return false;
  return true;
}

export function GET() {
  return NextResponse.json({ enabled: configured() });
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
        voice: voice(),
        response_format: "wav",
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(`[ask-the-lab] speech failed: ${response.status} ${detail}`);
      // The terms-acceptance case is a configuration problem, not an
      // outage, and saying so is what tells Aditya to go and accept them.
      // A refusal that is about the model rather than this one request
      // means the control should stop being offered: unaccepted terms, or
      // a voice this model does not have. Both are 400s that would
      // otherwise repeat on every answer.
      const unusable =
        detail.includes("model_terms_required") || detail.includes("voice must be one of");
      if (unusable) markUnavailable();
      return NextResponse.json({ status: unusable ? "disabled" : "offline" }, { status: 503 });
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
