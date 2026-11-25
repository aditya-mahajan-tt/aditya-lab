import { NextRequest, NextResponse } from "next/server";
import { getKnowledge, selectKnowledge, selectSectionIds } from "@/lib/ai/knowledge";
import { buildSystemPrompt, REFUSAL_STRING } from "@/lib/ai/system-prompt";
import {
  AskRequestSchema,
  FRIENDLY_REDIRECT,
  findUngrounded,
  isPromptInjection,
  sanitizeAnswer,
} from "@/lib/ai/guardrails";
import { checkRateLimit, getClientIp } from "@/lib/ai/rate-limit";
import { recordSpend, spendCapExceeded } from "@/lib/ai/spend-cap";
import { getCached, setCached } from "@/lib/ai/cache";
import { callGroq, type ChatMessage } from "@/lib/ai/groq-client";
import { stripUnknownInternalPaths, suggestLinks } from "@/lib/ai/link-suggestions";
import { logQuestion } from "@/lib/ai/log";
import { isInjectionByClassifier } from "@/lib/ai/prompt-guard";

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
  | {
      status: "answered";
      message: string;
      links?: { label: string; href: string }[];
      cached?: boolean;
    }
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

  // Two layers, because each misses what the other catches. The regex is
  // free and instant and catches persona-swaps ("you are now Aditya") that
  // Prompt Guard scores as harmless; Prompt Guard catches the phrasings
  // nobody wrote a pattern for. Regex first, so an obvious attempt never
  // costs a network round trip. See lib/ai/prompt-guard.ts for the scores.
  if (isPromptInjection(question) || (await isInjectionByClassifier(question))) {
    logQuestion({ question, outcome: "blocked", latencyMs: Date.now() - start });
    return NextResponse.json({ status: "redirected", message: FRIENDLY_REDIRECT });
  }

  // The cache is keyed on the question text alone, so only a context-free
  // question may touch it: "tell me more about that" means something
  // different in every conversation (2026-11-25).
  const useCache = history.length === 0;
  const cached = useCache ? getCached(question) : null;
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

  // Retrieval is per-question (AI_SPEC.md §2): the whole corpus no longer
  // fits one request's token allowance, so the model is shown only these
  // sections. The grounding check below, though, runs against the FULL
  // corpus (2026-11-25): a fact stated anywhere in the portfolio is not
  // fabricated, and checking only the retrieved slice refused correct
  // answers whose supporting section simply was not retrieved.
  //
  // The last two turns (both roles: the assistant turn is what names the
  // entity) join the question as retrieval context, so a follow-up such as
  // "tell me more about that" is grounded in what it refers to.
  const context = history.slice(-2).map((h) => h.content);
  const knowledge = selectKnowledge(question, context);
  const sections = selectSectionIds(question, context);
  // Prior refusals / redirects (and the question that drew them) are dropped
  // from what the model sees: replayed, they prime it to refuse again.
  const cleanHistory = history.filter((h, i) => {
    const isCanned = (t: typeof h) =>
      t.role === "assistant" && (t.content === REFUSAL_STRING || t.content === FRIENDLY_REDIRECT);
    const next = history[i + 1];
    return !isCanned(h) && !(h.role === "user" && next && isCanned(next));
  });
  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(knowledge.text) },
    ...cleanHistory.map((h): ChatMessage => ({ role: h.role, content: h.content })),
    { role: "user", content: question },
  ];

  try {
    const result = await callGroq(messages);
    // Sanitize before grounding, not after: a stray URL or citation marker
    // should clean up, not cost the visitor an otherwise correct answer.
    let answer = stripUnknownInternalPaths(sanitizeAnswer(result.text));
    const ungrounded = findUngrounded(answer, getKnowledge().text);
    const grounded = ungrounded.length === 0;
    if (!grounded) {
      answer = REFUSAL_STRING;
    }

    recordSpend(result.totalTokens);
    // Only cache real answers. The grounding check is deliberately cheap and
    // imperfect (guardrails.ts), so it will occasionally reject a correct
    // answer over one unlucky word. Caching that outcome froze the refusal
    // in for 24h and, worse, baked it into the pre-generated canned answers
    // — "What technologies does he use?" shipped as "I don't have that in
    // Aditya's portfolio." on a page whose whole point is the technologies.
    // A retry costs one cheap API call; a stuck refusal costs a recruiter.
    if (grounded && useCache) {
      setCached(question, answer);
    }
    logQuestion({
      question,
      outcome: grounded ? "answered" : "refused",
      latencyMs: Date.now() - start,
      totalTokens: result.totalTokens,
      model: result.model,
      failedOver: result.failedOver,
      sections,
      ungrounded,
    });

    // A bare refusal is a dead end; point at the work so the visitor has a
    // next step (2026-11-25).
    const links = grounded
      ? suggestLinks(answer, question)
      : [{ label: "Browse the work", href: "/work" }];
    return NextResponse.json({
      status: "answered",
      message: answer,
      ...(links.length > 0 ? { links } : {}),
    });
  } catch (err) {
    console.error("[ask-the-lab] Groq call failed:", err);
    logQuestion({ question, outcome: "offline", latencyMs: Date.now() - start });
    return NextResponse.json({ status: "offline" });
  }
}
