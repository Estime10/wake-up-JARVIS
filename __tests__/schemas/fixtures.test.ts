import { describe, expect, it } from "vitest";
import { z } from "zod";

import { MOCK_JOURNAL } from "@/fixtures/journal";
import {
  journalEntrySchema,
  mailSummarySchema,
  messageSchema,
} from "@/lib/schemas";

describe("fixtures Zod", () => {
  it("rejette un mail invalide (schéma live)", () => {
    const result = mailSummarySchema.safeParse({
      id: "bad",
      accountId: "acc_x",
      from: "x",
      subject: "y",
      excerpt: "z",
      time: "not-a-time",
      unread: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejette un message sans createdAt ISO", () => {
    const result = messageSchema.safeParse({
      id: "m1",
      role: "user",
      text: "bonjour",
      createdAt: "hier",
    });
    expect(result.success).toBe(false);
  });

  it("valide le journal mock", () => {
    expect(z.array(journalEntrySchema).parse(MOCK_JOURNAL).length).toBe(3);
  });
});
