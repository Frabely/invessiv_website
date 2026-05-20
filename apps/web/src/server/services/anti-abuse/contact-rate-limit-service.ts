import "server-only";

const REQUEST_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(now: number) {
  for (const [identifier, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(identifier);
    }
  }
}

export function checkContactRateLimit(identifier: string, now = Date.now()) {
  cleanupExpiredEntries(now);

  const currentEntry = rateLimitStore.get(identifier);
  if (!currentEntry || currentEntry.resetAt <= now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return { allowed: true as const };
  }

  if (currentEntry.count >= REQUEST_LIMIT) {
    return {
      allowed: false as const,
      retryAfterMs: currentEntry.resetAt - now,
    };
  }

  rateLimitStore.set(identifier, {
    ...currentEntry,
    count: currentEntry.count + 1,
  });

  return { allowed: true as const };
}

export function resetContactRateLimitStore() {
  rateLimitStore.clear();
}
