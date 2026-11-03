import { describe, expect, it } from "vitest";

import {
  matchCustomPhraseRule,
  ruleToIntent,
  type CustomPhraseRule,
} from "@/features/assistant/model/customPhraseRules";
import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";

describe("customPhraseRules", () => {
  it("matche une phrase perso injectée", () => {
    const rules: CustomPhraseRule[] = [
      {
        id: "1",
        phrase: "check la boite DEV",
        kind: "mail.list_by_label",
        label: "DEV",
      },
    ];
    expect(matchCustomPhraseRule("check la boite DEV", rules)).toEqual({
      kind: "mail.list_by_label",
      label: "DEV",
    });
    expect(
      parseAssistantIntent("check la boite DEV", { customRules: rules }),
    ).toEqual({
      kind: "mail.list_by_label",
      label: "DEV",
    });
    expect(
      ruleToIntent({
        id: "2",
        phrase: "salut perso",
        kind: "chat.greeting",
      }),
    ).toEqual({ kind: "chat.greeting" });
  });
});
