/** Exact-match answer cache, 24h TTL (AI_SPEC.md §5). In-memory, per server instance. */

type Entry = { answer: string; expiresAt: number };

const TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map<string, Entry>();

function normalize(question: string): string {
  return question.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getCached(question: string): string | null {
  const entry = cache.get(normalize(question));
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(normalize(question));
    return null;
  }
  return entry.answer;
}

export function setCached(question: string, answer: string) {
  cache.set(normalize(question), { answer, expiresAt: Date.now() + TTL_MS });
}
