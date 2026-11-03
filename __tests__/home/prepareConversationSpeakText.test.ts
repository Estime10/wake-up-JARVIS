import { describe, expect, it } from "vitest";

import { prepareConversationSpeakText } from "@/features/home/model/prepareConversationSpeakText";

describe("prepareConversationSpeakText", () => {
  it("ne lit que la première ligne (résumé liste)", () => {
    expect(
      prepareConversationSpeakText(
        "Voici les 11 mails avec le label DEV :\n\n1. ALICE\nsnippet",
      ),
    ).toBe("Voici les 11 mails avec le label DEV");
  });

  it("ignore les lignes vides en tête", () => {
    expect(prepareConversationSpeakText("\n\nOK seul")).toBe("OK seul");
  });
});
