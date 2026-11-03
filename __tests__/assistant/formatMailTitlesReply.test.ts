import { describe, expect, it } from "vitest";

import { formatMailTitlesReply } from "@/features/assistant/model/formatMailTitlesReply";

describe("formatMailTitlesReply", () => {
  it("affiche seulement nom uppercase + snippet", () => {
    const text = formatMailTitlesReply("DEV", [
      {
        from: "Camille Royer <camille@example.com>",
        excerpt: "Peux-tu checker la PR ?",
      },
      {
        from: "ops@example.com",
        excerpt: "Deploy terminé.",
      },
    ]);
    expect(text).toContain("1. CAMILLE ROYER");
    expect(text).toContain("Peux-tu checker la PR ?");
    expect(text).toContain("2. OPS@EXAMPLE.COM");
    expect(text).toContain("Deploy terminé.");
    expect(text).not.toContain("PR review");
    expect(text).not.toContain("DEV/GitHub");
  });

  it("signale l’absence de mails", () => {
    expect(formatMailTitlesReply("DEV", [])).toMatch(/Aucun mail/i);
  });
});
