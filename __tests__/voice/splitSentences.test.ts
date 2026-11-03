import { describe, expect, it } from "vitest";

import { splitSentences } from "@/lib/voice/splitSentences";

describe("splitSentences", () => {
  it("découpe sur ponctuation forte", () => {
    expect(splitSentences("Bonjour. Ça va ? Oui !")).toEqual([
      "Bonjour.",
      "Ça va ?",
      "Oui !",
    ]);
  });

  it("garde une seule phrase sans ponctuation", () => {
    expect(splitSentences("salut jarvis")).toEqual(["salut jarvis"]);
  });

  it("ignore le vide", () => {
    expect(splitSentences("   ")).toEqual([]);
  });
});
