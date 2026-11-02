import { describe, expect, it } from "vitest";

import { mailboxShortLabel } from "@/features/mail/model/mailboxShortLabel";

describe("mailboxShortLabel", () => {
  it("retire @gmail.com", () => {
    expect(mailboxShortLabel("estimevangu@gmail.com")).toBe("estimevangu");
    expect(mailboxShortLabel("estimevangu.pro@gmail.com")).toBe(
      "estimevangu.pro",
    );
  });

  it("garde le local pour tout domaine", () => {
    expect(mailboxShortLabel("dev@estimevangu.pro")).toBe("dev");
  });
});
