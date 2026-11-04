/** Rate limit mémoire process — debounce relève par user. */

const DEFAULT_WINDOW_MS = 60_000;

const lastPollAt = new Map<string, number>();

export function consumeMailPollSlot(
  userId: string,
  now: number = Date.now(),
  windowMs: number = DEFAULT_WINDOW_MS,
): { ok: true } | { ok: false; retryAfterMs: number } {
  const previous = lastPollAt.get(userId);
  if (previous !== undefined && now - previous < windowMs) {
    return { ok: false, retryAfterMs: windowMs - (now - previous) };
  }
  lastPollAt.set(userId, now);
  return { ok: true };
}

/** Tests uniquement. */
export function resetMailPollRateLimitForTests(): void {
  lastPollAt.clear();
}
