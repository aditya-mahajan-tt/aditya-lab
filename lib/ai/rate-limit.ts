/**
 * In-memory rate limiter (AI_SPEC.md §5): per-IP hourly window + a
 * site-wide daily window. State lives in module scope, so it only holds
 * across warm invocations of the same server process — on Vercel that
 * means it's per-lambda-instance, not truly global across regions/cold
 * starts. Acceptable for this site's traffic (a personal portfolio, not a
 * SaaS product): the hard backstops are the daily cap resetting worst-case
 * once per instance and the spend cap in spend-cap.ts. A durable limiter
 * would need Vercel KV/Upstash — a new dependency not yet approved in
 * ARCHITECTURE.md — flagged as a known limitation, not silently fixed.
 */

type Bucket = { count: number; resetAt: number };

const HOUR_MS = 60 * 60 * 1000;

const PER_IP_LIMIT = Number(process.env.AI_RATE_LIMIT_PER_IP_PER_HOUR ?? 10);

/**
 * Site-wide daily caps, per endpoint rather than pooled.
 *
 * A single shared bucket let voice traffic starve the thing the feature
 * exists for: a visitor playing answers aloud would spend the same daily
 * allowance as a recruiter trying to ask a question. They also face very
 * different upstream limits — Groq allows 1,000 chat requests a day but
 * only 100 speech ones (measured 2026-09-18), so one number cannot be
 * correct for both.
 *
 * Speech is capped below Groq's own 100 so the Lab refuses politely, in its
 * own voice, instead of letting the provider return an error we then have
 * to explain.
 */
const GLOBAL_DAILY_LIMITS: Record<Scope, number> = {
  ask: Number(process.env.AI_RATE_LIMIT_GLOBAL_PER_DAY ?? 200),
  transcribe: Number(process.env.AI_RATE_LIMIT_TRANSCRIBE_PER_DAY ?? 200),
  speak: Number(process.env.AI_RATE_LIMIT_SPEAK_PER_DAY ?? 80),
};

const ipBuckets = new Map<string, Bucket>();
const globalBuckets = new Map<Scope, Bucket>();

let callsSinceCleanup = 0;

function startOfNextUtcDay(): number {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next;
}

/** Sweeps expired IP buckets every so often instead of on every call. */
function maybeCleanup() {
  callsSinceCleanup += 1;
  if (callsSinceCleanup < 500) return;
  callsSinceCleanup = 0;
  const now = Date.now();
  for (const [key, bucket] of ipBuckets) {
    if (bucket.resetAt <= now) ipBuckets.delete(key);
  }
}

export type Scope = "ask" | "transcribe" | "speak";

export type RateLimitResult = { allowed: true } | { allowed: false; reason: "ip" | "global" };

/**
 * `scope` keeps separate budgets for separate endpoints. Voice transcription
 * shares an IP with the questions that follow it, but spending a visitor's
 * ten hourly questions on the act of dictating them would be absurd — a
 * spoken question costs one transcribe and one ask, and each is counted in
 * its own bucket.
 */
export function checkRateLimit(ip: string, scope: Scope = "ask"): RateLimitResult {
  maybeCleanup();
  const now = Date.now();
  const key = `${scope}:${ip}`;

  let globalBucket = globalBuckets.get(scope);
  if (!globalBucket || globalBucket.resetAt <= now) {
    globalBucket = { count: 0, resetAt: startOfNextUtcDay() };
    globalBuckets.set(scope, globalBucket);
  }
  if (globalBucket.count >= GLOBAL_DAILY_LIMITS[scope]) {
    return { allowed: false, reason: "global" };
  }

  let bucket = ipBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + HOUR_MS };
    ipBuckets.set(key, bucket);
  }
  if (bucket.count >= PER_IP_LIMIT) {
    return { allowed: false, reason: "ip" };
  }

  bucket.count += 1;
  globalBucket.count += 1;
  return { allowed: true };
}

/** First IP in x-forwarded-for (set by Vercel's edge network), else a shared fallback bucket. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
