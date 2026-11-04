import { describe, expect, it } from "vitest";

import { canSetMailAccountStatus } from "@/features/mail/model/canSetMailAccountStatus";

describe("canSetMailAccountStatus", () => {
  it("refuse needs_reauth → active", () => {
    expect(canSetMailAccountStatus("needs_reauth", "active")).toBe(false);
  });

  it("autorise needs_reauth → disabled et active ↔ disabled", () => {
    expect(canSetMailAccountStatus("needs_reauth", "disabled")).toBe(true);
    expect(canSetMailAccountStatus("active", "disabled")).toBe(true);
    expect(canSetMailAccountStatus("disabled", "active")).toBe(true);
  });
});
