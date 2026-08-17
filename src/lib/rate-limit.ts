/**
 * Small fixed-window rate limiter, held in the process's memory.
 *
 * Caveat worth knowing: on a serverless host each instance keeps its own
 * counters, so a determined attacker spread across many cold starts gets more
 * attempts than the numbers below suggest. It still turns an unlimited online
 * brute force into a slow, expensive one. If the passcode ever protects
 * something higher-value, move these counters into Postgres so they are shared.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Drop expired buckets occasionally so the map can't grow without bound.
function prune(now: number) {
  if (buckets.size < 500) return;
  for (const [key, b] of buckets) {
    if (now > b.resetAt) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets. Only meaningful when ok is false. */
  retryAfter: number;
  remaining: number;
}

export function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  prune(now);

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0, remaining: max - 1 };
  }

  bucket.count += 1;
  if (bucket.count > max) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      remaining: 0,
    };
  }
  return { ok: true, retryAfter: 0, remaining: max - bucket.count };
}

/** Called after a success so a legitimate admin isn't punished for typos. */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

/** Best-effort client address. Vercel sets x-forwarded-for. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
