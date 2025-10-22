// Tiny in-memory token bucket (Edge/global). For production, use Upstash Redis.
const BUCKET: Map<string, { tokens: number; reset: number }> = (globalThis as any).__rl__ || new Map();
(globalThis as any).__rl__ = BUCKET;

export function rateLimit(key: string, limit = 60, windowSec = 60) {
  const now = Date.now();
  const item = BUCKET.get(key);
  if (!item || now > item.reset) {
    BUCKET.set(key, { tokens: limit - 1, reset: now + windowSec * 1000 });
    return { ok: true, remaining: limit - 1, reset: now + windowSec * 1000 };
  }
  if (item.tokens <= 0) {
    return { ok: false, remaining: 0, reset: item.reset };
  }
  item.tokens -= 1;
  return { ok: true, remaining: item.tokens, reset: item.reset };
}
