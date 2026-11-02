import { describe, expect, it } from "vitest";

import { flagUnusual } from "@/features/mail/model/flagUnusual";

describe("flagUnusual", () => {
  it("détecte une alerte sécurité", () => {
    expect(
      flagUnusual({
        fromRaw: "noreply@google.com",
        subject: "Security alert",
        snippet: "New sign-in on Windows",
      })?.reason,
    ).toBe("alerte sécurité");
  });

  it("détecte un impayé", () => {
    expect(
      flagUnusual({
        fromRaw: "factures@acme.com",
        subject: "Relance impayé",
        snippet: "Solde dû sous 7 jours",
      })?.reason,
    ).toBe("impayé");
  });

  it("retourne null si rien d’inhabituel", () => {
    expect(
      flagUnusual({
        fromRaw: "news@newsletter.local",
        subject: "Weekly digest",
        snippet: "This week in TypeScript",
      }),
    ).toBeNull();
  });
});
