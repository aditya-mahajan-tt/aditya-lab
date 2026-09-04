import { NextRequest, NextResponse } from "next/server";
import { getKnowledge } from "@/lib/ai/knowledge";
import { buildSystemPrompt, REFUSAL_STRING } from "@/lib/ai/system-prompt";
import {
  AskRequestSchema,
  FRIENDLY_REDIRECT,
  isGrounded,
  isPromptInjection,
} from "@/lib/ai/guardrails";
import { checkRateLimit, getClientIp } from "@/lib/ai/rate-limit";
import { recordSpend, spendCapExceeded } from "@/lib/ai/spend-cap";
import { getCached, setCached } from "@/lib/ai/cache";
import { callGroq, type ChatMessage } from "@/lib/ai/groq-client";
import { suggestLink } from "@/lib/ai/link-suggestions";
import { logQuestion } from "@/lib/ai/log";

/**
 * "Ask the Lab" (AI_SPEC.md, PLAN.md Phase 10). Server-route-only access to
 * the AI provider — no key ever reaches the browser (ARCHITECTURE.md §7).
 *
 * Deliberately buffers the full model response and runs the grounding
 * check (guardrails.ts) BEFORE it ever reaches the client, rather than
 * forwarding a live token stream. AI_SPEC.md §6 asks for streaming, but its
 * own §4 output guardrail can only run on a complete answer — letting
 * ungrounded tokens paint the screen for even a moment, then retracting
 * them, is a worse failure than a slightly less "live" feel. CLAUDE.md §3's
 * "never invent personal facts" outranks the streaming request; the client
 * still shows a "thinking" state for the wait, and Groq is fast enough
 * (its whole appeal) that the difference is marginal in practice.
 */
export const runtime = "nodejs";

type AskResponse =
  | { status: "answered"; message: string; link?: { label: string; href: string }; cached?: boolean }
  | { status: "redirected"; message: string }
  | { status: "invalid" }
  | { status: "rate_limited" }
  | { status: "offline" };

export async function POST(req: NextRequest): Promise<NextResponse<AskResponse>> {
  const start = Date.now();
  const ip = getClientIp(req.headers);

  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json({ status: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const parsed = AskRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }
  const { question, history } = parsed.data;

  if (isPromptInjection(question)) {
    logQuestion({ question, outcome: "blocked", latencyMs: Date.now() - start });
    return NextResponse.json({ status: "redirected", message: FRIENDLY_REDIRECT });
  }

  const cached = getCached(question);
  if (cached) {
    logQuestion({ question, outcome: "cached", latencyMs: Date.now() - start });
    return NextResponse.json({ status: "answered", message: cached, cached: true });
  }

  // AI_SPEC.md §7: budget cap hit → silently serve canned-only, no error
  // shown. A free-form question isn't one of the six cached ones, so the
  // nearest honest behaviour is the same offline state as a real API
  // failure — no fabricated content either way.
  if (spendCapExceeded() || !process.env.AI_PROVIDER_API_KEY) {
    logQuestion({ question, outcome: "offline", latencyMs: Date.now() - start });
    return NextResponse.json({ status: "offline" });
  }

  const knowledge = getKnowledge();
  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(knowledge.text) },
    ...history.map((h): ChatMessage => ({ role: h.role, content: h.content })),
    { role: "user", content: question },
  ];

  try {
    const result = await callGroq(messages);
    let answer = result.text.trim();
    const grounded = isGrounded(answer, knowledge.text);
    if (!grounded) {
      answer = REFUSAL_STRING;
    }

    recordSpend(result.totalTokens);
    setCached(question, answer);
    logQuestion({
      question,
      outcome: grounded ? "answered" : "refused",
      latencyMs: Date.now() - start,
      totalTokens: result.totalTokens,
    });

    const link = grounded ? (suggestLink(answer) ?? undefined) : undefined;
    return NextResponse.json({ status: "answered", message: answer, link });
  } catch (err) {
    console.error("[ask-the-lab] Groq call failed:", err);
    logQuestion({ question, outcome: "offline", latencyMs: Date.now() - start });
    return NextResponse.json({ status: "offline" });
  }
}
