import { describe, expect, it } from "vitest";

import { isGmailSentMessage } from "@/features/mail/model/isGmailSentMessage";

describe("isGmailSentMessage", () => {
  it("détecte SENT", () => {
    expect(isGmailSentMessage(["INBOX", "UNREAD"])).toBe(false);
    expect(isGmailSentMessage(["SENT"])).toBe(true);
    expect(isGmailSentMessage(["INBOX", "SENT"])).toBe(true);
  });
});
