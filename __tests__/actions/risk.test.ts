import { describe, expect, it } from "vitest";

import {
  enterSubmits,
  initialFocusTarget,
  requiresSignature,
} from "@/lib/actions/risk";

describe("action risk rules", () => {
  it("niveau 1 : pas de signature, focus Exécuter, Entrée lance", () => {
    expect(requiresSignature(1)).toBe(false);
    expect(initialFocusTarget(1)).toBe("execute");
    expect(enterSubmits(1)).toBe(true);
  });

  it("niveau 2 : signature, focus Annuler, Entrée inerte", () => {
    expect(requiresSignature(2)).toBe(true);
    expect(initialFocusTarget(2)).toBe("cancel");
    expect(enterSubmits(2)).toBe(false);
  });

  it("niveau 3 : signature, focus Annuler, Entrée inerte", () => {
    expect(requiresSignature(3)).toBe(true);
    expect(initialFocusTarget(3)).toBe("cancel");
    expect(enterSubmits(3)).toBe(false);
  });
});
