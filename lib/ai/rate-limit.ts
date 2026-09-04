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
const GLOBAL_DAILY_LIMIT = Number(process.env.AI_RATE_LIMIT_GLOBAL_PER_DAY ?? 200);

const ipBuckets = new Map<string, Bucket>();
let globalBucket: Bucket = { count: 0, resetAt: startOfNextUtcDay() };

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
  for (const [ip, bucket] of ipBuckets) {
    if (bucket.resetAt <= now) ipBuckets.delete(ip);
  }
}

export type RateLimitResult = { allowed: true } | { allowed: false; reason: "ip" | "global" };

export function checkRateLimit(ip: string): RateLimitResult {
  maybeCleanup();
  const now = Date.now();

  if (globalBucket.resetAt <= now) {
    globalBucket = { count: 0, resetAt: startOfNextUtcDay() };
  }
  if (globalBucket.count >= GLOBAL_DAILY_LIMIT) {
    return { allowed: false, reason: "global" };
  }

  let bucket = ipBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + HOUR_MS };
    ipBuckets.set(ip, bucket);
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
