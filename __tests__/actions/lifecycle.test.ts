import { describe, expect, it } from "vitest";

import { transitionAction } from "@/lib/actions/lifecycle";

describe("action card lifecycle", () => {
  it("niveau 1 : CONFIRM → running", () => {
    expect(transitionAction("pending", { type: "CONFIRM" }, 1)).toBe("running");
  });

  it("niveau 2 : CONFIRM → awaiting_signature", () => {
    expect(transitionAction("pending", { type: "CONFIRM" }, 2)).toBe(
      "awaiting_signature",
    );
  });

  it("refus de signature → pending (pas cancelled)", () => {
    expect(
      transitionAction("awaiting_signature", { type: "SIGNATURE_REFUSED" }, 3),
    ).toBe("pending");
  });

  it("signature OK → running", () => {
    expect(
      transitionAction("awaiting_signature", { type: "SIGNATURE_OK" }, 2),
    ).toBe("running");
  });

  it("expiration depuis pending", () => {
    expect(transitionAction("pending", { type: "EXPIRE" }, 1)).toBe("expired");
  });

  it("running → succeeded / failed / cancelled", () => {
    expect(transitionAction("running", { type: "SUCCEED" }, 1)).toBe(
      "succeeded",
    );
    expect(transitionAction("running", { type: "FAIL" }, 1)).toBe("failed");
    expect(transitionAction("running", { type: "CANCEL" }, 1)).toBe(
      "cancelled",
    );
  });

  it("états terminaux stables (sauf déjà terminal)", () => {
    expect(transitionAction("succeeded", { type: "CONFIRM" }, 1)).toBe(
      "succeeded",
    );
    expect(transitionAction("cancelled", { type: "CANCEL" }, 1)).toBe(
      "cancelled",
    );
  });
});
