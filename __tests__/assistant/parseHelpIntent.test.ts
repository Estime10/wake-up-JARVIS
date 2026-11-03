import { describe, expect, it } from "vitest";

import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";

describe("help phrases", () => {
  it("reconnaît l’aide", () => {
    expect(parseAssistantIntent("aide")).toEqual({ kind: "help" });
    expect(parseAssistantIntent("Que peux-tu faire ?")).toEqual({
      kind: "help",
    });
    expect(parseAssistantIntent("what can you do")).toEqual({ kind: "help" });
  });

  it("ignore le hors-sujet", () => {
    expect(parseAssistantIntent("mails label DEV")?.kind).toBe(
      "mail.list_by_label",
    );
  });
});
