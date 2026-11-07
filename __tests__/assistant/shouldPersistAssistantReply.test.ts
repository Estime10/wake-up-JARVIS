import { describe, expect, it } from "vitest";

import { shouldPersistAssistantReply } from "@/features/assistant/model/shouldPersistAssistantReply";

describe("shouldPersistAssistantReply", () => {
  it("persiste les réponses hors mail", () => {
    expect(shouldPersistAssistantReply(null)).toBe(true);
    expect(shouldPersistAssistantReply({ kind: "help" })).toBe(true);
    expect(shouldPersistAssistantReply({ kind: "chat.greeting" })).toBe(true);
  });

  it("refuse la persistance des intents mail.*", () => {
    expect(shouldPersistAssistantReply({ kind: "mail.overview" })).toBe(false);
    expect(shouldPersistAssistantReply({ kind: "mail.list_recent" })).toBe(
      false,
    );
    expect(
      shouldPersistAssistantReply({ kind: "mail.list_by_label", label: "DEV" }),
    ).toBe(false);
  });
});
