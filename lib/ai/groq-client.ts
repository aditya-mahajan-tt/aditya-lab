/**
 * Groq's chat completions endpoint is OpenAI-compatible, so a plain
 * fetch() covers it with no SDK — ARCHITECTURE.md §1 requires asking
 * before adding a dependency, and none is needed here. Model, temperature
 * and token cap live in env vars (AI_SPEC.md §5), never in code.
 */

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS = 10_000; // AI_SPEC.md §7 — >10s is "offline", not "slow".

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type GroqResult = {
  text: string;
  totalTokens: number;
};

export async function callGroq(messages: ChatMessage[]): Promise<GroqResult> {
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  const model = process.env.AI_MODEL;
  if (!apiKey || !model) {
    throw new Error("AI_PROVIDER_API_KEY or AI_MODEL is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
        max_tokens: Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 200),
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
      usage?: { total_tokens?: number };
    };

    const text = data.choices[0]?.message.content ?? "";
    const totalTokens = data.usage?.total_tokens ?? 0;

    return { text, totalTokens };
  } finally {
    clearTimeout(timeout);
  }
}
