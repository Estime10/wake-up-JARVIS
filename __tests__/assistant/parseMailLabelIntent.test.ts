import { describe, expect, it } from "vitest";

import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";

describe("mail label phrases", () => {
  it.each([
    "donne moi les mails label DEV",
    "mails du label DEV",
    "montre mes mails DEV",
    "affiche les mails FACTURES",
    "mails en DEV",
    "y a quoi dans DEV",
    "show emails labeled DEV",
  ])("reconnaît: %s", (phrase) => {
    const intent = parseAssistantIntent(phrase);
    expect(intent?.kind).toBe("mail.list_by_label");
    if (intent?.kind === "mail.list_by_label") {
      expect(intent.label.toLowerCase()).toMatch(/dev|facture/);
    }
  });

  it("retourne null hors intent", () => {
    expect(parseAssistantIntent("quelle heure est-il ?")).toEqual({
      kind: "refuse.write",
    });
    expect(parseAssistantIntent("xyzzy foobar")).toBeNull();
  });
});
