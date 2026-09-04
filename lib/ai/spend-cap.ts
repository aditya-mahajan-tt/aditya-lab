/**
 * Hard monthly spend cap (AI_SPEC.md §5). State is in-memory — same caveat
 * as rate-limit.ts, resets on cold start. This is a soft safety net on top
 * of the hourly/daily rate limits, not the sole defence; while the AI
 * provider account is on Groq's free tier there is no real spend to cap in
 * the first place, but the mechanism stays wired for when a paid tier or a
 * different provider is used.
 *
 * Price is a single configurable estimate rather than a hardcoded
 * per-model lookup table, since published pricing changes and a stale
 * table would be worse than an honest, operator-set estimate.
 */

const MONTHLY_CAP_USD = Number(process.env.AI_MONTHLY_SPEND_CAP_USD ?? 10);
const PRICE_PER_1K_TOKENS_USD = Number(process.env.AI_PRICE_PER_1K_TOKENS_USD ?? 0.001);

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth()}`;
}

let state = { month: currentMonthKey(), spentUsd: 0 };

function rolloverIfNewMonth() {
  const month = currentMonthKey();
  if (state.month !== month) {
    state = { month, spentUsd: 0 };
  }
}

export function recordSpend(totalTokens: number) {
  rolloverIfNewMonth();
  state.spentUsd += (totalTokens / 1000) * PRICE_PER_1K_TOKENS_USD;
}

export function spendCapExceeded(): boolean {
  rolloverIfNewMonth();
  return state.spentUsd >= MONTHLY_CAP_USD;
}
