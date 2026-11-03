import { describe, expect, it } from "vitest";

import { formatMailTitlesReply } from "@/features/assistant/model/formatMailTitlesReply";

describe("formatMailTitlesReply", () => {
  it("affiche nom uppercase + subject (pas le snippet)", () => {
    const text = formatMailTitlesReply("DEV", [
      {
        from: "Camille Royer <camille@example.com>",
        subject: "PR review",
      },
      {
        from: "ops@example.com",
        subject: "Deploy terminé",
      },
    ]);
    expect(text).toContain("1. CAMILLE ROYER");
    expect(text).toContain("PR review");
    expect(text).toContain("2. OPS@EXAMPLE.COM");
    expect(text).toContain("Deploy terminé");
    expect(text).not.toContain("Peux-tu checker");
  });

  it("signale l’absence de mails", () => {
    expect(formatMailTitlesReply("DEV", [])).toMatch(/Aucun mail/i);
  });
});
