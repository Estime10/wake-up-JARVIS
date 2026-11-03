import { describe, expect, it } from "vitest";

import { TTS_MAX_CHARS } from "@/lib/voice/lexiconFr";
import { normalizeFr } from "@/lib/voice/normalizeFr";

describe("normalizeFr — CA-A1", () => {
  it("lit les prix en euros", () => {
    expect(normalizeFr("Le total est 49,99 €.")).toContain("49 euros 99");
    expect(normalizeFr("Ça coûte 12 €")).toContain("12 euros");
  });

  it("lit les heures", () => {
    expect(normalizeFr("RDV à 14h30")).toBe("RDV à 14 heures 30");
    expect(normalizeFr("départ 9h00")).toBe("départ 9 heures");
  });

  it("lit les PR", () => {
    expect(normalizeFr("Voir PR #42")).toBe("Voir pull request numéro 42");
  });

  it("tronque au-delà du plafond", () => {
    const long = "a".repeat(TTS_MAX_CHARS + 200);
    const out = normalizeFr(long);
    expect(out.length).toBeLessThanOrEqual(
      TTS_MAX_CHARS + " La suite est affichée à l'écran.".length,
    );
    expect(out).toContain("La suite est affichée à l'écran");
  });
});
