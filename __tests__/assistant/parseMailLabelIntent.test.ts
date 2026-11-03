import { describe, expect, it } from "vitest";

import {
  parseMailIntents,
  parseMailLabelIntent,
} from "@/features/assistant/model/parseMailIntents";

describe("parseMailLabelIntent", () => {
  it.each([
    "donne moi les mails label DEV",
    "donne-moi les mails labels DEV",
    "mails lable DEV",
    "montre mes mails DEV",
    "liste les mails FACTURES",
    "mails en DEV",
    "qu'est-ce que j'ai en DEV",
    "affiche-moi les emails catégorie Tech & Dev",
    "résume les mails label DEV",
    "filtre sur FACTURES",
    "contenu inbox DEV",
    "show me mails label DEV",
  ])("reconnaît: %s", (phrase) => {
    const intent = parseMailLabelIntent(phrase);
    expect(intent?.kind).toBe("mail.list_by_label");
    expect(intent?.label.toLowerCase()).toMatch(/dev|facture/);
  });

  it("accepte libellé et ponctuation", () => {
    expect(
      parseMailLabelIntent("Liste les emails avec le libellé « Tech & Dev »."),
    ).toEqual({ kind: "mail.list_by_label", label: "Tech & Dev" });
  });

  it("retourne null hors intent mail/label", () => {
    expect(parseMailLabelIntent("quelle heure est-il ?")).toBeNull();
    expect(parseMailLabelIntent("bonjour")).toBeNull();
  });
});

describe("parseMailIntents — variantes", () => {
  it("détecte les mails signalés", () => {
    expect(parseMailIntents("montre les mails signalés")).toEqual({
      kind: "mail.list_flagged",
    });
    expect(parseMailIntents("flagged emails")).toEqual({
      kind: "mail.list_flagged",
    });
  });

  it("détecte les mails récents", () => {
    expect(parseMailIntents("derniers mails")).toEqual({
      kind: "mail.list_recent",
    });
    expect(parseMailIntents("inbox")).toEqual({ kind: "mail.list_recent" });
  });

  it("détecte le compte", () => {
    expect(parseMailIntents("combien de mails")).toEqual({
      kind: "mail.count",
    });
  });

  it("détecte les envois par label", () => {
    expect(parseMailIntents("ce que j'ai répondu en DEV")).toEqual({
      kind: "mail.list_sent_by_label",
      label: "DEV",
    });
  });
});
