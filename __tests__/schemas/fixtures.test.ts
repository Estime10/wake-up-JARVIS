import { describe, expect, it } from "vitest";
import { z } from "zod";

import { MOCK_JOURNAL } from "@/fixtures/journal";
import { MOCK_MAILS } from "@/fixtures/mails";
import { MOCK_SEED_MESSAGES } from "@/fixtures/messages";
import {
  journalEntrySchema,
  mailSummarySchema,
  messageSchema,
} from "@/lib/schemas";

describe("fixtures Zod", () => {
  it("valide les mails mock", () => {
    expect(MOCK_MAILS.length).toBeGreaterThan(0);
    for (const mail of MOCK_MAILS) {
      expect(mailSummarySchema.parse(mail)).toEqual(mail);
    }
  });

  it("rejette un mail invalide", () => {
    const result = mailSummarySchema.safeParse({
      id: "bad",
      from: "x",
      subject: "y",
      excerpt: "z",
      time: "not-a-time",
      unread: true,
    });
    expect(result.success).toBe(false);
  });

  it("valide les messages seed", () => {
    expect(z.array(messageSchema).parse(MOCK_SEED_MESSAGES)).toHaveLength(1);
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
