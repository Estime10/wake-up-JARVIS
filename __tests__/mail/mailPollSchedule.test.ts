import { afterEach, describe, expect, it, vi } from "vitest";

import { runMailPoll } from "@/features/mail/model/mailPollSchedule";

describe("runMailPoll", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retourne false si fetch échoue (réseau / serveur)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(runMailPoll()).resolves.toBe(false);
  });

  it("retourne true si HTTP OK", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true } as Response));

    await expect(runMailPoll()).resolves.toBe(true);
  });

  it("retourne false si HTTP non OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response),
    );

    await expect(runMailPoll()).resolves.toBe(false);
  });
});
