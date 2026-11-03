import { describe, expect, it } from "vitest";

import { parseHelpIntent } from "@/features/assistant/model/parseHelpIntent";

describe("parseHelpIntent", () => {
  it("reconnaît l’aide", () => {
    expect(parseHelpIntent("aide")).toEqual({ kind: "help" });
    expect(parseHelpIntent("Que peux-tu faire ?")).toEqual({ kind: "help" });
    expect(parseHelpIntent("what can you do")).toEqual({ kind: "help" });
    expect(parseHelpIntent("menu")).toEqual({ kind: "help" });
  });

  it("ignore le hors-sujet", () => {
    expect(parseHelpIntent("mails label DEV")).toBeNull();
  });
});
