import { describe, expect, it } from "vitest";

import {
  gmailAfterDateQuery,
  isWithinMailWindow,
  startOfMailWindow,
} from "@/features/mail/model/mailWindow";

describe("mailWindow", () => {
  it("startOfMailWindow = minuit J-2", () => {
    const now = new Date("2026-11-02T15:00:00");
    const start = startOfMailWindow(now);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(9);
    expect(start.getDate()).toBe(31);
    expect(start.getHours()).toBe(0);
  });

  it("isWithinMailWindow accepte J-2, veille et jour", () => {
    const now = new Date("2026-11-02T15:00:00");
    expect(isWithinMailWindow(new Date("2026-10-31T08:00:00"), now)).toBe(true);
    expect(isWithinMailWindow(new Date("2026-11-01T08:00:00"), now)).toBe(true);
    expect(isWithinMailWindow(new Date("2026-11-02T10:00:00"), now)).toBe(true);
    expect(isWithinMailWindow(new Date("2026-10-30T23:59:00"), now)).toBe(
      false,
    );
  });

  it("gmailAfterDateQuery est exclusif J-3", () => {
    const now = new Date("2026-11-02T15:00:00");
    expect(gmailAfterDateQuery(now)).toBe("after:2026/10/30");
  });
});
