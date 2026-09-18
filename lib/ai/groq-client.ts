/**
 * Groq's chat completions endpoint is OpenAI-compatible, so a plain
 * fetch() covers it with no SDK — ARCHITECTURE.md §1 requires asking
 * before adding a dependency, and none is needed here. Model, temperature
 * and token caps live in env vars (AI_SPEC.md §5), never in code.
 */

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS = 10_000; // AI_SPEC.md §7 — >10s is "offline", not "slow".

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type GroqResult = {
  text: string;
  totalTokens: number;
  /** Which model actually answered — logged, so failover is visible in the data. */
  model: string;
  /** Models tried and rejected before this one, in order. */
  failedOver: string[];
};

/**
 * Groq's token-per-minute limits are enforced PER MODEL, on separate
 * budgets — confirmed by reading x-ratelimit-limit-tokens across the
 * account's catalogue on 2026-09-18: gpt-oss-20b, gpt-oss-120b and
 * qwen3.8-27b each carry their own 8,000 TPM. The grounding corpus is
 * ~5k tokens per request, so a single model tops out near one question a
 * minute site-wide, and a second visitor gets "AI CORE OFFLINE".
 *
 * Trying the models in sequence therefore multiplies real capacity without
 * any routing intelligence: the chain is a reliability device, not an
 * attempt to match questions to a model's expertise. Every question here
 * is the same shape — retrieve from one small corpus, answer in 2-4
 * sentences — so there is nothing to route on, and a classifier call to
 * decide would cost more latency than it could ever save.
 *
 * Note what this does NOT buy: one request still cannot exceed one model's
 * 8,000 TPM, because a single call is served by a single model. Failover
 * raises throughput, never the ceiling on corpus size — that is
 * knowledge.ts's budget check.
 */
function modelChain(): string[] {
  const primary = process.env.AI_MODEL?.trim();
  const fallbacks = (process.env.AI_MODEL_FALLBACKS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  // A model named twice would burn an attempt on a budget already known to
  // be exhausted.
  return [...new Set([primary, ...fallbacks].filter((m): m is string => !!m))];
}

/**
 * Groq's openai/gpt-oss-* models are reasoning models: their hidden
 * "thinking" tokens count against max_tokens alongside the visible
 * answer, and against a prompt as long as ours (nine system-prompt rules
 * plus the knowledge block) that reasoning alone can consume the entire
 * budget, coming back with content: "". reasoning_effort: "low" caps that
 * overhead — confirmed against the live API before shipping, not guessed.
 * Harmless to omit for non-reasoning model families such as qwen.
 */
function isReasoningModel(model: string): boolean {
  return model.startsWith("openai/gpt-oss");
}

/**
 * A bad or revoked key fails identically on every model, so there is
 * nothing to fail over to — rethrow immediately instead of burning the
 * deadline proving it twice more. A distinct class, because this is thrown
 * from inside the try block that otherwise treats every error as
 * "try the next model".
 */
class FatalGroqError extends Error {}

function isFatalStatus(status: number): boolean {
  return status === 401 || status === 403;
}

export async function callGroq(messages: ChatMessage[]): Promise<GroqResult> {
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  const chain = modelChain();
  if (!apiKey || chain.length === 0) {
    throw new Error("AI_PROVIDER_API_KEY or AI_MODEL is not configured");
  }

  // One deadline for the whole chain, not one per attempt. AI_SPEC.md §7
  // promises the visitor an offline state after 10s; three sequential
  // 10s attempts would make that 30s of staring at a spinner, which is a
  // worse experience than the honest failure it was trying to avoid.
  const deadline = Date.now() + TIMEOUT_MS;
  const failedOver: string[] = [];
  let lastError: Error | null = null;

  for (const model of chain) {
    const remaining = deadline - Date.now();
    // Under a second left is not enough for a useful attempt; stop and let
    // the caller show the offline state rather than burn the budget.
    if (remaining < 1_000) break;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), remaining);

    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: Number(process.env.AI_TEMPERATURE ?? 0.3),
          max_tokens: Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 500),
          stream: false,
          ...(isReasoningModel(model) ? { reasoning_effort: "low" } : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        const message = `Groq API error on ${model}: ${response.status} ${body}`;
        if (isFatalStatus(response.status)) throw new FatalGroqError(message);
        const error = new Error(message);
        // 429 (this model's per-minute budget is spent), 5xx, and model-
        // specific 4xx such as model_terms_required all mean "this model
        // can't serve it" — which is exactly what the next model is for.
        lastError = error;
        failedOver.push(model);
        continue;
      }

      const data = (await response.json()) as {
        choices: { message: { content: string } }[];
        usage?: { total_tokens?: number };
      };

      const text = data.choices[0]?.message.content ?? "";
      // An empty completion is a real outcome for a reasoning model that
      // spent its whole budget thinking. Treat it as a failed attempt so
      // the next model gets a turn, rather than returning "" for the
      // grounding check to reject as an answer the visitor never sees.
      if (text.trim() === "") {
        lastError = new Error(`Groq returned an empty completion on ${model}`);
        failedOver.push(model);
        continue;
      }

      return {
        text,
        totalTokens: data.usage?.total_tokens ?? 0,
        model,
        failedOver,
      };
    } catch (err) {
      if (err instanceof FatalGroqError) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
      failedOver.push(model);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("Groq call failed with no models attempted");
}
