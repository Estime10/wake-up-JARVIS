import { describe, expect, it } from "vitest";

import { mailSenderDisplayName } from "@/features/mail/model/mailSenderDisplayName";

describe("mailSenderDisplayName", () => {
  it("extrait le nom affiché", () => {
    expect(mailSenderDisplayName("Camille Royer <camille@example.com>")).toBe(
      "Camille Royer",
    );
  });

  it("retombe sur l’adresse seule", () => {
    expect(mailSenderDisplayName("ops@example.com")).toBe("ops@example.com");
  });
});
