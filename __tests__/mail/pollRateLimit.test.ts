import { beforeEach, describe, expect, it } from "vitest";

import {
  consumeMailPollSlot,
  resetMailPollRateLimitForTests,
} from "@/lib/mail/pollRateLimit";

describe("consumeMailPollSlot", () => {
  beforeEach(() => {
    resetMailPollRateLimitForTests();
  });

  it("autorise le premier appel", () => {
    expect(consumeMailPollSlot("u1", 1_000).ok).toBe(true);
  });

  it("refuse le second dans la fenêtre", () => {
    expect(consumeMailPollSlot("u1", 1_000).ok).toBe(true);
    const second = consumeMailPollSlot("u1", 1_500);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("réautorise après la fenêtre", () => {
    expect(consumeMailPollSlot("u1", 1_000).ok).toBe(true);
    expect(consumeMailPollSlot("u1", 61_000).ok).toBe(true);
  });
});
