import { describe, expect, it } from "vitest";

import {
  countPhraseSlots,
  matchPhraseCatalog,
} from "@/features/assistant/model/matchPhraseCatalog";

describe("matchPhraseCatalog anti-ReDoS", () => {
  it("compte les slots", () => {
    expect(countPhraseSlots("{label} {label} {label} x")).toBe(3);
  });

  it("ignore les phrases à plus de 2 slots", () => {
    const started = Date.now();
    const result = matchPhraseCatalog("a b c x", [
      "{label} {label} {label} {label} x",
    ]);
    expect(result).toBeNull();
    expect(Date.now() - started).toBeLessThan(50);
  });

  it("borne le texte à 300 caractères", () => {
    expect(matchPhraseCatalog("a".repeat(301), ["hello {label}"])).toBeNull();
  });
});
