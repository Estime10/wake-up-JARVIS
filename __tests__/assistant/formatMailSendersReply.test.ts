import { describe, expect, it } from "vitest";

import { formatMailSendersReply } from "@/features/assistant/model/formatMailSendersReply";

describe("formatMailSendersReply", () => {
  it("liste uniquement les noms d’expéditeurs", () => {
    const text = formatMailSendersReply([
      { from: "Paul <paul@x.com>" },
      { from: "Kozy <kozy@y.com>" },
      { from: "Paul <paul@x.com>" },
    ]);
    expect(text).toContain("3");
    expect(text).toContain("Paul");
    expect(text).toContain("Kozy");
    expect(text).not.toContain("@");
    expect(text).not.toContain("sujet");
  });

  it("signale l’absence de mails", () => {
    expect(formatMailSendersReply([])).toMatch(/aucun mail/i);
  });
});
